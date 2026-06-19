import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import {
  computeDashboardStats,
  formatCurrency,
  getCompanyById,
  getDailyLrCounts,
  getMonthlyLrCounts,
  getPaymentModeBreakdown,
  getTopRoutes,
} from "@/lib/services/lr-service";
import { prisma } from "@/lib/db/prisma";
import { toLR } from "@/lib/db/serialize";
import { StatCard } from "@/components/rono/brand";
import { FileText, Clock, CheckCircle, Truck } from "lucide-react";
import { StatusBadge } from "@/components/rono/status-badge";
import { LrVolumeChart } from "@/components/rono/lr-volume-chart";
import Link from "next/link";

export const dynamic = "force-dynamic";

type PaymentModeKey = "TO_PAY" | "PAID" | "TO_BE_BILLED";

const PAYMENT_LABELS: Record<PaymentModeKey, string> = {
  TO_PAY: "To Pay",
  PAID: "Paid",
  TO_BE_BILLED: "TBB",
};

const PAYMENT_STYLES: Record<PaymentModeKey, string> = {
  TO_PAY: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  PAID: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  TO_BE_BILLED: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200",
};

export default async function CompanyDashboardPage() {
  const session = await getSession();
  if (!session?.companyId) redirect("/company/login");

  const companyId = session.companyId;
  const [
    company,
    stats,
    topRoutes,
    recentRows,
    daily,
    monthly,
    payments,
    activeDriverCount,
    branchCount,
  ] = await Promise.all([
    getCompanyById(companyId),
    computeDashboardStats(companyId),
    getTopRoutes(companyId),
    prisma.lRRequest.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { driver: true },
    }),
    getDailyLrCounts(companyId, 7),
    getMonthlyLrCounts(companyId, 12),
    getPaymentModeBreakdown(companyId),
    prisma.user.count({
      where: { companyId, role: "driver", status: { in: ["active", "invited"] } },
    }),
    prisma.branch.count({ where: { companyId } }),
  ]);

  const recentLrs = recentRows.map((lr) => ({
    ...toLR(lr),
    driverName: lr.driver.name,
  }));

  const lrUsagePct = company
    ? Math.min(100, Math.round((stats.totalLrs / company.maxLrPerMonth) * 100))
    : 0;
  const driverUsagePct = company
    ? Math.min(100, Math.round((activeDriverCount / company.maxDrivers) * 100))
    : 0;
  const branchUsagePct = company
    ? Math.min(100, Math.round((branchCount / company.maxBranches) * 100))
    : 0;

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">
            {company?.name} · LR Code {company?.lrCode}
          </p>
        </div>
        {stats.totalLrs >= (company?.maxLrPerMonth ?? Infinity) - 30 && company ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
            ⚠ Only {Math.max(0, company.maxLrPerMonth - stats.totalLrs)} LRs
            remaining this month — contact your platform admin to increase the
            limit.
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total LRs (Month)"
          value={stats.totalLrs}
          subtitle={`Limit: ${company?.maxLrPerMonth.toLocaleString("en-IN")}`}
          icon={<FileText className="h-5 w-5 text-blue-600" />}
          accent="blue"
        />
        <StatCard
          title="Pending Approval"
          value={stats.pending}
          subtitle="Awaiting review"
          icon={<Clock className="h-5 w-5 text-amber-600" />}
          accent="amber"
        />
        <StatCard
          title="Approved (Month)"
          value={stats.approved}
          subtitle={`${stats.approvalRate.toFixed(1)}% approval rate`}
          icon={<CheckCircle className="h-5 w-5 text-emerald-600" />}
          accent="emerald"
        />
        <StatCard
          title="Delivered (Month)"
          value={stats.delivered}
          subtitle={`${stats.inTransit} in transit`}
          icon={<Truck className="h-5 w-5 text-violet-600" />}
          accent="violet"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <LrVolumeChart daily={daily} monthly={monthly} title="LR Volume" />
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="font-semibold">Platform Quota Usage</h2>
          <p className="text-xs text-slate-500">This month</p>
          <div className="mt-5 space-y-5">
            <UsageBar
              label="LRs"
              current={stats.totalLrs}
              max={company?.maxLrPerMonth ?? 0}
              pct={lrUsagePct}
            />
            <UsageBar
              label="Active drivers"
              current={activeDriverCount}
              max={company?.maxDrivers ?? 0}
              pct={driverUsagePct}
            />
            <UsageBar
              label="Branches"
              current={branchCount}
              max={company?.maxBranches ?? 0}
              pct={branchUsagePct}
            />
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Payment Mode Mix</h2>
            <span className="text-xs text-slate-400">Active LRs</span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {payments.map((p) => (
              <div
                key={p.mode}
                className="rounded-xl border border-slate-100 p-4"
              >
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${PAYMENT_STYLES[p.mode]}`}
                >
                  {PAYMENT_LABELS[p.mode]}
                </span>
                <p className="mt-3 text-2xl font-bold">{p.count}</p>
                <p className="text-xs text-slate-500">
                  {formatCurrency(p.amount)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border bg-gradient-to-br from-violet-600 to-indigo-600 p-6 text-white shadow-sm">
          <h2 className="font-semibold text-violet-100">Total Freight Value</h2>
          <p className="mt-2 text-4xl font-bold">{formatCurrency(stats.freightTotal)}</p>
          <p className="mt-1 text-sm text-violet-200">
            Across {stats.totalLrs} LRs this month
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="font-semibold">Top Routes This Month</h2>
          <div className="mt-4 space-y-3">
            {topRoutes.length === 0 ? (
              <p className="text-sm text-slate-500">No data yet for this month.</p>
            ) : (
              topRoutes.map((route, i) => (
                <div key={route.route} className="flex items-center gap-3">
                  <span className="w-6 text-sm font-bold text-slate-400">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{route.route}</p>
                    <div className="mt-1 h-2 rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-violet-500"
                        style={{
                          width: `${(route.count / (topRoutes[0]?.count || 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-violet-600">
                    {route.count}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Recent LR Requests</h2>
            <Link href="/company/lr" className="text-sm font-semibold text-violet-600 hover:underline">
              View all
            </Link>
          </div>
          {recentLrs.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No LRs yet.</p>
          ) : (
            <div className="mt-4 divide-y">
              {recentLrs.map((lr) => (
                <Link
                  key={lr.id}
                  href={`/company/lr/${lr.id}`}
                  className="flex items-center justify-between py-3 transition hover:bg-slate-50"
                >
                  <div>
                    <p className="font-semibold text-violet-700">{lr.trackingId}</p>
                    <p className="text-sm text-slate-500">
                      {lr.originCity} → {lr.destinationCity} · {lr.driverName}
                    </p>
                  </div>
                  <StatusBadge status={lr.status} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function UsageBar({
  label,
  current,
  max,
  pct,
}: {
  label: string;
  current: number;
  max: number;
  pct: number;
}) {
  const tone =
    pct >= 90
      ? "bg-red-500"
      : pct >= 75
        ? "bg-amber-500"
        : "bg-violet-500";

  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="font-mono text-slate-500">
          {current} <span className="text-slate-300">/</span> {max}
        </span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-slate-100">
        <div
          className={`h-2 rounded-full transition-all ${tone}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-slate-400">{pct}% used</p>
    </div>
  );
}
