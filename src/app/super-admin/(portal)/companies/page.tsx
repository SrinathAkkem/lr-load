import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { AddCompanyButton } from "./add-company-button";

export const dynamic = "force-dynamic";

export default async function CompaniesListPage() {
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

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Companies</h1>
          <p className="text-slate-500">All onboarded transport companies</p>
        </div>
        <AddCompanyButton />
      </div>

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="p-4">Company Name</th>
              <th className="p-4">Code</th>
              <th className="p-4">Branches</th>
              <th className="p-4">Drivers</th>
              <th className="p-4">LRs This Month</th>
              <th className="p-4">Status</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {companies.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-10 text-center text-sm text-slate-400">
                  No companies onboarded yet. Click <span className="font-semibold">Add Company</span> to create the first one.
                </td>
              </tr>
            ) : (
              companies.map((company) => (
                <tr key={company.id} className="border-b last:border-0 hover:bg-slate-50">
                  <td className="p-4">
                    <p className="font-semibold">{company.name}</p>
                    <p className="text-xs text-slate-500">{company.contactPhone}</p>
                  </td>
                  <td className="p-4">
                    <span className="rounded-full bg-violet-50 px-2 py-1 text-xs font-bold text-violet-700">
                      {company.lrCode}
                    </span>
                  </td>
                  <td className="p-4">
                    {company._count.branches} / {company.maxBranches}
                  </td>
                  <td className="p-4">
                    {company._count.users} / {company.maxDrivers}
                  </td>
                  <td className="p-4">
                    {company._count.lrRequests} / {company.maxLrPerMonth}
                  </td>
                  <td className="p-4">
                    <span
                      className={
                        company.status === "active"
                          ? "text-emerald-600"
                          : "text-red-600"
                      }
                    >
                      ● {company.status === "active" ? "Active" : "Suspended"}
                    </span>
                  </td>
                  <td className="p-4">
                    <Link
                      href={`/super-admin/companies/${company.id}`}
                      className="text-violet-600 hover:underline"
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
  );
}
