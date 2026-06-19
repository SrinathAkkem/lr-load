import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { formatCurrency } from "@/lib/services/lr-service";
import { prisma } from "@/lib/db/prisma";
import { ReportsFilters } from "./filters";
import type { LRStatus } from "@/lib/types";
import { Download, FileSpreadsheet, FileText } from "lucide-react";

export const dynamic = "force-dynamic";

interface SearchParams {
  from?: string;
  to?: string;
  status?: string;
  paymentMode?: string;
  branchId?: string;
}

const STATUS_VALUES: LRStatus[] = ["pending", "approved", "rejected", "in_transit", "delivered"];
const PAYMENT_VALUES = ["TO_PAY", "PAID", "TO_BE_BILLED"] as const;

function parseDate(s: string | undefined, fallback: Date) {
  if (!s) return fallback;
  const d = new Date(s);
  return isNaN(d.getTime()) ? fallback : d;
}

export default async function CompanyReportsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await getSession();
  if (!session?.companyId) redirect("/company/login");
  const companyId = session.companyId;

  const params = await searchParams;
  const today = new Date();
  const defaultFrom = new Date(today.getFullYear(), today.getMonth(), 1);
  const defaultTo = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const from = parseDate(params.from, defaultFrom);
  const toRaw = parseDate(params.to, defaultTo);
  const to = new Date(toRaw);
  to.setHours(23, 59, 59, 999);

  const status = STATUS_VALUES.includes(params.status as LRStatus) ? (params.status as LRStatus) : undefined;
  const paymentMode = PAYMENT_VALUES.includes(params.paymentMode as (typeof PAYMENT_VALUES)[number])
    ? (params.paymentMode as (typeof PAYMENT_VALUES)[number]) : undefined;
  const branchId = params.branchId && params.branchId !== "all" ? params.branchId : undefined;

  const where = {
    companyId,
    createdAt: { gte: from, lte: to },
    ...(status ? { status } : {}),
    ...(paymentMode ? { paymentMode } : {}),
    ...(branchId ? { branchId } : {}),
  };

  const company = await prisma.company.findUnique({ where: { id: companyId } });

  const [branches, lrs] = await Promise.all([
    prisma.branch.findMany({ where: { companyId }, orderBy: { name: "asc" }, select: { id: true, name: true, city: true } }),
    prisma.lRRequest.findMany({
      where,
      select: { status: true, paymentMode: true, freightAmount: true, originCity: true, destinationCity: true, driverId: true, branchId: true, createdAt: true },
    }),
  ]);

  const topDrivers = await prisma.lRRequest.groupBy({
    by: ["driverId"],
    where: { companyId, createdAt: { gte: from, lte: to }, status: { not: "rejected" } },
    _count: { _all: true },
    _sum: { freightAmount: true },
    orderBy: { _sum: { freightAmount: "desc" } },
    take: 5,
  });
  const driverIds = topDrivers.map((d) => d.driverId);
  const driverInfo = await prisma.user.findMany({
    where: { id: { in: driverIds } },
    select: { id: true, name: true, branch: { select: { name: true } } },
  });
  const driverMap = new Map(driverInfo.map((d) => [d.id, d]));

  const totalCount = lrs.length;
  const freightTotal = lrs.reduce((s, lr) => s + Number(lr.freightAmount.toString()), 0);
  const approved = lrs.filter((lr) => lr.status === "approved" || lr.status === "in_transit" || lr.status === "delivered").length;
  const rejected = lrs.filter((lr) => lr.status === "rejected").length;
  const pending = lrs.filter((lr) => lr.status === "pending").length;
  const decided = approved + rejected;
  const approvalRate = decided > 0 ? (approved / decided) * 100 : 0;
  const avgPerLr = totalCount > 0 ? Math.round(freightTotal / totalCount) : 0;
  const maxLr = company?.maxLrPerMonth ?? 500;

  const countByMode = (mode: string) => lrs.filter((lr) => lr.paymentMode === mode).length;
  const sumByMode = (mode: string) => lrs.filter((lr) => lr.paymentMode === mode).reduce((s, lr) => s + Number(lr.freightAmount.toString()), 0);

  const paymentBreakdown = PAYMENT_VALUES.map((mode) => ({
    mode,
    label: mode === "TO_PAY" ? "To Pay" : mode === "PAID" ? "Paid" : "To Be Billed",
    count: countByMode(mode),
    total: sumByMode(mode),
    pct: totalCount > 0 ? (countByMode(mode) / totalCount) * 100 : 0,
  }));

  const branchLrCounts = new Map<string, number>();
  for (const lr of lrs) branchLrCounts.set(lr.branchId, (branchLrCounts.get(lr.branchId) ?? 0) + 1);
  const lrsByBranch = branches.map((b) => ({ ...b, count: branchLrCounts.get(b.id) ?? 0 })).sort((a, b) => b.count - a.count);

  // Weekly volume
  const weekBuckets: { label: string; fullLabel: string; count: number; current: boolean }[] = [];
  const monthStart = new Date(from.getFullYear(), from.getMonth(), 1);
  for (let w = 0; w < 4; w++) {
    const wStart = new Date(monthStart); wStart.setDate(wStart.getDate() + w * 7);
    const wEnd = new Date(wStart); wEnd.setDate(wEnd.getDate() + 7);
    const wCount = lrs.filter((lr) => { const d = new Date(lr.createdAt); return d >= wStart && d < wEnd; }).length;
    const isCurrent = today >= wStart && today < wEnd;
    weekBuckets.push({ label: `W${w + 1}`, fullLabel: `Week ${w + 1}${isCurrent ? " (Curr.)" : ""}`, count: wCount, current: isCurrent });
  }

  const routeMap = new Map<string, { count: number; freight: number }>();
  for (const lr of lrs) {
    const key = `${lr.originCity} → ${lr.destinationCity}`;
    const e = routeMap.get(key) ?? { count: 0, freight: 0 };
    e.count += 1; e.freight += Number(lr.freightAmount.toString());
    routeMap.set(key, e);
  }
  const topRoutes = [...routeMap.entries()].map(([route, data]) => ({ route, ...data })).sort((a, b) => b.count - a.count).slice(0, 5);

  const exportQuery = new URLSearchParams();
  exportQuery.set("from", from.toISOString().slice(0, 10));
  exportQuery.set("to", toRaw.toISOString().slice(0, 10));
  if (status) exportQuery.set("status", status);
  if (paymentMode) exportQuery.set("paymentMode", paymentMode);
  if (branchId) exportQuery.set("branchId", branchId);

  const monthLabel = new Date(from).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  const dateRangeLabel = `${from.toLocaleDateString("en-IN", { month: "short", day: "2-digit" })}–${toRaw.toLocaleDateString("en-IN", { day: "2-digit" })}, ${from.getFullYear()}`;

  return (
    <div className="p-6 md:p-8">
      <ReportsFilters
        branches={branches}
        initial={{
          from: from.toISOString().slice(0, 10),
          to: toRaw.toISOString().slice(0, 10),
          status: status ?? "all",
          paymentMode: paymentMode ?? "all",
          branchId: branchId ?? "all",
        }}
      />

      {/* 3 KPI Cards */}
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total LRs Issued</p>
          <p className="mt-2 text-4xl font-bold text-blue-600">{totalCount}</p>
          <p className="mt-1 text-xs text-slate-500">{dateRangeLabel} · Limit: {maxLr}/month</p>
          <div className="mt-2 h-2 rounded-full bg-slate-100">
            <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${Math.min(100, (totalCount / maxLr) * 100)}%` }} />
          </div>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Freight Value</p>
          <p className="mt-2 text-4xl font-bold text-slate-900">{formatCurrency(freightTotal)}</p>
          <p className="mt-1 text-xs text-slate-500">Across {totalCount} LRs this period</p>
          <p className="text-xs text-slate-500">Avg per LR: {formatCurrency(avgPerLr)}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Approval Rate</p>
          <p className="mt-2 text-4xl font-bold text-emerald-600">{approvalRate.toFixed(1)}%</p>
          <p className="mt-1 text-xs text-slate-500">{approved} approved · {rejected} rejected · {pending} pending</p>
          <div className="mt-2 h-2 rounded-full bg-slate-100">
            <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${approvalRate}%` }} />
          </div>
        </div>
      </div>

      {/* LR Volume by Week + Top 5 Routes */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* LR Volume by Week */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">LR Volume by Week</h2>
            <span className="rounded-full bg-violet-50 px-3 py-1 text-[11px] font-semibold text-violet-700">
              {new Date(from).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
            </span>
          </div>
          <div className="mt-8 flex items-end justify-between gap-4 px-4">
            {weekBuckets.map((w) => {
              const maxCount = Math.max(...weekBuckets.map(b => b.count), 1);
              const barH = Math.max(12, (w.count / maxCount) * 120);
              return (
                <div key={w.label} className="flex flex-col items-center gap-2">
                  <div
                    className={`w-14 rounded-t-lg ${w.current ? "bg-violet-600" : "bg-violet-200"}`}
                    style={{ height: `${barH}px` }}
                  />
                  <span className="text-[10px] font-medium text-slate-500">{w.label}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-6 flex items-center gap-6 border-t border-slate-100 pt-4">
            {weekBuckets.map((w) => (
              <div key={w.label}>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{w.fullLabel}</p>
                <p className={`text-xl font-bold ${w.current ? "text-violet-600" : "text-slate-900"}`}>{w.count}</p>
                <p className="text-[10px] text-slate-400">{w.current ? "LRs so far" : "LRs"}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Top 5 Routes */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Top 5 Routes</h2>
            <span className="rounded-full bg-violet-50 px-3 py-1 text-[11px] font-semibold text-violet-700">
              By LR Volume
            </span>
          </div>
          <div className="mt-5 space-y-4">
            {topRoutes.length === 0 ? (
              <p className="text-sm text-slate-400">No data for this period.</p>
            ) : (
              topRoutes.map((r, i) => {
                const parts = r.route.split(" → ");
                return (
                  <div key={r.route} className="flex items-center gap-3">
                    <span className="w-6 text-sm font-bold text-slate-300">{String(i + 1).padStart(2, "0")}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800">
                        {parts[0]} <span className="text-slate-400">→</span> {parts[1]}
                      </p>
                      <p className="text-[11px] text-slate-400">{r.count} LRs · {formatCurrency(r.freight)} freight</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-20 rounded-full bg-slate-100">
                        <div className="h-2 rounded-full bg-blue-500" style={{ width: `${(r.count / (topRoutes[0]?.count || 1)) * 100}%` }} />
                      </div>
                      <span className="w-8 text-right text-sm font-bold text-slate-800">{r.count}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Freight by Payment Mode + Top Drivers */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Freight by Payment Mode */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Freight by Payment Mode</h2>
            <span className="rounded-full bg-violet-50 px-3 py-1 text-[11px] font-semibold text-violet-700">{monthLabel}</span>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3">
            {paymentBreakdown.map((p) => {
              const colors = { TO_PAY: "border-amber-200 bg-amber-50", PAID: "border-emerald-200 bg-emerald-50", TO_BE_BILLED: "border-indigo-200 bg-indigo-50" };
              const textColors = { TO_PAY: "text-amber-700", PAID: "text-emerald-700", TO_BE_BILLED: "text-indigo-700" };
              return (
                <div key={p.mode} className={`rounded-xl border p-3 text-center ${colors[p.mode]}`}>
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${textColors[p.mode]}`}>{p.label}</p>
                  <p className={`mt-1 text-xl font-bold ${textColors[p.mode]}`}>{formatCompact(p.total)}</p>
                  <p className="text-[10px] text-slate-500">{p.count} LRs · {Math.round(p.pct)}%</p>
                </div>
              );
            })}
          </div>

          <div className="mt-5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">LRs by Branch</p>
            <div className="mt-3 space-y-2.5">
              {lrsByBranch.slice(0, 5).map((b) => (
                <div key={b.id} className="flex items-center gap-3">
                  <span className="w-32 truncate text-xs font-medium text-slate-700">{b.name}</span>
                  <div className="flex-1 h-2 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-blue-500" style={{ width: `${totalCount > 0 ? (b.count / totalCount) * 100 : 0}%` }} />
                  </div>
                  <span className="w-8 text-right text-xs font-bold text-slate-700">{b.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Drivers by LR Volume */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Top Drivers by LR Volume</h2>
            <span className="rounded-full bg-violet-50 px-3 py-1 text-[11px] font-semibold text-violet-700">This Month</span>
          </div>

          {topDrivers.length === 0 ? (
            <p className="mt-4 text-sm text-slate-400">No data for this period.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left">
                    <th className="pb-2 pr-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">#</th>
                    <th className="pb-2 pr-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Driver</th>
                    <th className="pb-2 pr-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Branch</th>
                    <th className="pb-2 pr-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">LRs</th>
                    <th className="pb-2 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">Freight Value</th>
                  </tr>
                </thead>
                <tbody>
                  {topDrivers.map((td, i) => {
                    const driver = driverMap.get(td.driverId);
                    const inits = driver?.name.split(/\s+/).map(n => n[0]).join("").slice(0, 2).toUpperCase() ?? "??";
                    const colors = ["bg-violet-500", "bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-pink-500"];
                    return (
                      <tr key={td.driverId} className="border-b border-slate-50 last:border-0">
                        <td className="py-3 pr-3 text-xs font-bold text-slate-300">{String(i + 1).padStart(2, "0")}</td>
                        <td className="py-3 pr-3">
                          <div className="flex items-center gap-2">
                            <span className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white ${colors[i]}`}>{inits}</span>
                            <span className="font-medium text-slate-800">{driver?.name ?? "Unknown"}</span>
                          </div>
                        </td>
                        <td className="py-3 pr-3">
                          <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
                            {driver?.branch?.name ?? "—"}
                          </span>
                        </td>
                        <td className="py-3 pr-3 font-bold text-violet-700">{td._count?._all ?? 0}</td>
                        <td className="py-3 text-right font-semibold text-emerald-600">
                          {formatCurrency(Number(td._sum?.freightAmount?.toString() ?? "0"))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Export Full Report */}
      <div className="mt-8 flex items-center justify-between rounded-2xl bg-gradient-to-r from-[#1e1145] to-[#2d1b69] p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold">Export Full Report as PDF</h3>
            <p className="text-xs text-violet-300">
              Includes all LR details, route summary, freight breakdown and driver leaderboard for the selected period.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={`/api/reports/pdf?${exportQuery.toString()}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2.5 text-xs font-semibold text-slate-800 shadow transition hover:bg-slate-50"
          >
            <Download className="h-3.5 w-3.5" />
            Export PDF
          </a>
          <a
            href={`/api/reports/csv?${exportQuery.toString()}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-white/20"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Export CSV
          </a>
        </div>
      </div>
    </div>
  );
}

function formatCompact(amount: number): string {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount}`;
}
