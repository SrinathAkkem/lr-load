"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function ChangePasswordCard() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (next.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (next !== confirm) {
      toast.error("Passwords don't match");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Password updated");
        setCurrent("");
        setNext("");
        setConfirm("");
      } else {
        toast.error(data.error ?? "Couldn't update password");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border bg-white p-6 shadow-sm"
    >
      <h3 className="font-semibold text-slate-900">Change password</h3>
      <p className="text-xs text-slate-500">
        Use at least 8 characters. We hash with bcrypt before storing.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label>Current password</Label>
          <Input
            type="password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            className="mt-1.5"
            autoComplete="current-password"
            required
          />
        </div>
        <div>
          <Label>New password</Label>
          <Input
            type="password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            className="mt-1.5"
            autoComplete="new-password"
            required
          />
        </div>
        <div>
          <Label>Confirm new password</Label>
          <Input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="mt-1.5"
            autoComplete="new-password"
            required
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={busy}
        className="mt-5 bg-violet-600 hover:bg-violet-700"
      >
        {busy ? "Updating…" : "Update password"}
      </Button>
    </form>
  );
}
