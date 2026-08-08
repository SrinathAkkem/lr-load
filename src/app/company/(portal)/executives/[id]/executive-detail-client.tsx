"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronLeft, Eye, Phone } from "lucide-react";
import { formatINR, LR_STATUS_PILL } from "@/components/rono/status-badge";
import { IconBuilding, IconDeliveryTruck } from "@/components/rono/dashboard-icons";
import { ActionMenu } from "@/components/rono/action-menu";
import type { LRRequest } from "@/lib/types";
import type { SavedAddressDto } from "@/lib/db/serialize";

interface Branch {
  id: string;
  name: string;
  city: string;
  state: string;
}

interface Executive {
  id: string;
  name: string;
  mobile: string;
  status: string;
  createdAt: string;
  branch: Branch | null;
}

interface Stats {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
}

const PER_PAGE = 10;
const ADDRESS_PREVIEW_COUNT = 6;

export function ExecutiveDetailClient({
  executive,
  stats,
  lrs,
  addresses,
  branches,
  initialEdit = false,
}: {
  executive: Executive;
  stats: Stats;
  lrs: LRRequest[];
  addresses: SavedAddressDto[];
  branches: Branch[];
  initialEdit?: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(initialEdit);
  const [branchId, setBranchId] = useState(executive.branch?.id ?? "");
  const [mobile, setMobile] = useState(executive.mobile);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [addressTab, setAddressTab] = useState<"consignee" | "consigner">("consignee");
  const [showAllAddresses, setShowAllAddresses] = useState(false);

  const totalPages = Math.max(1, Math.ceil(lrs.length / PER_PAGE));
  const paged = lrs.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const filteredAddresses = useMemo(
    () => addresses.filter((a) => a.type === addressTab),
    [addresses, addressTab],
  );
  const visibleAddresses = showAllAddresses
    ? filteredAddresses
    : filteredAddresses.slice(0, ADDRESS_PREVIEW_COUNT);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/executives/${executive.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branchId, mobile }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Executive updated");
        setEditing(false);
        router.refresh();
      } else {
        toast.error(data.error ?? "Failed to update");
      }
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    setBranchId(executive.branch?.id ?? "");
    setMobile(executive.mobile);
    setEditing(false);
  }

  const approvedPct = stats.total ? (stats.approved / stats.total) * 100 : 0;
  const pendingPct = stats.total ? (stats.pending / stats.total) * 100 : 0;
  const rejectedPct = stats.total ? (stats.rejected / stats.total) * 100 : 0;

  return (
    <div className="p-4 md:p-8">
      <Link
        href="/company/executives"
        className="inline-flex items-center gap-1 text-xs font-semibold text-[#4D4D4D] hover:text-black"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        Back to Executive Management
      </Link>
      <h1 className="mt-1 text-xl font-bold text-black">Executive Detail</h1>

      {/* Profile card */}
      <div className="mt-4 rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F2EFFA] text-[#5E3EA1]">
              <IconDeliveryTruck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-base font-bold text-black">{executive.name}</p>
              <p className="text-xs text-[#9CA3AF]">
                #{executive.mobile.slice(-4)} · Executive Since {shortDate(executive.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            {!editing && (
              <>
                <span className="text-[11px] font-medium text-[#9CA3AF]">Last Active Today</span>
                <StatusPill status={executive.status} />
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="rounded-lg bg-[#5E3EA1] px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90"
                >
                  Edit
                </button>
              </>
            )}
            {editing && (
              <>
                <button
                  type="button"
                  onClick={save}
                  disabled={saving}
                  className="rounded-lg bg-[#5E3EA1] px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={cancel}
                  className="rounded-lg border border-black/15 px-4 py-2 text-xs font-semibold text-black transition hover:bg-black/[0.03]"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>

        {/* Branch / phone */}
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-[#9CA3AF]">
              <IconBuilding className="h-3.5 w-3.5" /> Branch
            </p>
            {editing ? (
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="w-full rounded-lg border border-black/10 bg-white px-3.5 py-2.5 text-sm text-black outline-none focus:border-[#5E3EA1]/40 focus:ring-1 focus:ring-[#5E3EA1]/30"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-sm font-semibold text-black">{executive.branch?.name ?? "—"}</p>
            )}
          </div>
          <div>
            <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-[#9CA3AF]">
              <Phone className="h-3.5 w-3.5" /> Phone No.
            </p>
            {editing ? (
              <input
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                className="w-full rounded-lg border border-black/10 bg-white px-3.5 py-2.5 text-sm text-black outline-none focus:border-[#5E3EA1]/40 focus:ring-1 focus:ring-[#5E3EA1]/30"
              />
            ) : (
              <p className="text-sm font-semibold text-black">+91 {executive.mobile}</p>
            )}
          </div>
        </div>

        {/* LR progress bar */}
        <div className="mt-6">
          <span className="inline-block rounded-md bg-[#F2EFFA] px-2.5 py-1 text-[11px] font-semibold text-[#5E3EA1]">
            {stats.total} LR
          </span>
          <div className="mt-2 flex h-2.5 w-full overflow-hidden rounded-full bg-[#EFECF6]">
            <div className="h-full bg-[#5E3EA1]" style={{ width: `${approvedPct}%` }} />
            <div className="h-full bg-[#CDC3E2]" style={{ width: `${pendingPct}%` }} />
            <div className="h-full bg-[#961C1C]" style={{ width: `${rejectedPct}%` }} />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-[11px] text-[#4D4D4D]">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#5E3EA1]" /> LR Approved
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#CDC3E2]" /> LR Pending
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#961C1C]" /> Rejected
            </span>
          </div>
        </div>

        {/* Stat boxes */}
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatBox label="LR Approved" value={stats.approved} />
          <StatBox label="LR Pending" value={stats.pending} />
          <StatBox label="LR Rejected" value={stats.rejected} />
        </div>
      </div>

      {/* LR Detail By Executive */}
      <div className="mt-6 rounded-2xl border border-black/[0.06] bg-white shadow-sm">
        <div className="border-b border-black/[0.06] px-4 py-4 md:px-6">
          <h2 className="text-base font-semibold text-black">LR Detail By Executive</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-sm">
            <thead>
              <tr className="border-b border-black/[0.06] text-left">
                <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">LR Number</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">Route Detail</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">Consignee</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">Consigner</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">Date</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">Freight</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">Status</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">Action</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-sm text-[#9CA3AF]">
                    No LRs submitted yet.
                  </td>
                </tr>
              ) : (
                paged.map((lr) => (
                  <tr key={lr.id} className="border-b border-black/[0.04] last:border-0 hover:bg-black/[0.015]">
                    <td className="px-6 py-3.5">
                      <Link href={`/company/lr/${lr.id}`} className="font-semibold text-[#0C6B24] hover:underline">
                        {lr.lrNumber ?? lr.trackingId}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 text-black">
                      {lr.originCity}→{lr.destinationCity}
                    </td>
                    <td className="px-4 py-3.5 text-black">{lr.consigneeName}</td>
                    <td className="px-4 py-3.5 text-black">{lr.consignorName}</td>
                    <td className="px-4 py-3.5">
                      <p className="text-black">
                        {new Date(lr.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })}
                      </p>
                      <p className="text-[11px] text-[#9CA3AF]">
                        {new Date(lr.createdAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })}
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-black">{formatINR(lr.freightAmount)}</p>
                      <p className="text-[11px] text-[#9CA3AF]">{lr.paymentMode === "Paid" ? "Received" : lr.paymentMode}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold capitalize ${LR_STATUS_PILL[lr.status]}`}>
                        {lr.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <ActionMenu
                        items={[
                          {
                            key: "view",
                            label: "View",
                            icon: <Eye className="h-4 w-4" />,
                            href: `/company/lr/${lr.id}`,
                          },
                        ]}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-black/[0.06] px-4 py-3 md:px-6">
          <p className="text-xs text-[#9CA3AF]">
            Showing {lrs.length === 0 ? 0 : (page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, lrs.length)} of {lrs.length} LR
          </p>
          <div className="flex flex-wrap items-center gap-1">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="rounded-md border border-black/10 px-2 py-1 text-xs text-[#4D4D4D] disabled:opacity-40 hover:bg-black/[0.03]"
            >
              ←
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let p: number;
              if (totalPages <= 5) p = i + 1;
              else if (page <= 3) p = i + 1;
              else if (page >= totalPages - 2) p = totalPages - 4 + i;
              else p = page - 2 + i;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                    p === page ? "bg-[#5E3EA1] text-white" : "border border-black/10 text-[#4D4D4D] hover:bg-black/[0.03]"
                  }`}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="rounded-md border border-black/10 px-2 py-1 text-xs text-[#4D4D4D] disabled:opacity-40 hover:bg-black/[0.03]"
            >
              →
            </button>
          </div>
        </div>
      </div>

      {/* Saved Address */}
      <div className="mt-6 rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-black">Saved Address</h2>
          <div className="flex items-center rounded-lg bg-[#F5F5F7] p-1">
            {(["consignee", "consigner"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setAddressTab(tab);
                  setShowAllAddresses(false);
                }}
                className={`rounded-md px-3.5 py-1.5 text-xs font-semibold capitalize transition ${
                  addressTab === tab ? "bg-[#5E3EA1] text-white" : "text-[#4D4D4D]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {filteredAddresses.length === 0 ? (
          <p className="mt-6 text-center text-sm text-[#9CA3AF]">No saved {addressTab} addresses yet.</p>
        ) : (
          <>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {visibleAddresses.map((a) => (
                <div key={a.id} className="flex items-start gap-2.5 rounded-xl border border-black/10 p-3.5">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#F2EFFA] text-[#5E3EA1]">
                    <IconBuilding className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-black">{a.name}</p>
                    <p className="line-clamp-2 text-[11px] text-[#4D4D4D]">
                      {a.address}
                      {a.pincode ? `, ${a.pincode}` : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {filteredAddresses.length > ADDRESS_PREVIEW_COUNT && (
              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  onClick={() => setShowAllAddresses((v) => !v)}
                  className="rounded-lg bg-[#5E3EA1] px-5 py-2 text-xs font-semibold text-white transition hover:opacity-90"
                >
                  {showAllAddresses ? "View Less" : "View More"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-[#F5F5F7] px-4 py-4 text-center">
      <p className="text-xl font-bold text-black">{value}</p>
      <p className="mt-0.5 text-xs font-medium text-[#4D4D4D]">{label}</p>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-[#0C6B24]/10 text-[#0C6B24]",
    invited: "bg-[#F7CE25]/20 text-[#967E1C]",
    inactive: "bg-[#961C1C]/20 text-[#961C1C]",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold capitalize ${map[status] ?? map.inactive}`}>
      {status}
    </span>
  );
}

function shortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
