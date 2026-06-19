import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { AddCompanyButton } from "./add-company-button";

export const dynamic = "force-dynamic";

interface SearchParams {
  search?: string;
  status?: string;
}

export default async function CompaniesListPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const search = params.search?.trim() ?? "";
  const status = params.status ?? "all";

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

  const companies = await prisma.company.findMany({
    where: {
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
    },
    orderBy: { createdAt: "desc" },
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
  });

  const totals = await prisma.company.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  const activeCount =
    totals.find((t) => t.status === "active")?._count._all ?? 0;
  const suspendedCount =
    totals.find((t) => t.status === "suspended")?._count._all ?? 0;

  return (
    <div className="p-6 md:p-8">
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
          placeholder="Search by name, code, or contact..."
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
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {companies.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="p-10 text-center text-sm text-slate-400"
                  >
                    No companies match these filters.
                  </td>
                </tr>
              ) : (
                companies.map((company) => (
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
                    <td className="p-4 text-slate-700">
                      {company._count.branches} / {company.maxBranches}
                    </td>
                    <td className="p-4 text-slate-700">
                      {company._count.users} / {company.maxDrivers}
                    </td>
                    <td className="p-4 text-slate-700">
                      {company._count.lrRequests} / {company.maxLrPerMonth}
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
                      <Link
                        href={`/super-admin/companies/${company.id}`}
                        className="text-sm font-semibold text-violet-600 hover:underline"
                      >
                        Manage →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
