"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatINR, LR_STATUS_PILL } from "@/components/rono/status-badge";
import type { LRRequest, LRStatus } from "@/lib/types";
import {
  Search,
  X,
  ArrowUpDown,
  Eye,
  Check,
  Download,
} from "lucide-react";
import { DateRangePicker } from "@/components/rono/date-range-picker";
import { FilterDropdown } from "@/components/rono/filter-dropdown";
import { IconMoreDots } from "@/components/rono/dashboard-icons";

type EnrichedLR = LRRequest & {
  executive?: { name: string };
  branch?: { name: string };
};

const FILTERS: ReadonlyArray<{ key: "all" | LRStatus; label: string }> = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "delivered", label: "Delivered" },
];

const FILTER_PILL_STYLES: Record<string, { active: string; inactive: string }> = {
  all: { active: "bg-[#5E3EA1] text-white", inactive: "bg-[#F5F5F7] text-[#4D4D4D]" },
  pending: { active: "bg-[#967E1C] text-white", inactive: "bg-[#F7CE25]/20 text-[#967E1C]" },
  approved: { active: "bg-[#0C6B24] text-white", inactive: "bg-[#0C6B24]/10 text-[#0C6B24]" },
  rejected: { active: "bg-[#961C1C] text-white", inactive: "bg-[#961C1C]/20 text-[#961C1C]" },
  delivered: { active: "bg-[#3C60B6] text-white", inactive: "bg-[#3C60B6]/10 text-[#3C60B6]" },
};

