import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { AddCompanyButton } from "./add-company-button";

export const dynamic = "force-dynamic";

interface SearchParams {
  search?: string;
  status?: string;
  page?: string;
}

export default async function CompaniesListPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const search = params.search?.trim() ?? "";
  const status = params.status ?? "all";
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const perPage = 7;

  const monthStart = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1,
  );
  const monthEnd = new Date(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    1,
  );

  const where = {
    ...(status !== "all"
      ? { status: status as "active" | "suspended" }
      : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search } },
            { lrCode: { contains: search.toUpperCase() } },
            { contactPhone: { contains: search } },
          ],
        }
      : {}),
  };

  const [companies, totalCount] = await Promise.all([
    prisma.company.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
      include: {
        _count: {
          select: {
            branches: true,
            users: { where: { role: "driver" } },
            lrRequests: {
              where: { createdAt: { gte: monthStart, lt: monthEnd } },
            },
          },
        },
      },
    }),
    prisma.company.count({ where }),
  ]);

  const totals = await prisma.company.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  const activeCount =
    totals.find((t) => t.status === "active")?._count._all ?? 0;
  const suspendedCount =
    totals.find((t) => t.status === "suspended")?._count._all ?? 0;
  const totalPages = Math.ceil(totalCount / perPage);

  return (
    <div className="p-6 md:p-8">
      <div className="mb-4">
        <h1 className="text-lg font-bold text-slate-900">All Onboarded Companies</h1>
      </div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4 text-sm">
          <span className="rounded-full bg-violet-50 px-3 py-1 font-semibold text-violet-700">
            {activeCount + suspendedCount} total
          </span>
          <span className="flex items-center gap-1 text-emerald-600">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {activeCount} Active
          </span>
          <span className="flex items-center gap-1 text-rose-600">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            {suspendedCount} Suspended
          </span>
        </div>
        <AddCompanyButton />
      </div>

      <form
        action="/super-admin/companies"
        method="GET"
        className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border bg-white p-3 shadow-sm"
      >
        <input
          name="search"
          defaultValue={search}
          placeholder="Search by name or code…"
          className="min-w-[260px] flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-violet-300 focus:bg-white focus:ring-2 focus:ring-violet-100"
        />
        <select
          name="status"
          defaultValue={status}
          className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
        <button
          type="submit"
          className="rounded-full bg-violet-600 px-5 py-2 text-sm font-semibold text-white shadow transition hover:bg-violet-700"
        >
          Apply
        </button>
      </form>

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="p-4">Company Name</th>
                <th className="p-4">Code</th>
                <th className="p-4">Branches</th>
                <th className="p-4">Drivers</th>
                <th className="p-4">LRs This Month</th>
                <th className="p-4">Monthly Limit</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {companies.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="p-10 text-center text-sm text-slate-400"
                  >
                    No companies match these filters.
                  </td>
                </tr>
              ) : (
                companies.map((company) => {
                  const branchPct = company.maxBranches > 0
                    ? (company._count.branches / company.maxBranches) * 100
                    : 0;
                  const driverPct = company.maxDrivers > 0
                    ? (company._count.users / company.maxDrivers) * 100
                    : 0;
                  const lrPct = company.maxLrPerMonth > 0
                    ? (company._count.lrRequests / company.maxLrPerMonth) * 100
                    : 0;

                  return (
                    <tr
                      key={company.id}
                      className="border-b last:border-0 hover:bg-slate-50"
                    >
                      <td className="p-4">
                        <p className="font-semibold text-slate-900">
                          {company.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {company.contactPhone}
                        </p>
                      </td>
                      <td className="p-4">
                        <span className="rounded-full bg-violet-50 px-2 py-1 text-xs font-bold text-violet-700">
                          {company.lrCode}
                        </span>
                      </td>
                      <td className="p-4">
                        <UsageCell used={company._count.branches} max={company.maxBranches} pct={branchPct} color="blue" />
                      </td>
                      <td className="p-4">
                        <UsageCell used={company._count.users} max={company.maxDrivers} pct={driverPct} color="violet" />
                      </td>
                      <td className="p-4">
                        <UsageCell used={company._count.lrRequests} max={company.maxLrPerMonth} pct={lrPct} color="amber" />
                      </td>
                      <td className="p-4 font-medium text-slate-700">
                        {company.maxLrPerMonth}
                      </td>
                      <td className="p-4">
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
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/super-admin/companies/${company.id}`}
                            className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 transition hover:bg-violet-100"
                          >
                            Edit Limits
                          </Link>
                          <SuspendButton companyId={company.id} currentStatus={company.status} />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <p className="text-slate-500">
            Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, totalCount)} of {totalCount} companies
          </p>
          <div className="flex items-center gap-1">
            {page > 1 && (
              <Link
                href={`/super-admin/companies?page=${page - 1}${search ? `&search=${search}` : ""}${status !== "all" ? `&status=${status}` : ""}`}
                className="rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-slate-50"
              >
                ←
              </Link>
            )}
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={`/super-admin/companies?page=${p}${search ? `&search=${search}` : ""}${status !== "all" ? `&status=${status}` : ""}`}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  p === page ? "bg-violet-600 text-white" : "border hover:bg-slate-50"
                }`}
              >
                {p}
              </Link>
            ))}
            {page < totalPages && (
              <Link
                href={`/super-admin/companies?page=${page + 1}${search ? `&search=${search}` : ""}${status !== "all" ? `&status=${status}` : ""}`}
                className="rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-slate-50"
              >
                →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function UsageCell({ used, max, pct, color }: { used: number; max: number; pct: number; color: "blue" | "violet" | "amber" }) {
  const barColor = pct >= 90
    ? "bg-red-500"
    : pct >= 75
      ? "bg-amber-500"
      : color === "blue"
        ? "bg-blue-500"
        : color === "violet"
          ? "bg-violet-500"
          : "bg-amber-500";

  const textColor = pct >= 90
    ? "text-red-700"
    : pct >= 75
      ? "text-amber-700"
      : "text-slate-700";

  return (
    <div className="min-w-[80px]">
      <p className={`text-xs font-semibold ${textColor}`}>
        {used} <span className="text-slate-400">/ {max}</span>
      </p>
      <div className="mt-1 h-1.5 rounded-full bg-slate-100">
        <div
          className={`h-1.5 rounded-full transition-all ${barColor}`}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
    </div>
  );
}

function SuspendButton({ companyId, currentStatus }: { companyId: string; currentStatus: string }) {
  if (currentStatus === "suspended") {
    return (
      <Link
        href={`/super-admin/companies/${companyId}`}
        className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
      >
        Activate
      </Link>
    );
  }
  return (
    <Link
      href={`/super-admin/companies/${companyId}`}
      className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100"
    >
      Suspend
    </Link>
  );
}
