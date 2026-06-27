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

  const [companies, totalExecutives, totalLrs, monthLrCount, daily, monthly, newExecutivesThisMonth] =
    await Promise.all([
      prisma.company.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: {
              lrRequests: { where: { createdAt: { gte: monthStart, lt: monthEnd } } },
              branches: true,
              users: { where: { role: "executive" } },
            },
          },
        },
      }),
      prisma.user.count({ where: { role: "executive", status: "active" } }),
      prisma.lRRequest.count(),
      prisma.lRRequest.count({
        where: { createdAt: { gte: monthStart, lt: monthEnd } },
      }),
      getDailyLrCounts(null, 7),
      getMonthlyLrCounts(null, 12),
      prisma.user.count({
        where: {
          role: "executive",
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
    include: { company: true, executive: true },
  });

  const monthName = new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  return (
    <div className="p-6 md:p-8 bg-[#f4f6fb]">
      {/* 3 Stat Cards with Figma design */}
      <div className="grid gap-5 md:grid-cols-3">
        <div className="flex items-center gap-4 rounded-2xl border-0 bg-white p-6 shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#e8f8f0]">
            <Building2 className="h-7 w-7 text-[#2ecc71]" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7280]">Total Companies</p>
            <p className="text-3xl font-extrabold text-[#2d2d4e]">{companies.length}</p>
            <p className="text-xs font-bold text-[#2ecc71]">
              {activeCompanies.length} active · {suspendedCompanies.length} suspended
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border-0 bg-white p-6 shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#ebf5fd]">
            <Truck className="h-7 w-7 text-[#3b9fe8]" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7280]">Active Executives</p>
            <p className="text-3xl font-extrabold text-[#2d2d4e]">{totalExecutives.toLocaleString("en-IN")}</p>
            <p className="text-xs font-bold text-[#3b9fe8]">
              +{newExecutivesThisMonth} joined this month
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border-0 bg-white p-6 shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#fef3e0]">
            <FileText className="h-7 w-7 text-[#f5a623]" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#6b7280]">Total LRs Issued</p>
            <p className="text-3xl font-extrabold text-[#f5a623]">{totalLrs.toLocaleString("en-IN")}</p>
            <p className="text-xs font-bold text-[#6b7280]">
              {monthLrCount.toLocaleString("en-IN")} this month
            </p>
          </div>
        </div>
      </div>

      {/* LR Volume Chart + Recent Activity side by side */}
      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        {/* LR Volume Chart - 3 cols */}
        <div className="lg:col-span-3 rounded-2xl border-0 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#2d2d4e]">LR Volume — {monthName}</h2>
            <span className="rounded-full bg-[#f0ebfc] px-3 py-1 text-[11px] font-bold text-[#7b4fd4]">
              Daily
            </span>
          </div>

          <div className="mt-4">
            <LrVolumeChart daily={daily} monthly={monthly} title="" />
          </div>

          {/* MONTH TOTAL / DAILY AVG below chart */}
          <div className="mt-4 flex items-center gap-8 border-t border-[#e8edf5] pt-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#9ca3af]">Month Total</p>
              <p className="mt-0.5 text-2xl font-extrabold text-[#2d2d4e]">{monthLrCount.toLocaleString("en-IN")}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#9ca3af]">Daily Avg</p>
              <p className="mt-0.5 text-2xl font-extrabold text-[#2d2d4e]">{dailyAvg}</p>
            </div>
          </div>
        </div>

        {/* Recent Activity - 2 cols */}
        <div className="lg:col-span-2 rounded-2xl border-0 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#2d2d4e]">Recent Activity</h2>
            <Link
              href="/super-admin/audit"
              className="rounded-full border border-[#e8edf5] px-3 py-1 text-[11px] font-bold text-[#6b7280] transition hover:border-[#7b4fd4] hover:text-[#7b4fd4]"
            >
              See all
            </Link>
          </div>

          <div className="mt-5 space-y-0">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-[#9ca3af]">No recent activity.</p>
            ) : (
              recentActivity.map((lr, i) => {
                const iconConfig = ACTIVITY_ICONS[i % ACTIVITY_ICONS.length];
                return (
                  <div
                    key={lr.id}
                    className={`flex items-start gap-3 py-3.5 ${
                      i < recentActivity.length - 1 ? "border-b border-[#e8edf5]" : ""
                    }`}
                  >
                    <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${iconConfig.bg}`}>
                      <iconConfig.icon className={`h-3.5 w-3.5 ${iconConfig.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold leading-snug text-[#6b7280]">
                        <span className="font-extrabold text-[#2d2d4e]">{lr.company.name}</span>
                        {" "}
                        {lr.status === "pending"
                          ? `— LR submitted by ${lr.executive.name}.`
                          : lr.status === "approved"
                            ? `— LR ${lr.trackingId} approved.`
                            : lr.status === "delivered"
                              ? `— marked delivered by executive.`
                              : lr.status === "rejected"
                                ? `— was suspended by admin.`
                                : `— LR ${lr.trackingId} ${lr.status}.`}
                      </p>
                      <p className="mt-0.5 text-[11px] font-semibold text-[#9ca3af]">
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
      <div className="mt-8 rounded-2xl border-0 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[#2d2d4e]">Top Companies by LR Volume</h2>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#f0ebfc] px-3 py-1 text-[11px] font-bold text-[#7b4fd4]">
              Top 5
            </span>
            <Link
              href="/super-admin/companies"
              className="rounded-full border border-[#e8edf5] px-3 py-1 text-[11px] font-bold text-[#6b7280] transition hover:border-[#7b4fd4] hover:text-[#7b4fd4]"
            >
              View All →
            </Link>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e8edf5] text-left">
                <th className="pb-3 pr-4 text-[11px] font-bold uppercase tracking-wider text-[#9ca3af]">#</th>
                <th className="pb-3 pr-4 text-[11px] font-bold uppercase tracking-wider text-[#9ca3af]">Company Name</th>
                <th className="pb-3 pr-4 text-[11px] font-bold uppercase tracking-wider text-[#9ca3af]">Branches</th>
                <th className="pb-3 pr-4 text-[11px] font-bold uppercase tracking-wider text-[#9ca3af]">Executives</th>
                <th className="pb-3 pr-4 text-[11px] font-bold uppercase tracking-wider text-[#9ca3af]">LRs This Month</th>
                <th className="pb-3 text-[11px] font-bold uppercase tracking-wider text-[#9ca3af]">Status</th>
              </tr>
            </thead>
            <tbody>
              {topCompanies.map((company, i) => {
                const lrPct = company.maxLrPerMonth > 0
                  ? Math.min(100, (company._count.lrRequests / company.maxLrPerMonth) * 100)
                  : 0;
                const barColor = lrPct >= 90
                  ? "bg-[#e74c3c]"
                  : lrPct >= 75
                    ? "bg-[#f5a623]"
                    : i === 0
                      ? "bg-[#7b4fd4]"
                      : i === 1
                        ? "bg-[#3b9fe8]"
                        : i === 2
                          ? "bg-[#2ecc71]"
                          : "bg-[#f5a623]";
                return (
                  <tr key={company.id} className="border-b border-[#e8edf5] last:border-0">
                    <td className="py-4 pr-4 text-sm font-extrabold text-[#e8edf5]">
                      {String(i + 1).padStart(2, "0")}
                    </td>
                    <td className="py-4 pr-4">
                      <Link
                        href={`/super-admin/companies/${company.id}`}
                        className="text-sm font-bold text-[#2d2d4e] hover:text-[#7b4fd4]"
                      >
                        {company.name}
                      </Link>
                    </td>
                    <td className="py-4 pr-4 text-sm font-semibold text-[#6b7280]">
                      {company._count.branches} / {company.maxBranches}
                    </td>
                    <td className="py-4 pr-4 text-sm font-semibold text-[#6b7280]">
                      {company._count.users} / {company.maxExecutives}
                    </td>
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-[#2d2d4e]">
                          {company._count.lrRequests} / {company.maxLrPerMonth}
                        </span>
                        <div className="h-2 w-24 rounded-full bg-[#e8edf5]">
                          <div
                            className={`h-2 rounded-full ${barColor} transition-all`}
                            style={{ width: `${lrPct}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        company.status === "active"
                          ? "bg-[#e8f8f0] text-[#2ecc71]"
                          : "bg-[#fdedec] text-[#e74c3c]"
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          company.status === "active" ? "bg-[#2ecc71]" : "bg-[#e74c3c]"
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
  { icon: CheckCircle2, bg: "bg-[#e8f8f0]", color: "text-[#2ecc71]" },
  { icon: AlertTriangle, bg: "bg-[#fef3e0]", color: "text-[#f5a623]" },
  { icon: XCircle, bg: "bg-[#fdedec]", color: "text-[#e74c3c]" },
  { icon: Rocket, bg: "bg-[#f0ebfc]", color: "text-[#7b4fd4]" },
  { icon: TrendingUp, bg: "bg-[#e8f8f0]", color: "text-[#2ecc71]" },
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