export function DashboardLrTable({
  perPage = 5,
  heading = "All LR Requests",
}: {
  perPage?: number;
  heading?: string;
} = {}) {
  const router = useRouter();
  const [allLrs, setAllLrs] = useState<EnrichedLR[]>([]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [branchFilter, setBranchFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortNewestFirst, setSortNewestFirst] = useState(true);
  const [page, setPage] = useState(1);
  const [openRowId, setOpenRowId] = useState<string | null>(null);

  async function handleApprove(id: string) {
    setOpenRowId(null);
    const res = await fetch(`/api/lr/${id}/approve`, { method: "PUT" });
    const data = await res.json().catch(() => ({}));
    if (data.success) {
      toast.success("LR approved");
      router.refresh();
      setAllLrs((prev) => prev.map((lr) => (lr.id === id ? { ...lr, status: "approved" } : lr)));
    } else {
      toast.error(data.error ?? "Failed to approve");
    }
  }

  async function handleReject(id: string) {
    setOpenRowId(null);
    const reason = window.prompt("Reason for rejection (visible to executive):");
    if (!reason || !reason.trim()) return;
    const res = await fetch(`/api/lr/${id}/reject`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: reason.trim() }),
    });
    const data = await res.json().catch(() => ({}));
    if (data.success) {
      toast.success("LR rejected");
      router.refresh();
      setAllLrs((prev) => prev.map((lr) => (lr.id === id ? { ...lr, status: "rejected" } : lr)));
    } else {
      toast.error(data.error ?? "Failed to reject");
    }
  }

  async function handleDownloadPdf(id: string, trackingId: string) {
    setOpenRowId(null);
    try {
      const res = await fetch(`/api/lr/${id}/pdf`);
      if (!res.ok) throw new Error("Failed to generate PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${trackingId}.pdf`.replace(/\//g, "-");
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("PDF Downloaded");
    } catch {
      toast.error("Failed to download PDF");
    }
  }

  useEffect(() => {
    fetch("/api/branches")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setBranches(d.data ?? []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    const id = setTimeout(async () => {
      setLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (branchFilter !== "all") params.set("branchId", branchFilter);
      if (dateFrom) params.set("from", dateFrom);
      if (dateTo) params.set("to", dateTo);
      const res = await fetch(`/api/lr?${params}`);
      const data = await res.json();
      if (!cancelled && data.success) {
        setAllLrs(data.data);
      }
      if (!cancelled) setLoading(false);
    }, 150);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [search, branchFilter, dateFrom, dateTo]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: allLrs.length };
    for (const lr of allLrs) {
      map[lr.status] = (map[lr.status] ?? 0) + 1;
    }
    return map;
  }, [allLrs]);

  const lrs = useMemo(() => {
    const base = filter === "all" ? allLrs : allLrs.filter((lr) => lr.status === filter);
    const sorted = [...base].sort((a, b) => {
      const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortNewestFirst ? -diff : diff;
    });
    return sorted;
  }, [allLrs, filter, sortNewestFirst]);

  useEffect(() => {
    setPage(1);
  }, [filter, search, branchFilter, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(lrs.length / perPage));
  const pagedLrs = useMemo(() => {
    const start = (page - 1) * perPage;
    return lrs.slice(start, start + perPage);
  }, [lrs, page, perPage]);

  const executiveInitials = (name: string) =>
    name.split(/\s+/).map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="rounded-2xl border border-black/[0.06] bg-white shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.06] p-4 md:p-6">
        <h2 className="text-base font-bold text-black">{heading}</h2>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-black/40" />
            <input
              type="text"
              placeholder="Search by LR No, Consignee"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-56 rounded-lg border border-black/10 bg-white py-2 pl-9 pr-3 text-xs text-black outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>

          <DateRangePicker
            from={dateFrom}
            to={dateTo}
            onChange={(f, t) => {
              setDateFrom(f);
              setDateTo(t);
            }}
          />

          <FilterDropdown
            label="Branch"
            value={branchFilter}
            onChange={setBranchFilter}
            options={[
              { value: "all", label: "Branch" },
              ...branches.map((b) => ({ value: b.id, label: b.name })),
            ]}
          />

          <button
            type="button"
            onClick={() => setSortNewestFirst((v) => !v)}
            className="flex h-10 items-center gap-1.5 rounded-full border border-[#5E3EA1] bg-white px-4 text-xs font-semibold text-[#5E3EA1] transition hover:bg-[#5E3EA1]/5"
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            Sort
          </button>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap items-center gap-2 p-4 md:p-6 md:pt-4">
        {FILTERS.map((f) => {
          const active = filter === f.key;
          const styles = FILTER_PILL_STYLES[f.key];
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                active ? styles.active : styles.inactive
              }`}
            >
              {f.label}
              <span
                className={`flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                  active ? "bg-white/25 text-white" : "bg-white/70 text-inherit"
                }`}
              >
                {counts[f.key] ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] text-sm">
          <thead>
            <tr className="border-b border-black/[0.06] bg-[#FAFAFB] text-left">
              <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
                LR Number
              </th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
                Route Detail
              </th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
                Consignee
              </th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
                Consigner
              </th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
                Executive
              </th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
                Date
              </th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
                Freight
              </th>
              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
                Status
              </th>
              <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {loading && lrs.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center text-sm text-slate-400">
                  Loading…
                </td>
              </tr>
            ) : lrs.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center text-sm text-slate-400">
                  No LRs match your filters.
                </td>
              </tr>
            ) : (
              pagedLrs.map((lr) => (
                <tr key={lr.id} className="border-b border-black/[0.04] last:border-0 hover:bg-black/[0.015]">
                  <td className="px-6 py-3.5">
                    <Link href={`/company/lr/${lr.id}`} className="font-semibold text-[#5E3EA1] hover:underline">
                      {lr.trackingId}
                    </Link>
                  </td>
                  <td className="px-4 py-3.5 text-black">
                    {lr.originCity}→{lr.destinationCity}
                  </td>
                  <td className="px-4 py-3.5 text-black">{lr.consigneeName}</td>
                  <td className="px-4 py-3.5 text-black">{lr.consignorName}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F2EFFA] text-[10px] font-bold text-[#5E3EA1]">
                        {executiveInitials(lr.executive?.name ?? "?")}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-[#5E3EA1]">{lr.executive?.name ?? "—"}</p>
                        <p className="text-[11px] text-[#9CA3AF]">{lr.branch?.name ?? ""}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-sm text-black">
                      {new Date(lr.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-[11px] text-[#9CA3AF]">
                      {new Date(lr.createdAt).toLocaleTimeString("en-IN", {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </p>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="font-semibold text-black">{formatINR(lr.freightAmount)}</p>
                    <p className="text-[11px] text-[#9CA3AF]">
                      {lr.paymentMode === "Paid" ? "Received" : lr.paymentMode}
                    </p>
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold capitalize ${LR_STATUS_PILL[lr.status]}`}
                    >
                      {lr.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <RowActionMenu
                      lr={lr}
                      open={openRowId === lr.id}
                      onToggle={() => setOpenRowId((v) => (v === lr.id ? null : lr.id))}
                      onClose={() => setOpenRowId(null)}
                      onApprove={() => handleApprove(lr.id)}
                      onReject={() => handleReject(lr.id)}
                      onDownloadPdf={() => handleDownloadPdf(lr.id, lr.trackingId)}
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
          Showing {lrs.length === 0 ? 0 : (page - 1) * perPage + 1}–{Math.min(page * perPage, lrs.length)} of{" "}
          {lrs.length} LRs
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
  );
}

function RowActionMenu({
  lr,
  open,
  onToggle,
  onClose,
  onApprove,
  onReject,
  onDownloadPdf,
}: {
  lr: EnrichedLR;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  onDownloadPdf: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  return (
    <div className="relative inline-block text-left" ref={ref}>
      <button
        type="button"
        onClick={onToggle}
        className="inline-flex h-8 w-8 items-center justify-center text-[#5E3EA1] transition hover:opacity-70"
      >
        <IconMoreDots className="h-8 w-8" />
      </button>

      {open && (
        <div className="absolute right-0 top-9 z-40 w-44 overflow-hidden rounded-xl border border-black/[0.06] bg-white py-1.5 shadow-lg">
          <Link
            href={`/company/lr/${lr.id}`}
            className="flex items-center gap-2.5 px-3.5 py-2 text-sm font-medium text-black transition hover:bg-black/[0.04]"
          >
            <Eye className="h-4 w-4" />
            View
          </Link>
          {lr.status === "pending" ? (
            <>
              <button
                type="button"
                onClick={onApprove}
                className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm font-medium text-[#0C6B24] transition hover:bg-black/[0.04]"
              >
                <Check className="h-4 w-4" />
                Approve
              </button>
              <button
                type="button"
                onClick={onReject}
                className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm font-medium text-[#C00F0C] transition hover:bg-black/[0.04]"
              >
                <X className="h-4 w-4" />
                Reject
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onDownloadPdf}
              className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm font-medium text-black transition hover:bg-black/[0.04]"
            >
              <Download className="h-4 w-4" />
              Download LR
            </button>
          )}
        </div>
      )}
    </div>
  );
}
