import { prisma } from "@/lib/db/prisma";
import { StatCard } from "@/components/rono/brand";
import { Building2, Truck, FileText, Sparkles } from "lucide-react";
import Link from "next/link";
import {
  formatCurrency,
  getDailyLrCounts,
  getMonthlyLrCounts,
} from "@/lib/services/lr-service";
import { LrVolumeChart } from "@/components/rono/lr-volume-chart";

export const dynamic = "force-dynamic";

export default async function SuperAdminDashboardPage() {
  const [companies, totalDrivers, totalLrs, daily, monthly, freightAgg] =
    await Promise.all([
      prisma.company.findMany({
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { lrRequests: true } } },
      }),
      prisma.user.count({ where: { role: "driver", status: "active" } }),
      prisma.lRRequest.count(),
      getDailyLrCounts(null, 7),
      getMonthlyLrCounts(null, 12),
      prisma.lRRequest.aggregate({
        _sum: { freightAmount: true },
        where: { status: { not: "rejected" } },
      }),
    ]);

  const activeCompanies = companies.filter((c) => c.status === "active");
  const platformGmv = freightAgg._sum.freightAmount
    ? Number(freightAgg._sum.freightAmount.toString())
    : 0;

  return (
    <div className="p-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500">
            Platform overview for RonoHub Super Admin
          </p>
        </div>
        <Link
          href="/super-admin/companies"
          className="inline-flex items-center gap-1.5 rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Manage Companies
        </Link>
      </header>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Companies"
          value={companies.length}
          subtitle={`${activeCompanies.length} active · ${companies.length - activeCompanies.length} suspended`}
          icon={<Building2 className="h-5 w-5 text-blue-600" />}
          accent="blue"
        />
        <StatCard
          title="Active Drivers"
          value={totalDrivers.toLocaleString("en-IN")}
          subtitle="Across all companies"
          icon={<Truck className="h-5 w-5 text-violet-600" />}
          accent="violet"
        />
        <StatCard
          title="Total LRs Issued"
          value={totalLrs.toLocaleString("en-IN")}
          subtitle="All time"
          icon={<FileText className="h-5 w-5 text-amber-600" />}
          accent="amber"
        />
        <StatCard
          title="Platform GMV"
          value={formatCurrency(platformGmv)}
          subtitle="Total approved freight"
          icon={<Sparkles className="h-5 w-5 text-emerald-600" />}
          accent="emerald"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <LrVolumeChart
            daily={daily}
            monthly={monthly}
            title="LR Volume Across Platform"
          />
        </div>

        <div className="rounded-2xl border bg-gradient-to-br from-violet-600 to-indigo-600 p-6 text-white shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-violet-100">
            Active Tenants
          </h2>
          <p className="mt-2 text-4xl font-bold">{activeCompanies.length}</p>
          <p className="mt-1 text-sm text-violet-200">
            of {companies.length} total companies
          </p>
          <Link
            href="/super-admin/companies"
            className="mt-4 inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-white/30 backdrop-blur transition hover:bg-white/25"
          >
            View all →
          </Link>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Company Activity</h2>
          <Link
            href="/super-admin/companies"
            className="text-sm font-semibold text-violet-600 hover:underline"
          >
            See all
          </Link>
        </div>
        <div className="mt-4 space-y-3">
          {companies.length === 0 ? (
            <p className="text-sm text-slate-500">No companies yet.</p>
          ) : (
            companies.slice(0, 5).map((company) => (
              <Link
                key={company.id}
                href={`/super-admin/companies/${company.id}`}
                className="flex items-center justify-between rounded-xl border border-slate-100 p-4 transition hover:border-violet-200 hover:bg-violet-50/40"
              >
                <div>
                  <p className="font-semibold">{company.name}</p>
                  <p className="text-sm text-slate-500">
                    {company.lrCode} · {company._count.lrRequests} LRs
                  </p>
                </div>
                <span
                  className={
                    company.status === "active"
                      ? "rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                      : "rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700"
                  }
                >
                  {company.status === "active" ? "Active" : "Suspended"}
                </span>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
