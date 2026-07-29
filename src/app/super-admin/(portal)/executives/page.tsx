import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { Search, Users } from "lucide-react";

export const dynamic = "force-dynamic";

interface SearchParams {
  search?: string;
  status?: string;
  companyId?: string;
}

const STATUS_FILTERS: Array<{ key: string; label: string }> = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "invited", label: "Invited" },
  { key: "inactive", label: "Inactive" },
];

export default async function SuperAdminExecutivesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const q = params.search?.trim() ?? "";
  const status = params.status ?? "all";
  const companyId = params.companyId ?? "all";

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

  const [companies, executives] = await Promise.all([
    prisma.company.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, lrCode: true },
    }),
    prisma.user.findMany({
      where: {
        role: "executive",
        ...(status !== "all"
          ? { status: status as "active" | "invited" | "inactive" }
          : {}),
        ...(companyId !== "all" ? { companyId } : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q } },
                { mobile: { contains: q } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        branch: { select: { name: true, city: true } },
        company: { select: { name: true, lrCode: true } },
        executiveLrs: {
          where: { createdAt: { gte: monthStart, lt: monthEnd } },
          select: { id: true },
        },
      },
      take: 200,
    }),
  ]);

  return (
    <div className="p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">All Executives</h2>
          <p className="text-sm text-slate-500">
            Platform-wide directory across {companies.length} companies.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border-0 bg-white px-4 py-2 text-xs uppercase tracking-wider font-bold text-[#6b7280] shadow-sm">
          <Users className="h-4 w-4 text-[#7b4fd4]" />
          <span className="font-extrabold text-[#2d2d4e]">
            {executives.length}
          </span>
          executives loaded
        </div>
      </div>

      <form
        action="/super-admin/executives"
        method="GET"
        className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border-0 bg-white p-3 shadow-sm"
      >
        <div className="relative min-w-[260px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]" />
          <input
            name="search"
            defaultValue={q}
            placeholder="Search executives by name or mobile..."
            className="w-full rounded-full border border-[#e8edf5] bg-white pl-9 pr-4 py-2 text-sm font-semibold outline-none focus:border-[#7b4fd4] focus:bg-white focus:ring-2 focus:ring-[#f0ebfc]"
          />
        </div>

        <select
          name="status"
          defaultValue={status}
          className="rounded-full border border-[#e8edf5] bg-white px-3 py-2 text-sm font-bold text-[#2d2d4e]"
        >
          {STATUS_FILTERS.map((s) => (
            <option key={s.key} value={s.key}>
              Status: {s.label}
            </option>
          ))}
        </select>

        <select
          name="companyId"
          defaultValue={companyId}
          className="rounded-full border border-[#e8edf5] bg-white px-3 py-2 text-sm font-bold text-[#2d2d4e]"
        >
          <option value="all">All Companies</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="rounded-full bg-gradient-to-r from-[#7b4fd4] to-[#3b9fe8] px-5 py-2 text-sm font-bold text-white shadow-lg shadow-[#7b4fd4]/30 transition hover:shadow-xl"
        >
          Apply
        </button>
      </form>

      <div className="mt-6 overflow-hidden rounded-2xl border-0 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[#e8edf5] bg-[#fafbff] text-left text-xs uppercase tracking-wider font-bold text-[#9ca3af]">
              <tr>
                <th className="p-4">Executive</th>
                <th className="p-4">Mobile</th>
                <th className="p-4">Company</th>
                <th className="p-4">Branch</th>
                <th className="p-4">LRs (Month)</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {executives.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="p-12 text-center text-sm text-slate-400"
                  >
                    No executives match these filters.
                  </td>
                </tr>
              ) : (
                executives.map((d) => (
                  <tr
                    key={d.id}
                    className="border-b border-[#e8edf5] last:border-0 hover:bg-[#fafbff]"
                  >
                    <td className="p-4 font-bold text-[#2d2d4e]">
                      {d.name}
                    </td>
                    <td className="p-4 font-semibold text-[#6b7280]">+91 {d.mobile}</td>
                    <td className="p-4">
                      {d.company ? (
                        <Link
                          href={`/super-admin/companies/${d.companyId}`}
                          className="text-[#7b4fd4] font-bold hover:underline"
                        >
                          {d.company.name}
                        </Link>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="p-4 text-slate-600">
                      {d.branch?.name ?? "—"}
                    </td>
                    <td className="p-4 text-slate-700">
                      {d.executiveLrs.length}
                    </td>
                    <td className="p-4">
                      <StatusPill status={d.status} />
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

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    invited: "bg-amber-50 text-amber-700 ring-amber-200",
    inactive: "bg-slate-100 text-slate-500 ring-slate-200",
  };
  const cls = map[status] ?? map.inactive;
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ring-1 ${cls}`}
    >
      {status}
    </span>
  );
}
