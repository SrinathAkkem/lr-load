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
      ? { status: status as "pending" | "active" | "suspended" }
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
            users: { where: { role: "executive" } },
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
  const pendingCount =
    totals.find((t) => t.status === "pending")?._count._all ?? 0;
  const totalPages = Math.ceil(totalCount / perPage);

  return (
    <div className="p-4 md:p-8 bg-[#f4f6fb]">
      {/* Header with totals and Add Company */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className="font-bold text-[#2d2d4e]">
            {activeCount + suspendedCount + pendingCount} total
          </span>
          {pendingCount > 0 && (
            <Link
              href="/super-admin/companies?status=pending"
              className="flex items-center gap-1.5 font-bold text-[#c8890a] hover:underline"
            >
              <span className="h-2 w-2 rounded-full bg-[#f7ce25]" />
              {pendingCount} Pending Approval
            </Link>
          )}
          <span className="flex items-center gap-1.5 font-bold text-[#2ecc71]">
            <span className="h-2 w-2 rounded-full bg-[#2ecc71]" />
            {activeCount} Active
          </span>
          <span className="flex items-center gap-1.5 font-bold text-[#e74c3c]">
            <span className="h-2 w-2 rounded-full bg-[#e74c3c]" />
            {suspendedCount} Suspended
          </span>
        </div>
        <AddCompanyButton />
      </div>

      {/* Section title + Filter bar */}
      <div className="mt-6 rounded-2xl border-0 bg-white shadow-sm">
        <div className="border-b border-[#e8edf5] px-4 py-4 md:px-6">
          <h2 className="text-base font-bold text-[#2d2d4e]">All Onboarded Companies</h2>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-[#6b7280]">Filter by:</span>
            <form action="/super-admin/companies" method="GET" className="flex flex-wrap items-center gap-2">
              <select
                name="status"
                defaultValue={status}
                className="rounded-lg border border-[#e8edf5] bg-white px-3 py-1.5 text-xs font-semibold text-[#2d2d4e] outline-none focus:border-brand focus:ring-2 focus:ring-brand"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending Approval</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
              <input
                name="search"
                defaultValue={search}
                placeholder="Search by name or code…"
                className="min-w-0 flex-1 basis-full rounded-lg border border-[#e8edf5] bg-white px-3 py-1.5 text-xs font-semibold outline-none focus:border-brand focus:ring-2 focus:ring-brand sm:basis-auto sm:min-w-[180px]"
              />
              <button
                type="submit"
                className="rounded-full bg-brand-gradient px-4 py-1.5 text-xs font-bold text-white shadow-md shadow-brand transition hover:shadow-lg"
              >
                Apply
              </button>
            </form>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[#e8edf5] text-left">
              <tr>
                <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-[#9ca3af]">Company Name</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[#9ca3af]">Code</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[#9ca3af]">Branches</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[#9ca3af]">Executives</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[#9ca3af]">LRs This Month</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[#9ca3af]">Monthly Limit</th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[#9ca3af]">Status</th>
                <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-[#9ca3af]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {companies.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-12 text-center text-sm font-semibold text-[#9ca3af]"
                  >
                    No companies match these filters.
                  </td>
                </tr>
              ) : (
                companies.map((company) => (
                  <tr
                    key={company.id}
                    className="border-b border-[#e8edf5] last:border-0 transition hover:bg-[#fafbff]"
                  >
                    <td className="px-6 py-3.5">
                      <Link href={`/super-admin/companies/${company.id}`} className="block">
                        <p className="font-bold text-[#2d2d4e] hover:text-brand transition">
                          {company.name}
                        </p>
                        <p className="text-[11px] font-semibold text-[#9ca3af]">
                          {company.contactPhone}
                        </p>
                      </Link>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="rounded-full bg-brand-gradient-soft px-2.5 py-0.5 text-[11px] font-bold text-brand">
                        {company.lrCode}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-[#6b7280]">
                      {company._count.branches} / {company.maxBranches}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-[#6b7280]">
                      {company._count.users} / {company.maxExecutives}
                    </td>
                    <td className="px-4 py-3.5">
                      <UsageText used={company._count.lrRequests} max={company.maxLrPerMonth} />
                    </td>
                    <td className="px-4 py-3.5 font-bold text-[#2d2d4e]">
                      {company.maxLrPerMonth}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        company.status === "active"
                          ? "bg-[#e8f8f0] text-[#2ecc71]"
                          : company.status === "pending"
                            ? "bg-[#fef9e7] text-[#c8890a]"
                            : "bg-[#fdedec] text-[#e74c3c]"
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          company.status === "active"
                            ? "bg-[#2ecc71]"
                            : company.status === "pending"
                              ? "bg-[#f7ce25]"
                              : "bg-[#e74c3c]"
                        }`} />
                        {company.status === "active" ? "Active" : company.status === "pending" ? "Pending" : "Suspended"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {company.status === "pending" ? (
                          <Link
                            href={`/super-admin/companies/${company.id}`}
                            className="rounded-full border border-[#f7ce25] bg-[#fef9e7] px-3 py-1 text-[11px] font-bold text-[#c8890a] transition hover:bg-[#fef1c4]"
                          >
                            Review
                          </Link>
                        ) : (
                          <>
                            <Link
                              href={`/super-admin/companies/${company.id}`}
                              className="rounded-full border border-[#e8edf5] px-3 py-1 text-[11px] font-bold text-brand transition hover:bg-brand-gradient-soft"
                            >
                              Edit Limits
                            </Link>
                            <Link
                              href={`/super-admin/companies/${company.id}`}
                              className={`rounded-full border px-3 py-1 text-[11px] font-bold transition ${
                                company.status === "active"
                                  ? "border-[#fdedec] text-[#e74c3c] hover:bg-[#fdedec]"
                                  : "border-[#e8f8f0] text-[#2ecc71] hover:bg-[#e8f8f0]"
                              }`}
                            >
                              {company.status === "active" ? "Suspend" : "Activate"}
                            </Link>
                          </>
                        )}
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
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#e8edf5] px-4 py-3 md:px-6">
            <p className="text-xs font-semibold text-[#9ca3af]">
              Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, totalCount)} of {totalCount} companies
            </p>
            <div className="flex flex-wrap items-center gap-1">
              {page > 1 && (
                <Link
                  href={`/super-admin/companies?page=${page - 1}${search ? `&search=${search}` : ""}${status !== "all" ? `&status=${status}` : ""}`}
                  className="rounded-lg border border-[#e8edf5] px-2.5 py-1 text-xs font-bold text-[#6b7280] hover:bg-[#fafbff]"
                >
                  ←
                </Link>
              )}
              {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={`/super-admin/companies?page=${p}${search ? `&search=${search}` : ""}${status !== "all" ? `&status=${status}` : ""}`}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                    p === page
                      ? "bg-brand text-white"
                      : "border border-[#e8edf5] text-[#6b7280] hover:bg-[#fafbff]"
                  }`}
                >
                  {p}
                </Link>
              ))}
              {page < totalPages && (
                <Link
                  href={`/super-admin/companies?page=${page + 1}${search ? `&search=${search}` : ""}${status !== "all" ? `&status=${status}` : ""}`}
                  className="rounded-lg border border-[#e8edf5] px-2.5 py-1 text-xs font-bold text-[#6b7280] hover:bg-[#fafbff]"
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
