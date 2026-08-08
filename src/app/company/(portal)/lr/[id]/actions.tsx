"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, X } from "lucide-react";

export function ApproveRejectActions({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"approve" | "reject" | null>(null);
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState("");

  async function handleApprove() {
    setBusy("approve");
    try {
      const res = await fetch(`/api/lr/${id}/approve`, { method: "PUT" });
      const data = await res.json().catch(() => ({}));
      if (data.success) {
        toast.success("LR approved — PDF generated");
        router.refresh();
      } else {
        toast.error(data.error ?? "Failed to approve");
      }
    } finally {
      setBusy(null);
    }
  }

  async function handleReject() {
    if (!reason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    setBusy("reject");
    try {
      const res = await fetch(`/api/lr/${id}/reject`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.success) {
        toast.success("LR rejected — executive notified");
        setShowReject(false);
        setReason("");
        router.refresh();
      } else {
        toast.error(data.error ?? "Failed to reject");
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm">
      <h3 className="text-sm font-bold text-black">Decision</h3>
      {showReject ? (
        <div className="mt-3 space-y-3">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Reason for rejection (visible to executive)"
            className="w-full rounded-xl border border-black/10 p-3 text-sm text-black outline-none focus:border-[#5E3EA1]/40 focus:ring-1 focus:ring-[#5E3EA1]/30"
          />
          <div className="flex gap-2.5">
            <button
              type="button"
              disabled={busy === "reject"}
              onClick={handleReject}
              className="flex-1 rounded-lg bg-[#961C1C] py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {busy === "reject" ? "Rejecting…" : "Confirm Reject"}
            </button>
            <button
              type="button"
              disabled={busy === "reject"}
              onClick={() => {
                setShowReject(false);
                setReason("");
              }}
              className="flex-1 rounded-lg border border-black/15 py-2.5 text-sm font-semibold text-black transition hover:bg-black/[0.03] disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 grid gap-2.5">
          <button
            type="button"
            disabled={busy !== null}
            onClick={handleApprove}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-[#0C6B24] py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            <Check className="h-4 w-4" />
            {busy === "approve" ? "Approving…" : "Approve LR"}
          </button>
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => setShowReject(true)}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-[#961C1C] py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            <X className="h-4 w-4" />
            Reject LR
          </button>
        </div>
      )}
    </div>
  );
}
