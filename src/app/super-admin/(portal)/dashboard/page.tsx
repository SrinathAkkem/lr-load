import { prisma } from "@/lib/db/prisma";
import { Building2, Truck, FileText, CheckCircle2, AlertTriangle, XCircle, Rocket, TrendingUp } from "lucide-react";
import Link from "next/link";
import {
  getDailyLrCounts,
  getMonthlyLrCounts,
} from "@/lib/services/lr-service";
import { LrVolumeChart } from "@/components/rono/lr-volume-chart";

export const dynamic = "force-dynamic";

export default async function SuperAdminDashboardPage() {
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const monthEnd = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);

  const [companies, totalDrivers, totalLrs, monthLrCount, daily, monthly, newDriversThisMonth] =
    await Promise.all([
      prisma.company.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: {
              lrRequests: { where: { createdAt: { gte: monthStart, lt: monthEnd } } },
              branches: true,
              users: { where: { role: "driver" } },
            },
          },
        },
      }),
      prisma.user.count({ where: { role: "driver", status: "active" } }),
      prisma.lRRequest.count(),
      prisma.lRRequest.count({
        where: { createdAt: { gte: monthStart, lt: monthEnd } },
      }),
      getDailyLrCounts(null, 7),
      getMonthlyLrCounts(null, 12),
      prisma.user.count({
        where: {
          role: "driver",
          status: "active",
          createdAt: { gte: monthStart, lt: monthEnd },
        },
      }),
    ]);

  const activeCompanies = companies.filter((c) => c.status === "active");
  const suspendedCompanies = companies.filter((c) => c.status === "suspended");

  const dailyAvg = daily.length > 0
    ? Math.round(daily.reduce((s, d) => s + d.count, 0) / daily.length)
    : 0;

  const topCompanies = [...companies]
    .sort((a, b) => b._count.lrRequests - a._count.lrRequests)
    .slice(0, 5);

  const recentActivity = await prisma.lRRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { company: true, driver: true },
  });

  const monthName = new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  return (
    <div className="p-6 md:p-8">
      {/* 3 Stat Cards with colored left border */}
      <div className="grid gap-5 md:grid-cols-3">
        <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50">
            <Building2 className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Companies</p>
            <p className="text-3xl font-bold text-slate-900">{companies.length}</p>
            <p className="text-xs text-emerald-600">
              {activeCompanies.length} active · {suspendedCompanies.length} suspended
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
            <Truck className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Active Drivers</p>
            <p className="text-3xl font-bold text-slate-900">{totalDrivers.toLocaleString("en-IN")}</p>
            <p className="text-xs text-blue-600">
              +{newDriversThisMonth} joined this month
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50">
            <FileText className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total LRs Issued</p>
            <p className="text-3xl font-bold text-amber-600">{totalLrs.toLocaleString("en-IN")}</p>
            <p className="text-xs text-slate-500">
              {monthLrCount.toLocaleString("en-IN")} this month
            </p>
          </div>
        </div>
      </div>

      {/* LR Volume Chart + Recent Activity side by side */}
      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        {/* LR Volume Chart - 3 cols */}
        <div className="lg:col-span-3 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">LR Volume — {monthName}</h2>
            <span className="rounded-full bg-violet-100 px-3 py-1 text-[11px] font-semibold text-violet-700">
              Daily
            </span>
          </div>

          <div className="mt-4">
            <LrVolumeChart daily={daily} monthly={monthly} title="" />
          </div>

          {/* MONTH TOTAL / DAILY AVG below chart */}
          <div className="mt-4 flex items-center gap-8 border-t border-slate-100 pt-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Month Total</p>
              <p className="mt-0.5 text-2xl font-bold text-slate-900">{monthLrCount.toLocaleString("en-IN")}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Daily Avg</p>
              <p className="mt-0.5 text-2xl font-bold text-slate-900">{dailyAvg}</p>
            </div>
          </div>
        </div>

        {/* Recent Activity - 2 cols */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Recent Activity</h2>
            <Link
              href="/super-admin/audit"
              className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-600 transition hover:border-violet-200 hover:text-violet-600"
            >
              See all
            </Link>
          </div>

          <div className="mt-5 space-y-0">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-slate-400">No recent activity.</p>
            ) : (
              recentActivity.map((lr, i) => {
                const iconConfig = ACTIVITY_ICONS[i % ACTIVITY_ICONS.length];
                return (
                  <div
                    key={lr.id}
                    className={`flex items-start gap-3 py-3.5 ${
                      i < recentActivity.length - 1 ? "border-b border-slate-50" : ""
                    }`}
                  >
                    <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${iconConfig.bg}`}>
                      <iconConfig.icon className={`h-3.5 w-3.5 ${iconConfig.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] leading-snug text-slate-700">
                        <span className="font-semibold text-slate-900">{lr.company.name}</span>
                        {" "}
                        {lr.status === "pending"
                          ? `— LR submitted by ${lr.driver.name}.`
                          : lr.status === "approved"
                            ? `— LR ${lr.trackingId} approved.`
                            : lr.status === "delivered"
                              ? `— marked delivered by driver.`
                              : lr.status === "rejected"
                                ? `— was suspended by admin.`
                                : `— LR ${lr.trackingId} ${lr.status}.`}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        {timeAgo(lr.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Top Companies by LR Volume - full width */}
      <div className="mt-8 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Top Companies by LR Volume</h2>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-violet-50 px-3 py-1 text-[11px] font-semibold text-violet-700">
              Top 5
            </span>
            <Link
              href="/super-admin/companies"
              className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-600 transition hover:border-violet-200 hover:text-violet-600"
            >
              View All →
            </Link>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left">
                <th className="pb-3 pr-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400">#</th>
                <th className="pb-3 pr-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Company Name</th>
                <th className="pb-3 pr-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Branches</th>
                <th className="pb-3 pr-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Drivers</th>
                <th className="pb-3 pr-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400">LRs This Month</th>
                <th className="pb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {topCompanies.map((company, i) => {
                const lrPct = company.maxLrPerMonth > 0
                  ? Math.min(100, (company._count.lrRequests / company.maxLrPerMonth) * 100)
                  : 0;
                const barColor = lrPct >= 90
                  ? "bg-red-500"
                  : lrPct >= 75
                    ? "bg-amber-500"
                    : i === 0
                      ? "bg-violet-500"
                      : i === 1
                        ? "bg-blue-500"
                        : i === 2
                          ? "bg-emerald-500"
                          : "bg-amber-400";
                return (
                  <tr key={company.id} className="border-b border-slate-50 last:border-0">
                    <td className="py-4 pr-4 text-sm font-bold text-slate-300">
                      {String(i + 1).padStart(2, "0")}
                    </td>
                    <td className="py-4 pr-4">
                      <Link
                        href={`/super-admin/companies/${company.id}`}
                        className="text-sm font-semibold text-slate-800 hover:text-violet-700"
                      >
                        {company.name}
                      </Link>
                    </td>
                    <td className="py-4 pr-4 text-sm text-slate-600">
                      {company._count.branches} / {company.maxBranches}
                    </td>
                    <td className="py-4 pr-4 text-sm text-slate-600">
                      {company._count.users} / {company.maxDrivers}
                    </td>
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-slate-700">
                          {company._count.lrRequests} / {company.maxLrPerMonth}
                        </span>
                        <div className="h-2 w-24 rounded-full bg-slate-100">
                          <div
                            className={`h-2 rounded-full ${barColor} transition-all`}
                            style={{ width: `${lrPct}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        company.status === "active"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-600"
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          company.status === "active" ? "bg-emerald-500" : "bg-red-500"
                        }`} />
                        {company.status === "active" ? "Active" : "Suspended"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const ACTIVITY_ICONS = [
  { icon: CheckCircle2, bg: "bg-emerald-50", color: "text-emerald-600" },
  { icon: AlertTriangle, bg: "bg-amber-50", color: "text-amber-600" },
  { icon: XCircle, bg: "bg-red-50", color: "text-red-500" },
  { icon: Rocket, bg: "bg-violet-50", color: "text-violet-600" },
  { icon: TrendingUp, bg: "bg-emerald-50", color: "text-emerald-600" },
] as const;

function timeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ${mins % 60}m ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return `Yesterday, ${date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })}`;
  return `${days}d ago`;
}
