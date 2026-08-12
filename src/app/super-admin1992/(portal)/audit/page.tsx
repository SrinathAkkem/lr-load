import { listAuditEvents } from "@/lib/services/audit-log";
import { formatAuditDetails } from "@/lib/audit/format-details";
import { ScrollText } from "lucide-react";

export const dynamic = "force-dynamic";

const ACTION_LABELS: Record<string, { label: string; tone: string }> = {
  "company.create": {
    label: "Created company",
    tone: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  "company.activate": {
    label: "Activated company",
    tone: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  "company.suspend": {
    label: "Suspended company",
    tone: "bg-red-50 text-red-700 ring-red-200",
  },
  "company.limits.update": {
    label: "Updated limits",
    tone: "bg-brand-gradient-soft text-brand ring-[#d4c5f9]",
  },
  "lr.approve": {
    label: "Approved LR",
    tone: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  "lr.reject": {
    label: "Rejected LR",
    tone: "bg-red-50 text-red-700 ring-red-200",
  },
  "executive.invite": {
    label: "Invited executive",
    tone: "bg-blue-50 text-blue-700 ring-blue-200",
  },
  "auth.password.change": {
    label: "Password changed",
    tone: "bg-amber-50 text-amber-700 ring-amber-200",
  },
};

export default async function SuperAdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; search?: string }>;
}) {
  const params = await searchParams;
  const search = params.search?.trim().toLowerCase() ?? "";
  const action = params.action && params.action !== "all" ? params.action : undefined;

  const events = await listAuditEvents({ action, limit: 200 });
  const filtered = search
    ? events.filter(
        (e) =>
          e.actorName.toLowerCase().includes(search) ||
          (e.target ?? "").toLowerCase().includes(search) ||
          e.action.toLowerCase().includes(search),
      )
    : events;

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--brand-gradient-start)]/10 to-[var(--brand-gradient-end)]/10">
          <ScrollText className="h-5 w-5 text-brand" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Audit Log</h2>
          <p className="text-sm text-slate-500">
            Append-only trail of every administrative action.
          </p>
        </div>
      </div>

      <form
        action="/super-admin1992/audit"
        method="GET"
        className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border-0 bg-white p-3 shadow-sm"
      >
        <input
          name="search"
          defaultValue={search}
          placeholder="Search by actor, target, or action..."
          className="min-w-0 flex-1 basis-full rounded-full border border-[#e8edf5] bg-white px-4 py-2 text-sm font-semibold outline-none focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand sm:basis-[260px]"
        />
        <select
          name="action"
          defaultValue={action ?? "all"}
          className="rounded-full border border-[#e8edf5] bg-white px-3 py-2 text-sm font-bold text-[#2d2d4e]"
        >
          <option value="all">All actions</option>
          {Object.entries(ACTION_LABELS).map(([key, v]) => (
            <option key={key} value={key}>
              {v.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="w-full rounded-full bg-brand-gradient px-5 py-2 text-sm font-bold text-white shadow-lg shadow-brand transition hover:shadow-xl sm:w-auto"
        >
          Filter
        </button>
      </form>

      <div className="mt-6 overflow-hidden rounded-2xl border-0 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[#e8edf5] bg-[#fafbff] text-left text-xs uppercase tracking-wider text-[#9ca3af] font-bold">
              <tr>
                <th className="p-4">When</th>
                <th className="p-4">Actor</th>
                <th className="p-4">Action</th>
                <th className="p-4">Target</th>
                <th className="p-4">Details</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-12 text-center text-sm text-slate-400"
                  >
                    No audit events recorded yet.
                  </td>
                </tr>
              ) : (
                filtered.map((e) => {
                  const def = ACTION_LABELS[e.action];
                  return (
                    <tr
                      key={e.id}
                      className="border-b border-[#e8edf5] last:border-0 hover:bg-[#fafbff]"
                    >
                      <td className="p-4 align-top text-xs font-semibold text-[#6b7280]">
                        {new Date(e.createdAt).toLocaleString("en-IN")}
                      </td>
                      <td className="p-4 align-top">
                        <p className="font-bold text-[#2d2d4e]">
                          {e.actorName}
                        </p>
                        <p className="text-[11px] uppercase tracking-wider text-slate-400">
                          {e.actorRole.replace("_", " ")}
                        </p>
                      </td>
                      <td className="p-4 align-top">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${
                            def?.tone ??
                            "bg-slate-100 text-slate-600 ring-slate-200"
                          }`}
                        >
                          {def?.label ?? e.action}
                        </span>
                      </td>
                      <td className="p-4 align-top text-slate-700">
                        {e.target ?? "—"}
                      </td>
                      <td className="p-4 align-top text-sm text-slate-600">
                        {formatAuditDetails(e.action, e.metadata) ?? "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
