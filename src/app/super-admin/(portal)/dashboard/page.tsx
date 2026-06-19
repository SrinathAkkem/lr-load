import { prisma } from "@/lib/db/prisma";
import { StatCard } from "@/components/rono/brand";
import { Building2, Truck, FileText } from "lucide-react";
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
      {/* 3 Stat Cards */}
      <div className="grid gap-5 md:grid-cols-3">
        <StatCard
          title="Total Companies"
          value={companies.length}
          subtitle={`${activeCompanies.length} active · ${suspendedCompanies.length} suspended`}
          icon={<Building2 className="h-5 w-5 text-blue-600" />}
          accent="blue"
        />
        <StatCard
          title="Active Drivers"
          value={totalDrivers.toLocaleString("en-IN")}
          subtitle={`+${newDriversThisMonth} joined this month`}
          icon={<Truck className="h-5 w-5 text-violet-600" />}
          accent="violet"
        />
        <StatCard
          title="Total LRs Issued"
          value={totalLrs.toLocaleString("en-IN")}
          subtitle={`${monthLrCount.toLocaleString("en-IN")} this month`}
          icon={<FileText className="h-5 w-5 text-amber-600" />}
          accent="amber"
        />
      </div>

      {/* LR Volume Chart + Daily Recent Activity side by side */}
      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        {/* LR Volume Chart with MONTH TOTAL / DAILY AVG - takes 3 cols */}
        <div className="lg:col-span-3 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">LR Volume — {monthName}</h2>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Month Total</p>
                <p className="text-2xl font-bold text-slate-900">{monthLrCount.toLocaleString("en-IN")}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Daily Avg</p>
                <p className="text-2xl font-bold text-slate-900">{dailyAvg}</p>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <LrVolumeChart
              daily={daily}
              monthly={monthly}
              title=""
            />
          </div>
        </div>

        {/* Daily Recent Activity - takes 2 cols */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Daily Recent Activity</h2>
            <Link
              href="/super-admin/audit"
              className="text-xs font-semibold text-violet-600 hover:underline"
            >
              See all
            </Link>
          </div>

          <div className="mt-4 space-y-0">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-slate-400">No recent activity.</p>
            ) : (
              recentActivity.map((lr, i) => (
                <div
                  key={lr.id}
                  className={cn(
                    "flex items-start gap-3 py-3",
                    i < recentActivity.length - 1 && "border-b border-slate-50",
                  )}
                >
                  <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-violet-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700">
                      <span className="font-semibold">{lr.company.name}</span>
                      {" "}
                      {lr.status === "pending"
                        ? `— LR submitted by ${lr.driver.name}.`
                        : lr.status === "approved"
                          ? `— LR ${lr.trackingId} approved.`
                          : lr.status === "delivered"
                            ? `— LR ${lr.trackingId} delivered.`
                            : `— LR ${lr.trackingId} ${lr.status}.`}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      {timeAgo(lr.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Top Companies by LR Volume - full width */}
      <div className="mt-8 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Top Companies by LR Volume</h2>
          <Link
            href="/super-admin/companies"
            className="text-xs font-semibold text-violet-600 hover:underline"
          >
            View All →
          </Link>
        </div>
        <p className="text-xs text-slate-400">Top 5</p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="pb-3 pr-3">#</th>
                <th className="pb-3 pr-3">Company Name</th>
                <th className="pb-3 pr-3">Branches</th>
                <th className="pb-3 pr-3">Drivers</th>
                <th className="pb-3 pr-3">LRs This Month</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {topCompanies.map((company, i) => (
                <tr key={company.id} className="border-b border-slate-50 last:border-0">
                  <td className="py-3 pr-3 text-xs font-bold text-slate-300">
                    {String(i + 1).padStart(2, "0")}
                  </td>
                  <td className="py-3 pr-3">
                    <Link
                      href={`/super-admin/companies/${company.id}`}
                      className="text-sm font-semibold text-slate-800 hover:text-violet-700"
                    >
                      {company.name}
                    </Link>
                  </td>
                  <td className="py-3 pr-3">
                    <span className="text-sm text-slate-600">
                      {company._count.branches} / {company.maxBranches}
                    </span>
                  </td>
                  <td className="py-3 pr-3">
                    <span className="text-sm text-slate-600">
                      {company._count.users} / {company.maxDrivers}
                    </span>
                  </td>
                  <td className="py-3 pr-3">
                    <UsagePill used={company._count.lrRequests} max={company.maxLrPerMonth} />
                  </td>
                  <td className="py-3">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                      company.status === "active" ? "text-emerald-600" : "text-red-500"
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        company.status === "active" ? "bg-emerald-500" : "bg-red-500"
                      }`} />
                      {company.status === "active" ? "Active" : "Suspended"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function UsagePill({ used, max }: { used: number; max: number }) {
  const pct = max > 0 ? (used / max) * 100 : 0;
  const color = pct >= 90 ? "text-red-600" : pct >= 75 ? "text-amber-600" : "text-slate-600";
  return (
    <span className={`text-sm font-medium ${color}`}>
      {used} / {max}
    </span>
  );
}

function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

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
