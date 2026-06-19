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
      {/* Header with totals and Add Company */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4 text-sm">
          <span className="font-semibold text-slate-700">
            {activeCount + suspendedCount} total
          </span>
          <span className="flex items-center gap-1.5 text-emerald-600">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {activeCount} Active
          </span>
          <span className="flex items-center gap-1.5 text-red-500">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            {suspendedCount} Suspended
          </span>
        </div>
        <AddCompanyButton />
      </div>

      {/* Section title + Filter bar */}
      <div className="mt-6 rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">All Onboarded Companies</h2>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="text-xs font-medium text-slate-500">Filter by:</span>
            <form action="/super-admin/companies" method="GET" className="flex flex-wrap items-center gap-2">
              <select
                name="status"
                defaultValue={status}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-violet-300 focus:ring-1 focus:ring-violet-100"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
              <input
                name="search"
                defaultValue={search}
                placeholder="Search by name or code…"
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-violet-300 focus:ring-1 focus:ring-violet-100 min-w-[180px]"
              />
              <button
                type="submit"
                className="rounded-lg bg-violet-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-violet-700"
              >
                Apply
              </button>
            </form>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 text-left">
              <tr>
                <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Company Name</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Code</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Branches</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Drivers</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">LRs This Month</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Monthly Limit</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Status</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {companies.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-12 text-center text-sm text-slate-400"
                  >
                    No companies match these filters.
                  </td>
                </tr>
              ) : (
                companies.map((company) => (
                  <tr
                    key={company.id}
                    className="border-b border-slate-50 last:border-0 transition hover:bg-slate-50/50"
                  >
                    <td className="px-6 py-3.5">
                      <Link href={`/super-admin/companies/${company.id}`} className="block">
                        <p className="font-semibold text-slate-900 hover:text-violet-700 transition">
                          {company.name}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {company.contactPhone}
                        </p>
                      </Link>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="rounded bg-violet-50 px-2 py-0.5 text-[11px] font-bold text-violet-700">
                        {company.lrCode}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">
                      {company._count.branches} / {company.maxBranches}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">
                      {company._count.users} / {company.maxDrivers}
                    </td>
                    <td className="px-4 py-3.5">
                      <UsageText used={company._count.lrRequests} max={company.maxLrPerMonth} />
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-700">
                      {company.maxLrPerMonth}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                        company.status === "active" ? "text-emerald-600" : "text-red-500"
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          company.status === "active" ? "bg-emerald-500" : "bg-red-500"
                        }`} />
                        {company.status === "active" ? "Active" : "Suspended"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/super-admin/companies/${company.id}`}
                          className="rounded-md border border-violet-200 px-3 py-1 text-[11px] font-semibold text-violet-700 transition hover:bg-violet-50"
                        >
                          Edit Limits
                        </Link>
                        <Link
                          href={`/super-admin/companies/${company.id}`}
                          className={`rounded-md border px-3 py-1 text-[11px] font-semibold transition ${
                            company.status === "active"
                              ? "border-red-200 text-red-600 hover:bg-red-50"
                              : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                          }`}
                        >
                          {company.status === "active" ? "Suspend" : "Activate"}
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3">
            <p className="text-xs text-slate-400">
              Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, totalCount)} of {totalCount} companies
            </p>
            <div className="flex items-center gap-1">
              {page > 1 && (
                <Link
                  href={`/super-admin/companies?page=${page - 1}${search ? `&search=${search}` : ""}${status !== "all" ? `&status=${status}` : ""}`}
                  className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  ←
                </Link>
              )}
              {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={`/super-admin/companies?page=${p}${search ? `&search=${search}` : ""}${status !== "all" ? `&status=${status}` : ""}`}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                    p === page
                      ? "bg-violet-600 text-white"
                      : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {p}
                </Link>
              ))}
              {page < totalPages && (
                <Link
                  href={`/super-admin/companies?page=${page + 1}${search ? `&search=${search}` : ""}${status !== "all" ? `&status=${status}` : ""}`}
                  className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  →
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function UsageText({ used, max }: { used: number; max: number }) {
  const pct = max > 0 ? (used / max) * 100 : 0;
  const color = pct >= 90 ? "text-red-600 font-semibold" : pct >= 75 ? "text-amber-600" : "text-slate-600";
  return <span className={`text-sm ${color}`}>{used} / {max}</span>;
}
