"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { StatusBadge, formatINR } from "@/components/rono/status-badge";
import type { LRRequest, LRStatus } from "@/lib/types";
import { Search, Download, CheckCircle, XCircle, Package, MapPin } from "lucide-react";
import { toast } from "sonner";

type EnrichedLR = LRRequest & {
  driver?: { name: string };
  branch?: { name: string };
};

const FILTERS: ReadonlyArray<{ key: "all" | LRStatus; label: string }> = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "delivered", label: "Delivered" },
];

export default function CompanyLRPage() {
  const [allLrs, setAllLrs] = useState<EnrichedLR[]>([]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedLr, setSelectedLr] = useState<EnrichedLR | null>(null);
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const detailRef = useRef<HTMLDivElement>(null);

  function selectLr(lr: EnrichedLR) {
    setSelectedLr(lr);
    setRejectReason("");
    setTimeout(() => {
      detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  useEffect(() => {
    let cancelled = false;
    const id = setTimeout(async () => {
      setLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      const res = await fetch(`/api/lr?${params}`);
      const data = await res.json();
      if (!cancelled && data.success) {
        setAllLrs(data.data);
        if (data.data.length > 0 && !selectedLr) {
          setSelectedLr(data.data[0]);
        }
      }
      if (!cancelled) setLoading(false);
    }, 150);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [search]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: allLrs.length };
    for (const lr of allLrs) {
      map[lr.status] = (map[lr.status] ?? 0) + 1;
    }
    return map;
  }, [allLrs]);

  const lrs = useMemo(() => {
    if (filter === "all") return allLrs;
    return allLrs.filter((lr) => lr.status === filter);
  }, [allLrs, filter]);

  async function handleApprove(lrId: string) {
    setActionBusy(lrId);
    try {
      const res = await fetch(`/api/lr/${lrId}/approve`, { method: "PUT" });
      const data = await res.json().catch(() => ({}));
      if (data.success) {
        toast.success("LR approved");
        setAllLrs((prev) => prev.map((lr) => lr.id === lrId ? { ...lr, status: "approved" as LRStatus } : lr));
        if (selectedLr?.id === lrId) setSelectedLr({ ...selectedLr, status: "approved" as LRStatus });
      } else {
        toast.error(data.error ?? "Failed to approve");
      }
    } finally {
      setActionBusy(null);
    }
  }

  async function handleReject(lrId: string) {
    if (!rejectReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    setActionBusy(lrId);
    try {
      const res = await fetch(`/api/lr/${lrId}/reject`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.success) {
        toast.success("LR rejected");
        setAllLrs((prev) => prev.map((lr) => lr.id === lrId ? { ...lr, status: "rejected" as LRStatus } : lr));
        if (selectedLr?.id === lrId) setSelectedLr({ ...selectedLr, status: "rejected" as LRStatus });
        setRejectReason("");
      } else {
        toast.error(data.error ?? "Failed to reject");
      }
    } finally {
      setActionBusy(null);
    }
  }

  const driverInitials = (name: string) =>
    name.split(/\s+/).map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="p-6 md:p-8">
      {/* Top 5 stat boxes */}
      <div className="grid grid-cols-5 gap-3">
        <StatBox label="All LRs" value={counts.all ?? 0} color="slate" active={filter === "all"} onClick={() => setFilter("all")} />
        <StatBox label="Pending" value={counts.pending ?? 0} color="orange" active={filter === "pending"} onClick={() => setFilter("pending")} />
        <StatBox label="Approved" value={counts.approved ?? 0} color="emerald" active={filter === "approved"} onClick={() => setFilter("approved")} />
        <StatBox label="Rejected" value={counts.rejected ?? 0} color="red" active={filter === "rejected"} onClick={() => setFilter("rejected")} />
        <StatBox label="Delivered" value={counts.delivered ?? 0} color="blue" active={filter === "delivered"} onClick={() => setFilter("delivered")} />
      </div>

      {/* All LR Requests section */}
      <div className="mt-6 rounded-2xl border border-slate-100 bg-white shadow-sm">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">All LR Requests</h2>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-violet-50 px-3 py-1 text-[11px] font-semibold text-violet-700">
              {counts.all} total
            </span>
            <span className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-medium text-slate-600">
              Date Range ▼
            </span>
            <span className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-medium text-slate-600">
              Branch: All ▼
            </span>
          </div>
        </div>

        {/* Filters + Search */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-slate-500 mr-1">Status:</span>
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  filter === f.key
                    ? "bg-violet-600 text-white shadow-sm"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {f.label}
                {f.key === "pending" && (counts.pending ?? 0) > 0 && (
                  <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    filter === "pending" ? "bg-white/30 text-white" : "bg-orange-100 text-orange-700"
                  }`}>
                    {counts.pending}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="relative w-56">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by LR No., consignee..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs outline-none focus:border-violet-300 focus:bg-white focus:ring-1 focus:ring-violet-100"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left">
                <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">LR Number</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Route</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Consignor → Consignee</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Driver</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Date</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Freight</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Status</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && lrs.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-12 text-center text-sm text-slate-400">Loading…</td></tr>
              ) : lrs.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-12 text-center text-sm text-slate-400">No LRs match your filters.</td></tr>
              ) : (
                lrs.slice(0, 5).map((lr) => (
                  <tr
                    key={lr.id}
                    onClick={() => selectLr(lr)}
                    className={`cursor-pointer border-b border-slate-50 last:border-0 transition ${
                      selectedLr?.id === lr.id ? "bg-violet-50/50" : "hover:bg-slate-50/50"
                    }`}
                  >
                    <td className="px-6 py-3.5">
                      <p className="font-semibold text-violet-700">{lr.trackingId}</p>
                      <p className="text-[11px] text-slate-400">{lr.vehicleNumber}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm font-medium text-slate-800">{lr.originCity}</p>
                      <p className="text-[11px] text-violet-600">→ {lr.destinationCity}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm text-slate-800">{lr.consignorName}</p>
                      <p className="text-[11px] text-slate-400">→ {lr.consigneeName}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-100 text-[10px] font-bold text-violet-700">
                          {driverInitials(lr.driver?.name ?? "?")}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-slate-800">{lr.driver?.name ?? "—"}</p>
                          <p className="text-[11px] text-slate-400">{lr.branch?.name ?? ""}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm text-slate-700">
                        {new Date(lr.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {new Date(lr.createdAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })}
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-slate-800">{formatINR(lr.freightAmount)}</p>
                      <p className="text-[11px] text-slate-400">{lr.paymentMode}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={lr.status} />
                    </td>
                    <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      {lr.status === "pending" ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleApprove(lr.id)}
                            disabled={actionBusy === lr.id}
                            className="rounded-md bg-emerald-600 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => selectLr(lr)}
                            disabled={actionBusy === lr.id}
                            className="rounded-md bg-red-500 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-red-600 disabled:opacity-60"
                          >
                            Reject
                          </button>
                        </div>
                      ) : lr.status === "approved" || lr.status === "delivered" ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <Link href={`/company/lr/${lr.id}`} className="rounded-md border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50">View</Link>
                          <a href={`/api/lr/${lr.id}/pdf`} className="rounded-md border border-violet-200 bg-violet-50 px-3 py-1.5 text-[11px] font-semibold text-violet-700 hover:bg-violet-100">PDF</a>
                        </div>
                      ) : (
                        <Link href={`/company/lr/${lr.id}`} className="rounded-md border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50">View</Link>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3">
          <p className="text-xs text-slate-400">Showing 1–{Math.min(5, lrs.length)} of {lrs.length} LRs</p>
          <div className="flex items-center gap-1">
            <span className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-400">←</span>
            <span className="rounded-md bg-violet-600 px-2.5 py-1 text-xs font-semibold text-white">1</span>
            <span className="rounded-md border border-slate-200 px-2.5 py-1 text-xs text-slate-600">2</span>
            <span className="rounded-md border border-slate-200 px-2.5 py-1 text-xs text-slate-600">3</span>
            <span className="px-1 text-xs text-slate-400">...</span>
            <span className="rounded-md border border-slate-200 px-2.5 py-1 text-xs text-slate-600">{Math.ceil(lrs.length / 5) || 1}</span>
            <span className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-400">→</span>
          </div>
        </div>
      </div>

      {/* LR Detail Panel */}
      {selectedLr && (
        <div ref={detailRef} className="mt-6">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            LR Detail — {selectedLr.trackingId} ({selectedLr.status === "pending" ? "Pending Approval" : selectedLr.status.toUpperCase()})
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {/* Consignor (Sender) */}
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50">
                  <Package className="h-4 w-4 text-violet-600" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Consignor (Sender)</h3>
              </div>
              <div className="mt-4 space-y-2">
                <div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Name</p><p className="text-sm font-medium text-slate-800">{selectedLr.consignorName}</p></div>
                <div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Address</p><p className="text-sm text-slate-600">{selectedLr.consignorAddress}</p></div>
                <div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Origin City</p><p className="text-sm font-medium text-violet-600">{selectedLr.originCity}</p></div>
              </div>
            </div>

            {/* Consignee (Receiver) */}
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50">
                  <MapPin className="h-4 w-4 text-emerald-600" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Consignee (Receiver)</h3>
              </div>
              <div className="mt-4 space-y-2">
                <div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Name</p><p className="text-sm font-medium text-slate-800">{selectedLr.consigneeName}</p></div>
                <div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Address</p><p className="text-sm text-slate-600">{selectedLr.consigneeAddress}</p></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Phone</p><p className="text-sm text-slate-600">+91 {selectedLr.consigneePhone}</p></div>
                  <div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Destination</p><p className="text-sm font-medium text-violet-600">{selectedLr.destinationCity}</p></div>
                </div>
              </div>
            </div>

            {/* Shipment Details */}
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50">
                  <Package className="h-4 w-4 text-amber-600" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Shipment Details</h3>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3">
                <div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Goods Description</p><p className="text-sm text-slate-700">{selectedLr.goodsDescription}</p></div>
                <div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">No. of Packages</p><p className="text-sm font-medium text-slate-800">{selectedLr.noOfPackages} packages</p></div>
                <div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Weight</p><p className="text-sm font-medium text-slate-800">{selectedLr.weightKg} KG</p></div>
                <div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Declared Value</p><p className="text-sm font-medium text-slate-800">{formatINR(selectedLr.declaredValue)}</p></div>
                <div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Vehicle Number</p><p className="text-sm font-bold text-violet-700">{selectedLr.vehicleNumber}</p></div>
                <div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Dispatch Date</p><p className="text-sm text-slate-700">{new Date(selectedLr.dispatchDate).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}</p></div>
              </div>
            </div>

            {/* Freight & Action */}
            <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50">
                  <span className="text-sm font-bold text-emerald-600">₹</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">Freight & Action</h3>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Freight Amount</p><p className="text-2xl font-bold text-emerald-600">{formatINR(selectedLr.freightAmount)}</p></div>
                <div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Payment Mode</p><p className="text-sm font-medium text-violet-600">{selectedLr.paymentMode}</p></div>
              </div>
              {selectedLr.specialInstructions && (
                <div className="mt-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Special Instructions</p>
                  <p className="mt-1 text-xs text-slate-600">{selectedLr.specialInstructions}</p>
                </div>
              )}
              <div className="mt-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Submitted By</p>
                <p className="mt-1 text-sm text-slate-700">{selectedLr.driver?.name} · {selectedLr.branch?.name}</p>
              </div>

              {selectedLr.status === "pending" && (
                <div className="mt-5 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleApprove(selectedLr.id)}
                      disabled={actionBusy === selectedLr.id}
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Approve LR
                    </button>
                    <button
                      onClick={() => handleReject(selectedLr.id)}
                      disabled={actionBusy === selectedLr.id}
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-red-500 py-3 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-60"
                    >
                      <XCircle className="h-4 w-4" />
                      Reject LR
                    </button>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400">Rejection reason (required if rejecting):</p>
                    <input
                      type="text"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="e.g. Vehicle number does not match records..."
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-violet-300 focus:ring-1 focus:ring-violet-100"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatBox({
  label,
  value,
  color,
  active,
  onClick,
}: {
  label: string;
  value: number;
  color: "slate" | "orange" | "emerald" | "red" | "blue";
  active: boolean;
  onClick: () => void;
}) {
  const styles = {
    slate: { border: "border-slate-200", text: "text-slate-900", sub: "text-slate-500" },
    orange: { border: "border-orange-200", text: "text-orange-600", sub: "text-orange-500" },
    emerald: { border: "border-emerald-200", text: "text-emerald-600", sub: "text-emerald-500" },
    red: { border: "border-red-200", text: "text-red-600", sub: "text-red-500" },
    blue: { border: "border-blue-200", text: "text-blue-600", sub: "text-blue-500" },
  };
  const s = styles[color];

  return (
    <button
      onClick={onClick}
      className={`rounded-2xl border bg-white p-4 text-center shadow-sm transition hover:shadow-md ${s.border} ${active ? "ring-2 ring-violet-300" : ""}`}
    >
      <p className={`text-3xl font-bold ${s.text}`}>{value}</p>
      <p className={`mt-1 text-xs font-medium ${s.sub}`}>{label}</p>
    </button>
  );
}
