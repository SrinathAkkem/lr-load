import { prisma } from "@/lib/db/prisma";
import { StatCard } from "@/components/rono/brand";
import { Building2, Truck, FileText, Activity } from "lucide-react";
import Link from "next/link";
import {
  formatCurrency,
  getDailyLrCounts,
  getMonthlyLrCounts,
} from "@/lib/services/lr-service";
import { LrVolumeChart } from "@/components/rono/lr-volume-chart";

export const dynamic = "force-dynamic";

export default async function SuperAdminDashboardPage() {
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const monthEnd = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);

  const [companies, totalDrivers, totalLrs, monthLrCount, daily, monthly] =
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
    ]);

  const activeCompanies = companies.filter((c) => c.status === "active");
  const suspendedCompanies = companies.filter((c) => c.status === "suspended");
  const newDriversThisMonth = await prisma.user.count({
    where: {
      role: "driver",
      status: "active",
      createdAt: { gte: monthStart, lt: monthEnd },
    },
  });

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

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          Platform overview · {companies.length} companies onboarded
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
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
        <StatCard
          title="Month Total"
          value={monthLrCount.toLocaleString("en-IN")}
          subtitle={`Daily avg: ${dailyAvg}`}
          icon={<Activity className="h-5 w-5 text-emerald-600" />}
          accent="emerald"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <LrVolumeChart
            daily={daily}
            monthly={monthly}
            title="LR Volume"
          />
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border bg-gradient-to-br from-violet-600 to-indigo-600 p-5 text-white shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-violet-100">
              Month Total
            </h2>
            <p className="mt-1 text-3xl font-bold">{monthLrCount.toLocaleString("en-IN")}</p>
            <p className="text-sm text-violet-200">LR Volume — {new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</p>
          </div>
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Daily Average
            </h2>
            <p className="mt-1 text-3xl font-bold text-slate-900">{dailyAvg}</p>
            <p className="text-sm text-slate-500">LRs per day this week</p>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Top Companies by LR Volume</h2>
            <Link
              href="/super-admin/companies"
              className="text-sm font-semibold text-violet-600 hover:underline"
            >
              View All →
            </Link>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b text-left text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="pb-3 pr-3">#</th>
                  <th className="pb-3 pr-3">Company Name</th>
                  <th className="pb-3 pr-3">Branches</th>
                  <th className="pb-3 pr-3">Drivers</th>
                  <th className="pb-3 pr-3">LRs This Month</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {topCompanies.map((company, i) => {
                  const lrPct = company.maxLrPerMonth > 0
                    ? (company._count.lrRequests / company.maxLrPerMonth) * 100
                    : 0;
                  const driverPct = company.maxDrivers > 0
                    ? (company._count.users / company.maxDrivers) * 100
                    : 0;
                  const branchPct = company.maxBranches > 0
                    ? (company._count.branches / company.maxBranches) * 100
                    : 0;
                  return (
                    <tr key={company.id} className="border-b last:border-0">
                      <td className="py-3 pr-3 font-bold text-slate-400">
                        {String(i + 1).padStart(2, "0")}
                      </td>
                      <td className="py-3 pr-3">
                        <Link
                          href={`/super-admin/companies/${company.id}`}
                          className="font-semibold text-slate-900 hover:text-violet-700"
                        >
                          {company.name}
                        </Link>
                      </td>
                      <td className="py-3 pr-3">
                        <UsageMini used={company._count.branches} max={company.maxBranches} pct={branchPct} />
                      </td>
                      <td className="py-3 pr-3">
                        <UsageMini used={company._count.users} max={company.maxDrivers} pct={driverPct} />
                      </td>
                      <td className="py-3 pr-3">
                        <UsageMini used={company._count.lrRequests} max={company.maxLrPerMonth} pct={lrPct} />
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-semibold ${
                            company.status === "active"
                              ? "text-emerald-600"
                              : "text-red-600"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              company.status === "active"
                                ? "bg-emerald-500"
                                : "bg-red-500"
                            }`}
                          />
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

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Daily Recent Activity</h2>
            <Link
              href="/super-admin/audit"
              className="text-sm font-semibold text-violet-600 hover:underline"
            >
              See all
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-slate-500">No recent activity.</p>
            ) : (
              recentActivity.map((lr) => (
                <div
                  key={lr.id}
                  className="flex items-start gap-3 rounded-xl border border-slate-100 p-3"
                >
                  <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-violet-500" />
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-semibold">{lr.company.name}</span>{" "}
                      — LR {lr.trackingId} {lr.status === "pending" ? "submitted" : lr.status} by {lr.driver.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {timeAgo(lr.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function UsageMini({ used, max, pct }: { used: number; max: number; pct: number }) {
  const tone = pct >= 90 ? "bg-red-500" : pct >= 75 ? "bg-amber-500" : "bg-violet-500";
  return (
    <div className="min-w-[80px]">
      <p className="text-xs font-medium text-slate-700">
        {used} <span className="text-slate-400">/ {max}</span>
      </p>
      <div className="mt-1 h-1.5 rounded-full bg-slate-100">
        <div
          className={`h-1.5 rounded-full ${tone} transition-all`}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
    </div>
  );
}

function timeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
