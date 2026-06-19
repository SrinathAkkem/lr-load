"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { StatusBadge, formatINR } from "@/components/rono/status-badge";
import { Input } from "@/components/ui/input";
import type { LRRequest, LRStatus } from "@/lib/types";
import { Search, Download, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

type EnrichedLR = LRRequest & {
  driver?: { name: string };
  branch?: { name: string };
  consignorName: string;
  consignorAddress: string;
  consigneeName: string;
  consigneeAddress: string;
  consigneePhone: string;
  goodsDescription: string;
  weightKg: number;
  vehicleNumber: string;
  noOfPackages: number;
  declaredValue: number;
  specialInstructions?: string;
};

const FILTERS: ReadonlyArray<{ key: "all" | LRStatus; label: string }> = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "delivered", label: "Delivered" },
];

export default function CompanyLRPage() {
  const [lrs, setLrs] = useState<EnrichedLR[]>([]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedLr, setSelectedLr] = useState<EnrichedLR | null>(null);
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectFor, setShowRejectFor] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const id = setTimeout(async () => {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== "all") params.set("status", filter);
      if (search.trim()) params.set("search", search.trim());
      const res = await fetch(`/api/lr?${params}`);
      const data = await res.json();
      if (!cancelled && data.success) setLrs(data.data);
      if (!cancelled) setLoading(false);
    }, 150);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [filter, search]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: lrs.length };
    for (const lr of lrs) {
      map[lr.status] = (map[lr.status] ?? 0) + 1;
    }
    return map;
  }, [lrs]);

  async function handleApprove(lrId: string) {
    setActionBusy(lrId);
    try {
      const res = await fetch(`/api/lr/${lrId}/approve`, { method: "PUT" });
      const data = await res.json().catch(() => ({}));
      if (data.success) {
        toast.success("LR approved");
        setLrs((prev) =>
          prev.map((lr) =>
            lr.id === lrId ? { ...lr, status: "approved" as LRStatus } : lr,
          ),
        );
        if (selectedLr?.id === lrId) {
          setSelectedLr({ ...selectedLr, status: "approved" as LRStatus });
        }
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
        setLrs((prev) =>
          prev.map((lr) =>
            lr.id === lrId ? { ...lr, status: "rejected" as LRStatus } : lr,
          ),
        );
        if (selectedLr?.id === lrId) {
          setSelectedLr({ ...selectedLr, status: "rejected" as LRStatus });
        }
        setShowRejectFor(null);
        setRejectReason("");
      } else {
        toast.error(data.error ?? "Failed to reject");
      }
    } finally {
      setActionBusy(null);
    }
  }

  return (
    <div className="p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900">All LR Requests</h1>
          <p className="text-sm text-slate-500">
            {lrs.length} total
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 font-semibold text-amber-700 ring-1 ring-amber-200">
            {counts.pending ?? 0} Pending
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700 ring-1 ring-emerald-200">
            {counts.approved ?? 0} Approved
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 font-semibold text-red-700 ring-1 ring-red-200">
            {counts.rejected ?? 0} Rejected
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1 font-semibold text-violet-700 ring-1 ring-violet-200">
            {counts.delivered ?? 0} Delivered
          </span>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition ${
              filter === f.key
                ? "bg-violet-600 text-white shadow"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-violet-300"
            }`}
          >
            <span>{f.label}</span>
            {filter !== f.key && counts[f.key] != null && (
              <span className="rounded-full bg-slate-100 px-1.5 text-xs font-semibold text-slate-600">
                {counts[f.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="relative mt-4 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Search by LR No., consignee..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-sm">
            <thead className="border-b bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="p-4">LR Number</th>
                <th className="p-4">Route</th>
                <th className="p-4">Consignor → Consignee</th>
                <th className="p-4">Driver</th>
                <th className="p-4">Date</th>
                <th className="p-4">Freight</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && lrs.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="p-10 text-center text-sm text-slate-400"
                  >
                    Loading…
                  </td>
                </tr>
              ) : lrs.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="p-10 text-center text-sm text-slate-400"
                  >
                    No LRs match your filters.
                  </td>
                </tr>
              ) : (
                lrs.map((lr) => (
                  <tr
                    key={lr.id}
                    onClick={() => setSelectedLr(lr)}
                    className={`cursor-pointer border-b last:border-b-0 transition ${
                      selectedLr?.id === lr.id
                        ? "bg-violet-50"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <td className="p-4">
                      <span className="font-semibold text-violet-700">
                        {lr.trackingId}
                      </span>
                      <p className="text-xs text-slate-400">{lr.vehicleNumber}</p>
                    </td>
                    <td className="p-4">
                      {lr.originCity} → {lr.destinationCity}
                    </td>
                    <td className="p-4">
                      <p className="font-medium">{lr.consignorName}</p>
                      <p className="text-xs text-slate-500">→ {lr.consigneeName}</p>
                    </td>
                    <td className="p-4">
                      <p>{lr.driver?.name ?? "—"}</p>
                      <p className="text-xs text-slate-400">{lr.branch?.name ?? ""}</p>
                    </td>
                    <td className="p-4 text-xs text-slate-500">
                      {new Date(lr.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="p-4">
                      <p className="font-medium">{formatINR(lr.freightAmount)}</p>
                      <p className="text-xs text-slate-400 capitalize">
                        {lr.paymentMode === "To Pay" ? "To Pay" : lr.paymentMode === "Paid" ? "Paid" : "TBB"}
                      </p>
                    </td>
                    <td className="p-4">
                      <StatusBadge status={lr.status} />
                    </td>
                    <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                      {lr.status === "pending" ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleApprove(lr.id)}
                            disabled={actionBusy === lr.id}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              setShowRejectFor(lr.id);
                              setRejectReason("");
                            }}
                            disabled={actionBusy === lr.id}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Reject
                          </button>
                        </div>
                      ) : lr.status === "approved" || lr.status === "delivered" ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/company/lr/${lr.id}`}
                            className="text-xs font-semibold text-violet-600 hover:underline"
                          >
                            View
                          </Link>
                          <a
                            href={`/api/lr/${lr.id}/pdf`}
                            className="inline-flex items-center gap-1 rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 transition hover:bg-violet-100"
                          >
                            <Download className="h-3 w-3" />
                            PDF
                          </a>
                        </div>
                      ) : (
                        <Link
                          href={`/company/lr/${lr.id}`}
                          className="text-xs font-semibold text-violet-600 hover:underline"
                        >
                          View
                        </Link>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showRejectFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Reject LR</h3>
            <p className="mt-1 text-sm text-slate-500">
              Provide a reason for rejecting this LR (visible to the driver).
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="e.g. Vehicle number does not match records..."
              className="mt-4 w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100"
            />
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => handleReject(showRejectFor)}
                disabled={actionBusy === showRejectFor}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
              >
                {actionBusy === showRejectFor ? "Rejecting…" : "Reject LR"}
              </button>
              <button
                onClick={() => {
                  setShowRejectFor(null);
                  setRejectReason("");
                }}
                className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedLr && (
        <div className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                LR Detail — {selectedLr.trackingId}
                <span className="ml-2">
                  <StatusBadge status={selectedLr.status} />
                </span>
              </h2>
            </div>
            <button
              onClick={() => setSelectedLr(null)}
              className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-50"
            >
              Close
            </button>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-violet-600">
                Consignor (Sender)
              </h3>
              <p className="mt-2 font-semibold text-slate-900">{selectedLr.consignorName}</p>
              <p className="mt-1 text-sm text-slate-500">{selectedLr.consignorAddress}</p>
              <p className="mt-1 text-sm text-slate-500">Origin: {selectedLr.originCity}</p>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-violet-600">
                Consignee (Receiver)
              </h3>
              <p className="mt-2 font-semibold text-slate-900">{selectedLr.consigneeName}</p>
              <p className="mt-1 text-sm text-slate-500">{selectedLr.consigneeAddress}</p>
              <p className="mt-1 text-sm text-slate-500">+91 {selectedLr.consigneePhone}</p>
              <p className="mt-1 text-sm text-slate-500">Dest: {selectedLr.destinationCity}</p>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-violet-600">
                Shipment Details
              </h3>
              <p className="mt-2 text-sm"><span className="font-medium">Goods:</span> {selectedLr.goodsDescription}</p>
              <p className="mt-1 text-sm"><span className="font-medium">Weight:</span> {selectedLr.weightKg} KG</p>
              <p className="mt-1 text-sm"><span className="font-medium">Vehicle:</span> {selectedLr.vehicleNumber}</p>
              <p className="mt-1 text-sm"><span className="font-medium">Packages:</span> {selectedLr.noOfPackages}</p>
              <p className="mt-1 text-sm"><span className="font-medium">Value:</span> {formatINR(selectedLr.declaredValue)}</p>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-violet-600">
                Freight & Action
              </h3>
              <p className="mt-2 text-2xl font-bold text-slate-900">{formatINR(selectedLr.freightAmount)}</p>
              <p className="mt-1 text-sm text-slate-500 capitalize">{selectedLr.paymentMode}</p>
              {selectedLr.specialInstructions && (
                <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
                  {selectedLr.specialInstructions}
                </div>
              )}
              <p className="mt-3 text-xs text-slate-400">
                Submitted by: {selectedLr.driver?.name} · {selectedLr.branch?.name}
              </p>
              {selectedLr.status === "pending" && (
                <div className="mt-4 space-y-2">
                  <button
                    onClick={() => handleApprove(selectedLr.id)}
                    disabled={actionBusy === selectedLr.id}
                    className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                  >
                    Approve LR
                  </button>
                  <button
                    onClick={() => {
                      setShowRejectFor(selectedLr.id);
                      setRejectReason("");
                    }}
                    disabled={actionBusy === selectedLr.id}
                    className="w-full rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                  >
                    Reject LR
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
