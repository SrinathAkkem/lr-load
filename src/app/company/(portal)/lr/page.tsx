import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { computeDashboardStatsAllTime } from "@/lib/services/lr-service";
import { AlertTriangle } from "lucide-react";
import {
  IconDocument,
  IconReceiptPending,
  IconOrderApprove,
  IconDeliveryTruck,
} from "@/components/rono/dashboard-icons";
import { StatCard } from "@/components/rono/stat-card";
import { DashboardLrTable } from "../dashboard/dashboard-lr-table";

export const dynamic = "force-dynamic";

export default async function CompanyLRPage() {
  const session = await getSession();
  if (!session?.companyId) redirect("/company/login");

  const stats = await computeDashboardStatsAllTime(session.companyId);

  return (
    <div className="p-4 md:p-8">
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
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
        />
        <StatCard
          icon={<AlertTriangle className="h-4 w-4 text-[#961C1C]" />}
          iconBg="bg-[#961C1C]/10"
          topRight="Last 30 Days"
          title="Rejected"
          value={stats.rejected}
          valueColor="text-[#961C1C]"
        />
      </div>

      {/* All LR Requests table */}
      <div className="mt-6">
        <DashboardLrTable perPage={10} />
      </div>
    </div>
  );
}
