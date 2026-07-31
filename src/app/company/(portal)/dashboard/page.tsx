import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import {
  computeDashboardStats,
  computeDashboardStatsAllTime,
  formatCurrency,
  getCompanyById,
  getDailyLrCounts,
  getMonthlyLrCounts,
  getPaymentModeBreakdown,
  getTopRoutes,
} from "@/lib/services/lr-service";
import { prisma } from "@/lib/db/prisma";
import { toLR } from "@/lib/db/serialize";
import { FileText, Clock, CheckCircle, Truck, AlertTriangle, XCircle, CheckCircle2, FileUp } from "lucide-react";
import { LrVolumeChart } from "@/components/rono/lr-volume-chart";
import Link from "next/link";

export const dynamic = "force-dynamic";

type PaymentModeKey = "TO_PAY" | "PAID" | "TO_BE_BILLED";

export default async function CompanyDashboardPage() {
  const session = await getSession();
  if (!session?.companyId) redirect("/company/login");

  const companyId = session.companyId;
  const [
    company,
    stats,
    monthStats,
    topRoutes,
    recentRows,
    daily,
    monthly,
    payments,
    activeExecutiveCount,
    branchCount,
  ] = await Promise.all([
    getCompanyById(companyId),
    computeDashboardStatsAllTime(companyId),
    computeDashboardStats(companyId),
    getTopRoutes(companyId),
    prisma.lRRequest.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { executive: true },
    }),
    getDailyLrCounts(companyId, 7),
    getMonthlyLrCounts(companyId, 12),
    getPaymentModeBreakdown(companyId),
    prisma.user.count({
      where: { companyId, role: "executive", status: { in: ["active", "invited"] } },
    }),
    prisma.branch.count({ where: { companyId } }),
  ]);

  const recentLrs = recentRows.map((lr) => ({
    ...toLR(lr),
    executiveName: lr.executive?.name ?? "Executive",
  }));

  const lrUsagePct = company
    ? Math.min(100, Math.round((monthStats.totalLrs / company.maxLrPerMonth) * 100))
    : 0;
  const executiveUsagePct = company
    ? Math.min(100, Math.round((activeExecutiveCount / company.maxExecutives) * 100))
    : 0;
  const branchUsagePct = company
    ? Math.min(100, Math.round((branchCount / company.maxBranches) * 100))
    : 0;

  const dailyAvg = daily.length > 0
    ? Math.round(daily.reduce((s, d) => s + d.count, 0) / daily.length)
    : 0;
  const todayCount = daily[daily.length - 1]?.count ?? 0;
  const lrsRemaining = company ? Math.max(0, company.maxLrPerMonth - monthStats.totalLrs) : 0;

  const monthName = new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  return (
    <div className="p-6 md:p-8">
      {/* 4 Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCardCustom
          title="Total LRs (Month)"
          value={stats.totalLrs}
          subtitle={`Limit: ${company?.maxLrPerMonth.toLocaleString("en-IN")}`}
          icon={<FileText className="h-5 w-5 text-blue-600" />}
          iconBg="bg-blue-50"
        />
        <StatCardCustom
          title="Pending Approval"
          value={stats.pending}
          subtitle={stats.pending > 0 ? `${Math.min(3, stats.pending)} urgent >12h old` : "All clear"}
          icon={<Clock className="h-5 w-5 text-orange-600" />}
          iconBg="bg-orange-50"
          valueColor="text-orange-600"
        />
        <StatCardCustom
          title="Approved (Month)"
          value={stats.approved}
          subtitle={`${stats.approvalRate.toFixed(1)}% approval rate`}
          icon={<CheckCircle className="h-5 w-5 text-emerald-600" />}
          iconBg="bg-emerald-50"
          valueColor="text-emerald-600"
        />
        <StatCardCustom
          title="Delivered (Month)"
          value={stats.delivered}
          subtitle={`${stats.inTransit} in transit`}
          icon={<Truck className="h-5 w-5 text-primary" />}
          iconBg="bg-primary/10"
          valueColor="text-primary"
        />
      </div>

      {/* LR Volume Chart + Top Routes side by side */}
      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        {/* LR Volume - 3 cols */}
        <div className="lg:col-span-3 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">LR Volume — {monthName}</h2>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-primary/15 px-3 py-1 text-[11px] font-semibold text-primary">
                Weekly
              </span>
              <span className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-medium text-slate-600">
                {new Date().toLocaleDateString("en-IN", { month: "short", year: "numeric" })} ▼
              </span>
            </div>
          </div>

          <div className="mt-4">
            <LrVolumeChart daily={daily} monthly={monthly} title="" />
          </div>

          <div className="mt-4 flex items-center gap-8 border-t border-slate-100 pt-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Month Total</p>
              <p className="mt-0.5 text-2xl font-bold text-slate-900">{stats.totalLrs}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Daily Avg</p>
              <p className="mt-0.5 text-2xl font-bold text-slate-900">{dailyAvg}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Today</p>
              <p className="mt-0.5 text-2xl font-bold text-slate-900">{todayCount}</p>
            </div>
          </div>
        </div>

        {/* Top Routes This Month - 2 cols */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Top Routes This Month</h2>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
              Top 5
            </span>
          </div>

          <div className="mt-5 space-y-4">
            {topRoutes.length === 0 ? (
              <p className="text-sm text-slate-400">No data yet for this month.</p>
            ) : (
              topRoutes.map((route, i) => {
                const parts = route.route.split(" → ");
                return (
                  <div key={route.route} className="flex items-center gap-3">
                    <span className="w-6 text-sm font-bold text-slate-300">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800">
                        {parts[0]} <span className="text-slate-400">→</span> {parts[1]}
                      </p>
                      <p className="text-[11px] text-slate-400">{route.count} shipments</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-20 rounded-full bg-slate-100">
                        <div
                          className="h-2 rounded-full bg-blue-500"
                          style={{ width: `${(route.count / (topRoutes[0]?.count || 1)) * 100}%` }}
                        />
                      </div>
                      <span className="w-8 text-right text-sm font-bold text-slate-800">{route.count}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Bottom row: Total Freight + Recent Activity + Platform Quota */}
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Total Freight Value */}
        <div className="rounded-2xl bg-gradient-to-br from-[var(--brand-gradient-start)] to-[var(--brand-gradient-end)] p-6 text-white shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/70">
            Total Freight Value — {monthName}
          </p>
          <p className="mt-3 text-4xl font-bold">{formatCurrency(stats.freightTotal)}</p>
          <p className="mt-1 text-sm text-white/70">
            Across {stats.totalLrs} LRs issued this month
          </p>

          <div className="mt-6 grid grid-cols-3 gap-3">
            {payments.map((p) => (
              <div key={p.mode} className="text-center">
                <p className="text-lg font-bold text-white">{formatCompact(p.amount)}</p>
                <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/60">
                  {p.mode === "TO_PAY" ? "To Pay" : p.mode === "PAID" ? "Paid" : "To Be Billed"}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Recent Activity</h2>
            <Link
              href="/company/lr"
              className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-600 transition hover:border-primary/20 hover:text-primary"
            >
              See all
            </Link>
          </div>

          <div className="mt-4 space-y-0">
            {recentLrs.length === 0 ? (
              <p className="text-sm text-slate-400">No activity yet.</p>
            ) : (
              recentLrs.slice(0, 4).map((lr, i) => {
                const iconCfg = getActivityIcon(lr.status);
                return (
                  <div
                    key={lr.id}
                    className={`flex items-start gap-3 py-3 ${i < 3 ? "border-b border-slate-50" : ""}`}
                  >
                    <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${iconCfg.bg}`}>
                      <iconCfg.icon className={`h-3.5 w-3.5 ${iconCfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] leading-snug text-slate-700">
                        {lr.status === "approved" && (
                          <>LR <span className="font-semibold">{lr.trackingId}</span> approved. {lr.originCity} → {lr.destinationCity}.</>
                        )}
                        {lr.status === "pending" && (
                          <>Executive <span className="font-semibold">{lr.executiveName}</span> submitted LR. Awaiting approval.</>
                        )}
                        {lr.status === "delivered" && (
                          <>LR <span className="font-semibold">{lr.trackingId}</span> marked delivered by executive.</>
                        )}
                        {lr.status === "rejected" && (
                          <>LR <span className="font-semibold">{lr.trackingId}</span> rejected — incorrect vehicle number.</>
                        )}
                        {!["approved", "pending", "delivered", "rejected"].includes(lr.status) && (
                          <>LR <span className="font-semibold">{lr.trackingId}</span> {lr.status}.</>
                        )}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        {timeAgo(new Date(lr.createdAt))}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Platform Quota Usage */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Platform Quota Usage</h2>

          <div className="mt-5 space-y-5">
            <QuotaBar
              label="Branches"
              current={branchCount}
              max={company?.maxBranches ?? 0}
              pct={branchUsagePct}
              color="bg-blue-500"
            />
            <QuotaBar
              label="Executives"
              current={activeExecutiveCount}
              max={company?.maxExecutives ?? 0}
              pct={executiveUsagePct}
              color="bg-blue-500"
            />
            <QuotaBar
              label="LRs / month"
              current={stats.totalLrs}
              max={company?.maxLrPerMonth ?? 0}
              pct={lrUsagePct}
              color={lrUsagePct >= 90 ? "bg-red-500" : lrUsagePct >= 75 ? "bg-amber-500" : "bg-blue-500"}
            />
          </div>

          {lrsRemaining <= 30 && company && (
            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3">
              <p className="text-[11px] font-bold text-amber-700">LR Limit Warning</p>
              <p className="mt-1 text-[11px] leading-relaxed text-amber-600">
                Only {lrsRemaining} LRs remaining this month. Contact your platform admin to increase the limit.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCardCustom({
  title,
  value,
  subtitle,
  icon,
  iconBg,
  valueColor = "text-slate-900",
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  iconBg: string;
  valueColor?: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500">{title}</p>
        <p className={`text-3xl font-bold ${valueColor}`}>{value}</p>
        <p className="text-[11px] text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}

function QuotaBar({
  label,
  current,
  max,
  pct,
  color,
}: {
  label: string;
  current: number;
  max: number;
  pct: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-4">
      <span className="w-20 text-sm font-medium text-slate-700">{label}</span>
      <div className="flex-1 h-2.5 rounded-full bg-slate-100">
        <div
          className={`h-2.5 rounded-full ${color} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-sm font-semibold ${pct >= 90 ? "text-red-600" : "text-slate-700"}`}>
        {current} / {max}
      </span>
    </div>
  );
}

function getActivityIcon(status: string) {
  switch (status) {
    case "approved":
      return { icon: CheckCircle2, bg: "bg-emerald-50", color: "text-emerald-600" };
    case "pending":
      return { icon: FileUp, bg: "bg-orange-50", color: "text-orange-500" };
    case "delivered":
      return { icon: Truck, bg: "bg-blue-50", color: "text-blue-600" };
    case "rejected":
      return { icon: XCircle, bg: "bg-red-50", color: "text-red-500" };
    default:
      return { icon: FileText, bg: "bg-slate-50", color: "text-slate-500" };
  }
}

function formatCompact(amount: number): string {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount}`;
}

function timeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
