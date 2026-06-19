import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { formatCurrency } from "@/lib/services/lr-service";
import { prisma } from "@/lib/db/prisma";
import { ReportsFilters } from "./filters";
import type { LRStatus } from "@/lib/types";
import { Download, FileSpreadsheet } from "lucide-react";

export const dynamic = "force-dynamic";

interface SearchParams {
  from?: string;
  to?: string;
  status?: string;
  paymentMode?: string;
  branchId?: string;
}

const STATUS_VALUES: LRStatus[] = [
  "pending",
  "approved",
  "rejected",
  "in_transit",
  "delivered",
];

const PAYMENT_VALUES = ["TO_PAY", "PAID", "TO_BE_BILLED"] as const;
const PAYMENT_LABELS: Record<string, string> = {
  TO_PAY: "To Pay",
  PAID: "Paid",
  TO_BE_BILLED: "To Be Billed",
};
const PAYMENT_COLORS: Record<string, string> = {
  TO_PAY: "bg-amber-500",
  PAID: "bg-emerald-500",
  TO_BE_BILLED: "bg-indigo-500",
};

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

  const status = STATUS_VALUES.includes(params.status as LRStatus)
    ? (params.status as LRStatus)
    : undefined;
  const paymentMode = PAYMENT_VALUES.includes(
    params.paymentMode as (typeof PAYMENT_VALUES)[number],
  )
    ? (params.paymentMode as (typeof PAYMENT_VALUES)[number])
    : undefined;
  const branchId = params.branchId && params.branchId !== "all"
    ? params.branchId
    : undefined;

  const where = {
    companyId,
    createdAt: { gte: from, lte: to },
    ...(status ? { status } : {}),
    ...(paymentMode ? { paymentMode } : {}),
    ...(branchId ? { branchId } : {}),
  };

  const company = await prisma.company.findUnique({ where: { id: companyId } });

  const [branches, lrs] = await Promise.all([
    prisma.branch.findMany({
      where: { companyId },
      orderBy: { name: "asc" },
      select: { id: true, name: true, city: true },
    }),
    prisma.lRRequest.findMany({
      where,
      select: {
        status: true,
        paymentMode: true,
        freightAmount: true,
        originCity: true,
        destinationCity: true,
        driverId: true,
        branchId: true,
        createdAt: true,
      },
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
    select: { id: true, name: true, branchId: true, branch: { select: { name: true } } },
  });
  const driverMap = new Map(driverInfo.map((d) => [d.id, d]));

  const totalCount = lrs.length;
  const freightTotal = lrs.reduce(
    (s, lr) => s + Number(lr.freightAmount.toString()),
    0,
  );
  const approved = lrs.filter(
    (lr) => lr.status === "approved" || lr.status === "in_transit" || lr.status === "delivered",
  ).length;
  const rejected = lrs.filter((lr) => lr.status === "rejected").length;
  const pending = lrs.filter((lr) => lr.status === "pending").length;
  const decided = approved + rejected;
  const approvalRate = decided > 0 ? (approved / decided) * 100 : 0;

  const sumFreight = (mode: (typeof PAYMENT_VALUES)[number]) =>
    lrs.filter((lr) => lr.paymentMode === mode).reduce(
      (s, lr) => s + Number(lr.freightAmount.toString()),
      0,
    );
  const countByMode = (mode: (typeof PAYMENT_VALUES)[number]) =>
    lrs.filter((lr) => lr.paymentMode === mode).length;

  const paymentBreakdown = PAYMENT_VALUES.map((mode) => ({
    mode,
    label: PAYMENT_LABELS[mode],
    count: countByMode(mode),
    total: sumFreight(mode),
    pct: totalCount > 0 ? (countByMode(mode) / totalCount) * 100 : 0,
  }));

  // LRs by branch
  const branchLrCounts = new Map<string, number>();
  for (const lr of lrs) {
    branchLrCounts.set(lr.branchId, (branchLrCounts.get(lr.branchId) ?? 0) + 1);
  }
  const lrsByBranch = branches
    .map((b) => ({ ...b, count: branchLrCounts.get(b.id) ?? 0 }))
    .sort((a, b) => b.count - a.count);

  // Weekly volume
  const weekBuckets: { label: string; count: number; current: boolean }[] = [];
  const monthStart = new Date(from.getFullYear(), from.getMonth(), 1);
  for (let w = 0; w < 4; w++) {
    const wStart = new Date(monthStart);
    wStart.setDate(wStart.getDate() + w * 7);
    const wEnd = new Date(wStart);
    wEnd.setDate(wEnd.getDate() + 7);
    const wCount = lrs.filter((lr) => {
      const d = new Date(lr.createdAt);
      return d >= wStart && d < wEnd;
    }).length;
    const isCurrent = today >= wStart && today < wEnd;
    weekBuckets.push({
      label: `W${w + 1}`,
      count: wCount,
      current: isCurrent,
    });
  }

  const routeMap = new Map<string, { count: number; freight: number }>();
  for (const lr of lrs) {
    const key = `${lr.originCity} → ${lr.destinationCity}`;
    const existing = routeMap.get(key) ?? { count: 0, freight: 0 };
    existing.count += 1;
    existing.freight += Number(lr.freightAmount.toString());
    routeMap.set(key, existing);
  }
  const topRoutes = [...routeMap.entries()]
    .map(([route, data]) => ({ route, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const exportQuery = new URLSearchParams();
  exportQuery.set("from", from.toISOString().slice(0, 10));
  exportQuery.set("to", toRaw.toISOString().slice(0, 10));
  if (status) exportQuery.set("status", status);
  if (paymentMode) exportQuery.set("paymentMode", paymentMode);
  if (branchId) exportQuery.set("branchId", branchId);

  const maxLr = company?.maxLrPerMonth ?? 500;
  const lrLimitPct = Math.min(100, (totalCount / maxLr) * 100);
  const avgPerLr = totalCount > 0 ? Math.round(freightTotal / totalCount) : 0;

  return (
    <div className="p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          {from.toLocaleDateString("en-IN")} — {toRaw.toLocaleDateString("en-IN")}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={`/api/reports/csv?${exportQuery.toString()}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-violet-300 hover:text-violet-700"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Export CSV
          </a>
          <a
            href={`/api/reports/pdf?${exportQuery.toString()}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
          >
            <Download className="h-3.5 w-3.5" />
            Export PDF
          </a>
        </div>
      </div>

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

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Total LRs Issued</p>
          <p className="mt-2 text-3xl font-bold text-blue-600">{totalCount.toLocaleString("en-IN")}</p>
          <p className="mt-1 text-xs text-slate-400">Limit: {maxLr}/month</p>
          <div className="mt-2 h-2 rounded-full bg-slate-100">
            <div
              className={`h-2 rounded-full transition-all ${lrLimitPct >= 90 ? "bg-red-500" : lrLimitPct >= 75 ? "bg-amber-500" : "bg-violet-500"}`}
              style={{ width: `${lrLimitPct}%` }}
            />
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Total Freight</p>
          <p className="mt-2 text-3xl font-bold text-emerald-600">{formatCurrency(freightTotal)}</p>
          <p className="mt-1 text-xs text-slate-400">Avg per LR: {formatCurrency(avgPerLr)}</p>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Approval Rate</p>
          <p className="mt-2 text-3xl font-bold text-violet-600">{approvalRate.toFixed(1)}%</p>
          <p className="mt-1 text-xs text-slate-400">{approved} approved · {rejected} rejected · {pending} pending</p>
          <div className="mt-2 h-2 rounded-full bg-slate-100">
            <div
              className="h-2 rounded-full bg-emerald-500 transition-all"
              style={{ width: `${approvalRate}%` }}
            />
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">LR Volume by Week</p>
          <div className="mt-3 flex items-end gap-2">
            {weekBuckets.map((w) => (
              <div key={w.label} className="flex flex-1 flex-col items-center gap-1">
                <div className="relative w-full">
                  <div
                    className={`w-full rounded-t ${w.current ? "bg-violet-600" : "bg-violet-200"}`}
                    style={{ height: `${Math.max(8, (w.count / (Math.max(...weekBuckets.map(b => b.count)) || 1)) * 60)}px` }}
                  />
                </div>
                <span className="text-[10px] font-semibold text-slate-500">{w.label}</span>
                <span className="text-[10px] font-bold text-slate-700">{w.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="font-semibold">Top 5 Routes</h2>
          <p className="text-xs text-slate-400">{new Date(from).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</p>
          {topRoutes.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No data for this filter.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {topRoutes.map((r, i) => (
                <div key={r.route} className="flex items-center gap-3 text-sm">
                  <span className="w-6 font-bold text-slate-400">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium">{r.route}</p>
                    <div className="mt-1 h-2 rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-violet-500"
                        style={{
                          width: `${(r.count / (topRoutes[0]?.count || 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{r.count} LRs</p>
                    <p className="text-xs text-slate-500">
                      {formatCurrency(r.freight)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="font-semibold">Freight by Payment Mode</h2>
          <div className="mt-4 space-y-4">
            {paymentBreakdown.map((p) => (
              <div key={p.mode}>
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <span className={`inline-block h-2.5 w-2.5 rounded-full ${PAYMENT_COLORS[p.mode]} mr-2`} />
                    <span className="font-semibold">{p.label}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900">{formatCurrency(p.total)}</span>
                    <span className="ml-2 text-xs text-slate-400">{p.count} LRs · {Math.round(p.pct)}%</span>
                  </div>
                </div>
                <div className="mt-1.5 h-2.5 rounded-full bg-slate-100">
                  <div
                    className={`h-2.5 rounded-full ${PAYMENT_COLORS[p.mode]} transition-all`}
                    style={{ width: `${p.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="font-semibold">LRs by Branch</h2>
          <p className="text-xs text-slate-400">{new Date(from).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</p>
          <div className="mt-4 space-y-3">
            {lrsByBranch.map((b) => {
              const bPct = totalCount > 0 ? (b.count / totalCount) * 100 : 0;
              return (
                <div key={b.id} className="flex items-center gap-3 text-sm">
                  <span className="w-36 truncate font-medium text-slate-700">{b.name}</span>
                  <div className="flex-1">
                    <div className="h-2 rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-blue-500 transition-all"
                        style={{ width: `${bPct}%` }}
                      />
                    </div>
                  </div>
                  <span className="w-12 text-right font-semibold">{b.count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="font-semibold">Top Drivers by LR Volume</h2>
          {topDrivers.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No data for this period.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b text-left text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="pb-2 pr-3">#</th>
                    <th className="pb-2 pr-3">Driver</th>
                    <th className="pb-2 pr-3">Branch</th>
                    <th className="pb-2 pr-3">LRs</th>
                    <th className="pb-2 text-right">Freight Value</th>
                  </tr>
                </thead>
                <tbody>
                  {topDrivers.map((td, i) => {
                    const driver = driverMap.get(td.driverId);
                    const initials = driver?.name
                      .split(/\s+/)
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase() ?? "??";
                    return (
                      <tr key={td.driverId} className="border-b last:border-0">
                        <td className="py-2.5 pr-3 font-bold text-slate-400">
                          {String(i + 1).padStart(2, "0")}
                        </td>
                        <td className="py-2.5 pr-3">
                          <div className="flex items-center gap-2">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-100 text-[10px] font-bold text-violet-700">
                              {initials}
                            </span>
                            <span className="font-medium">{driver?.name ?? "Unknown"}</span>
                          </div>
                        </td>
                        <td className="py-2.5 pr-3 text-slate-500">
                          {driver?.branch?.name ?? "—"}
                        </td>
                        <td className="py-2.5 pr-3 font-semibold">{td._count?._all ?? 0}</td>
                        <td className="py-2.5 text-right font-semibold text-violet-700">
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

      <div className="mt-8 rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="font-semibold">Export Full Report as PDF</h2>
        <p className="mt-1 text-sm text-slate-500">
          Includes all LR details, route summary, freight breakdown and driver leaderboard for the selected period.
        </p>
        <div className="mt-4 flex gap-3">
          <a
            href={`/api/reports/pdf?${exportQuery.toString()}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-violet-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
          >
            <Download className="h-3.5 w-3.5" />
            Export PDF
          </a>
          <a
            href={`/api/reports/csv?${exportQuery.toString()}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-violet-300 hover:text-violet-700"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Export CSV
          </a>
        </div>
      </div>
    </div>
  );
}
