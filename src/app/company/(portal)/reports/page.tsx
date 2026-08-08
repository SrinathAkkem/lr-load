import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { formatCurrency } from "@/lib/services/lr-service";
import { prisma } from "@/lib/db/prisma";
import { ReportsFilters } from "./filters";
import type { LRStatus } from "@/lib/types";
import { Route } from "lucide-react";
import {
  IconDocument,
  IconReceiptPending,
  IconOrderApprove,
  IconMoreDots,
} from "@/components/rono/dashboard-icons";
import { StatCard } from "@/components/rono/stat-card";
import { ExportMenu } from "@/components/rono/export-menu";

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
  // Parse YYYY-MM-DD as local date to avoid UTC offset issues
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (match) {
    const [, year, month, day] = match;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
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

  const [branches, lrs] = await Promise.all([
    prisma.branch.findMany({ where: { companyId }, orderBy: { name: "asc" }, select: { id: true, name: true, city: true } }),
    prisma.lRRequest.findMany({
      where,
      select: { status: true, paymentMode: true, freightAmount: true, originCity: true, destinationCity: true, executiveId: true, branchId: true, createdAt: true },
    }),
  ]);

  const executiveVolume = await prisma.lRRequest.groupBy({
    by: ["executiveId"],
    where: { companyId, createdAt: { gte: from, lte: to } },
    _count: { _all: true },
    orderBy: { _count: { executiveId: "desc" } },
    take: 10,
  });
  const executiveIds = executiveVolume.map((d) => d.executiveId);
  const executiveInfo = await prisma.user.findMany({
    where: { id: { in: executiveIds } },
    select: {
      id: true,
      name: true,
      mobile: true,
      branch: { select: { name: true } },
    },
  });
  const executiveMap = new Map(executiveInfo.map((d) => [d.id, d]));

  const totalCount = lrs.length;
  const freightTotal = lrs.reduce((s, lr) => s + Number(lr.freightAmount.toString()), 0);
  const approved = lrs.filter((lr) => lr.status === "approved" || lr.status === "in_transit" || lr.status === "delivered").length;
  const rejected = lrs.filter((lr) => lr.status === "rejected").length;
  const decided = approved + rejected;
  const approvalRate = decided > 0 ? (approved / decided) * 100 : 0;
  const avgPerLr = totalCount > 0 ? Math.round(freightTotal / totalCount) : 0;

  const countByMode = (mode: string) => lrs.filter((lr) => lr.paymentMode === mode).length;
  const sumByMode = (mode: string) => lrs.filter((lr) => lr.paymentMode === mode).reduce((s, lr) => s + Number(lr.freightAmount.toString()), 0);

  const paymentBreakdown = PAYMENT_VALUES.map((mode) => ({
    mode,
    label: mode === "TO_PAY" ? "To Pay" : mode === "PAID" ? "Paid" : "To be Billed",
    count: countByMode(mode),
    total: sumByMode(mode),
    pct: totalCount > 0 ? Math.round((countByMode(mode) / totalCount) * 100) : 0,
  }));

  const routeMap = new Map<string, { count: number; freight: number }>();
  for (const lr of lrs) {
    const key = `${lr.originCity} → ${lr.destinationCity}`;
    const e = routeMap.get(key) ?? { count: 0, freight: 0 };
    e.count += 1; e.freight += Number(lr.freightAmount.toString());
    routeMap.set(key, e);
  }
  const topRoutes = [...routeMap.entries()].map(([route, data]) => ({ route, ...data })).sort((a, b) => b.count - a.count).slice(0, 4);

  const exportQuery = new URLSearchParams();
  exportQuery.set("from", from.toISOString().slice(0, 10));
  exportQuery.set("to", toRaw.toISOString().slice(0, 10));
  if (status) exportQuery.set("status", status);
  if (paymentMode) exportQuery.set("paymentMode", paymentMode);
  if (branchId) exportQuery.set("branchId", branchId);

  const PAYMENT_STYLES: Record<string, { icon: React.ReactNode; iconBg: string; valueColor: string; pillBg: string }> = {
    TO_PAY: {
      icon: <IconReceiptPending className="h-5 w-[19px] text-[#DE3500]" />,
      iconBg: "bg-[#DE3500]/10",
      valueColor: "text-[#DE3500]",
      pillBg: "bg-[#DE3500]/10 text-[#DE3500]",
    },
    PAID: {
      icon: <IconOrderApprove className="h-5 w-5 text-[#0C6B24]" />,
      iconBg: "bg-[#0C6B24]/10",
      valueColor: "text-[#0C6B24]",
      pillBg: "bg-[#0C6B24]/10 text-[#0C6B24]",
    },
    TO_BE_BILLED: {
      icon: <IconDocument className="h-4 w-[13px] text-[#3C60B6]" />,
      iconBg: "bg-[#3C60B6]/10",
      valueColor: "text-[#3C60B6]",
      pillBg: "bg-[#3C60B6]/10 text-[#3C60B6]",
    },
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-bold text-black">Overall Report</h1>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
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
        <div className="mt-5">
          <ExportMenu
            pdfHref={`/api/reports/pdf?${exportQuery.toString()}`}
            csvHref={`/api/reports/csv?${exportQuery.toString()}`}
          />
        </div>
      </div>

      {/* 3 KPI Cards */}
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <StatCard
          icon={<IconDocument className="h-4 w-[13px] text-[#5E3EA1]" />}
          iconBg="bg-[#5E3EA1]/10"
          topRight="Last 30 Days"
          title="Total LRs"
          value={totalCount}
          valueColor="text-[#5E3EA1]"
        />
        <StatCard
          icon={<IconReceiptPending className="h-5 w-[19px] text-[#DE3500]" />}
          iconBg="bg-[#DE3500]/10"
          topRight="Last 30 Days"
          title="Total Freight Value"
          value={formatCurrency(freightTotal)}
          valueColor="text-[#DE3500]"
          subtitle={`Avg/LR : ${formatCurrency(avgPerLr)}`}
        />
        <StatCard
          icon={<IconOrderApprove className="h-5 w-5 text-[#0C6B24]" />}
          iconBg="bg-[#0C6B24]/10"
          topRight="Last 30 Days"
          title="Approval Rate"
          value={`${approvalRate.toFixed(1)}%`}
          valueColor="text-[#0C6B24]"
        />
      </div>

      {/* Executive by LR Volume + Top Routes */}
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <div className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-black">Executive by LR Volume</h2>
          </div>

          {executiveVolume.length === 0 ? (
            <p className="mt-6 text-sm text-slate-400">No data for this period.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-black/[0.06] text-left">
                    <th className="pb-2 pr-3 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">ID</th>
                    <th className="pb-2 pr-3 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Name</th>
                    <th className="pb-2 pr-3 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Branch</th>
                    <th className="pb-2 pr-3 text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">LRs</th>
                    <th className="pb-2 text-right text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF]">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {executiveVolume.map((row) => {
                    const executive = executiveMap.get(row.executiveId);
                    return (
                      <tr key={row.executiveId} className="border-b border-black/[0.04] last:border-0">
                        <td className="py-3.5 pr-3 text-xs font-semibold text-[#9CA3AF]">
                          #{row.executiveId.slice(0, 5).toUpperCase()}
                        </td>
                        <td className="py-3.5 pr-3">
                          <p className="font-semibold text-[#5E3EA1]">{executive?.name ?? "Unknown"}</p>
                          <p className="text-[11px] text-[#9CA3AF]">{executive?.mobile ?? ""}</p>
                        </td>
                        <td className="py-3.5 pr-3 text-[13px] text-black">{executive?.branch?.name ?? "—"}</td>
                        <td className="py-3.5 pr-3 font-semibold text-black">{row._count?._all ?? 0}</td>
                        <td className="py-3.5 text-right">
                          <span className="inline-flex h-8 w-8 items-center justify-center text-[#5E3EA1]">
                            <IconMoreDots className="h-8 w-8" />
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="mt-3 text-[11px] text-[#9CA3AF]">
                Showing 1–{executiveVolume.length} of {executiveVolume.length} LR
              </p>
            </div>
          )}
        </div>

        {/* Top Routes */}
        <div className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-black">Top Routes</h2>
            <span className="rounded-full bg-[#5E3EA1]/10 px-2.5 py-1 text-[10px] font-semibold text-[#5E3EA1]">
              By LR
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {topRoutes.length === 0 ? (
              <p className="text-sm text-slate-400">No data for this period.</p>
            ) : (
              topRoutes.map((r, i) => {
                const parts = r.route.split(" → ");
                return (
                  <div
                    key={r.route}
                    className="relative flex items-center gap-3 overflow-hidden rounded-xl border border-black/[0.06] p-3"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#5E3EA1]/10 text-[#5E3EA1]">
                      <Route className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] text-[#9CA3AF]">
                        {r.count} LRs · {formatCurrency(r.freight)} Freight
                      </p>
                      <p className="truncate text-sm font-bold text-black">
                        {parts[0]} <span className="text-[#9CA3AF]">→</span> {parts[1]}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-[#5E3EA1] px-2 py-0.5 text-[10px] font-bold text-white">
                      #{i + 1}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Freight by Payment */}
      <div className="mt-6">
        <h2 className="text-sm font-bold text-black">Freight by Payment</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {paymentBreakdown.map((p) => {
            const styles = PAYMENT_STYLES[p.mode];
            return (
              <div key={p.mode} className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${styles.iconBg}`}>
                    {styles.icon}
                  </div>
                  <span className="text-[11px] font-semibold text-[#9CA3AF]">{p.count} LR</span>
                </div>
                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <p className="text-xs font-medium text-[#4D4D4D]">{p.label}</p>
                    <p className={`mt-0.5 text-2xl font-bold ${styles.valueColor}`}>{formatCurrency(p.total)}</p>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${styles.pillBg}`}>{p.pct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
