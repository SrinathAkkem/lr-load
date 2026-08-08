import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import {
  computeDashboardStats,
  computeDashboardStatsAllTime,
  getCompanyById,
  getDailyLrCounts,
  getMonthlyLrCounts,
} from "@/lib/services/lr-service";
import { prisma } from "@/lib/db/prisma";
import { toLR } from "@/lib/db/serialize";
import {
  IconDocument,
  IconReceiptPending,
  IconOrderApprove,
  IconDeliveryTruck,
} from "@/components/rono/dashboard-icons";
import { DashboardVolumeChart } from "@/components/rono/dashboard-volume-chart";
import { StatCard } from "@/components/rono/stat-card";
import { DashboardLrTable } from "./dashboard-lr-table";

export const dynamic = "force-dynamic";

export default async function CompanyDashboardPage() {
  const session = await getSession();
  if (!session?.companyId) redirect("/company/login");

  const companyId = session.companyId;
  const [company, stats, recentRows, monthly] = await Promise.all([
    getCompanyById(companyId),
    computeDashboardStatsAllTime(companyId),
    prisma.lRRequest.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      take: 4,
      include: { executive: true },
    }),
    getMonthlyLrCounts(companyId, 12),
  ]);
  // Ensure the "Total Pending Approval" month figure used elsewhere stays
  // available for potential future widgets without recomputing here.
  await computeDashboardStats(companyId);

  const recentLrs = recentRows.map((lr) => ({
    ...toLR(lr),
    executiveName: lr.executive?.name ?? "Executive",
  }));

  const monthlyChartData = monthly.map((m) => ({ label: m.date, count: m.count }));

  return (
    <div className="p-4 md:p-8">
      {/* 4 Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<IconDocument className="h-4 w-[13px] text-[#5E3EA1]" />}
          iconBg="bg-[#5E3EA1]/10"
          topRight="Last 30 Days"
          title="Total LRs"
          value={stats.totalLrs}
          valueColor="text-[#5E3EA1]"
          trend={{ direction: "up", value: "2.1%" }}
        />
        <StatCard
          icon={<IconReceiptPending className="h-5 w-[19px] text-[#DE3500]" />}
          iconBg="bg-[#DE3500]/10"
          topRight="Last 30 Days"
          title="Total Pending Approval"
          value={stats.pending}
          valueColor="text-[#DE3500]"
        />
        <StatCard
          icon={<IconOrderApprove className="h-5 w-5 text-[#0C6B24]" />}
          iconBg="bg-[#0C6B24]/10"
          topRight="Last 30 Days"
          title="Approved"
          value={stats.approved}
          valueColor="text-[#0C6B24]"
          trend={{ direction: "up", value: `${stats.approvalRate.toFixed(1)}%` }}
        />
        <StatCard
          icon={<IconDeliveryTruck className="h-[18px] w-5 text-[#3C60B6]" />}
          iconBg="bg-[#3C60B6]/10"
          topRight={`${stats.inTransit} in transit`}
          title="Delivered"
          value={stats.delivered}
          valueColor="text-[#3C60B6]"
          trend={{ direction: "down", value: "8.9%" }}
        />
      </div>

      {/* LR Volume Chart + Recent Activity side by side */}
      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <DashboardVolumeChart monthly={monthlyChartData} />
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-black">Recent Activity</h2>
            <Link
              href="/company/lr"
              className="rounded-lg border border-black/10 px-3 py-1.5 text-xs font-semibold text-[#4D4D4D] transition hover:border-brand hover:text-brand"
            >
              See all
            </Link>
          </div>

          <div className="mt-4 space-y-1">
            {recentLrs.length === 0 ? (
              <p className="text-sm text-slate-400">No activity yet.</p>
            ) : (
              recentLrs.map((lr) => {
                const cfg = getActivityIcon(lr.status);
                return (
                  <div key={lr.id} className="flex items-start gap-3 rounded-xl px-2 py-3 transition hover:bg-black/[0.02]">
                    <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${cfg.bg}`}>
                      <cfg.icon className={`h-3.5 w-3 ${cfg.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-[13px] leading-snug ${cfg.textColor}`}>
                        {lr.status === "approved" && (
                          <>LR <span className="font-semibold">{lr.trackingId}</span> approved.</>
                        )}
                        {lr.status === "pending" && (
                          <>Executive <span className="font-semibold">{lr.executiveName}</span> Submitted LR.</>
                        )}
                        {lr.status === "delivered" && (
                          <>LR <span className="font-semibold">{lr.trackingId}</span> marked delivered.</>
                        )}
                        {lr.status === "rejected" && (
                          <>Executive <span className="font-semibold">{lr.executiveName}</span> Submitted LR.</>
                        )}
                        {!["approved", "pending", "delivered", "rejected"].includes(lr.status) && (
                          <>LR <span className="font-semibold">{lr.trackingId}</span> {lr.status}.</>
                        )}
                      </p>
                      <p className="mt-0.5 text-[11px] text-[#9CA3AF]">{timeAgo(new Date(lr.createdAt))}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* All LR Requests table */}
      <div className="mt-6">
        <DashboardLrTable />
      </div>
    </div>
  );
}

function getActivityIcon(status: string) {
  switch (status) {
    case "approved":
      return { icon: IconDocument, bg: "bg-[#0C6B24]/10", color: "text-[#0C6B24]", textColor: "text-[#0C6B24]" };
    case "pending":
      return { icon: IconDocument, bg: "bg-[#F7CE25]/20", color: "text-[#967E1C]", textColor: "text-[#1E1E1E]" };
    case "delivered":
      return { icon: IconDeliveryTruck, bg: "bg-[#3C60B6]/10", color: "text-[#3C60B6]", textColor: "text-[#1E1E1E]" };
    case "rejected":
      return { icon: IconDocument, bg: "bg-[#961C1C]/20", color: "text-[#961C1C]", textColor: "text-[#C00F0C]" };
    default:
      return { icon: IconDocument, bg: "bg-slate-100", color: "text-slate-500", textColor: "text-[#1E1E1E]" };
  }
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
