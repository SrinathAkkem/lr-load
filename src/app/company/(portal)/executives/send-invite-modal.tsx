"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Branch {
  id: string;
  name: string;
  city: string;
}

export function SendInviteModal({
  open,
  onClose,
  branches,
  onSent,
}: {
  open: boolean;
  onClose: () => void;
  branches: Branch[];
  onSent: () => void;
}) {
  const [branchId, setBranchId] = useState("");
  const [mobile, setMobile] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setBranchId(branches[0]?.id ?? "");
      setMobile("");
    }
  }, [open, branches]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function submit() {
    if (!/^\d{10}$/.test(mobile)) {
      toast.error("Mobile must be 10 digits");
      return;
    }
    if (!branchId) {
      toast.error("Please select a branch");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/executives/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile, branchId }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("OTP has been sent to mobile number");
        onSent();
        onClose();
      } else {
        toast.error(data.error ?? "Failed to invite");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-bold text-black">Send Invite</h3>

        <div className="mt-4 space-y-3.5">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-black">
              Branch Name<span className="text-[#DE0000]">*</span>
            </label>
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="w-full appearance-none rounded-lg border border-black/10 bg-white px-3.5 py-2.5 text-sm text-black outline-none focus:border-[#5E3EA1]/40 focus:ring-1 focus:ring-[#5E3EA1]/30"
            >
              <option value="" disabled>
                Select branch
              </option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-black">
              Phone No.<span className="text-[#DE0000]">*</span>
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-black">+91</span>
              <input
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="12345 67890"
                className="w-full rounded-lg border border-black/10 bg-white py-2.5 pl-11 pr-3.5 text-sm text-black outline-none focus:border-[#5E3EA1]/40 focus:ring-1 focus:ring-[#5E3EA1]/30"
              />
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-black/15 py-2.5 text-sm font-semibold text-black transition hover:bg-black/[0.03]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={busy}
            className="flex-1 rounded-lg bg-black py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {busy ? "Sending…" : "Send Invite"}
          </button>
        </div>
      </div>
    </div>
  );
}
