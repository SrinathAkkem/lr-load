"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

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
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-700">Decision</h2>
      {showReject ? (
        <div className="mt-3 space-y-3">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Reason for rejection (visible to executive)"
            className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100"
          />
          <div className="flex gap-2">
            <Button
              variant="destructive"
              className="flex-1"
              disabled={busy === "reject"}
              onClick={handleReject}
            >
              {busy === "reject" ? "Rejecting…" : "Confirm Reject"}
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              disabled={busy === "reject"}
              onClick={() => {
                setShowReject(false);
                setReason("");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-3 grid gap-2">
          <Button
            className="bg-emerald-600 hover:bg-emerald-700"
            disabled={busy !== null}
            onClick={handleApprove}
          >
            {busy === "approve" ? "Approving…" : "Approve LR"}
          </Button>
          <Button
            variant="destructive"
            disabled={busy !== null}
            onClick={() => setShowReject(true)}
          >
            Reject LR
          </Button>
        </div>
      )}
    </div>
  );
}
