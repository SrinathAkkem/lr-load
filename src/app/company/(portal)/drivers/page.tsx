"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { UserPlus, Trash2, Search } from "lucide-react";

interface Driver {
  id: string;
  name: string;
  mobile: string;
  status: string;
  branch?: { name: string; city?: string };
  lrsThisMonth: number;
}

interface Branch {
  id: string;
  name: string;
  city: string;
}

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "invited" | "inactive">("all");
  const [showModal, setShowModal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", mobile: "", branchId: "" });

  useEffect(() => {
    refresh();
    fetch("/api/branches")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setBranches(d.data);
          if (d.data[0]) setForm((f) => ({ ...f, branchId: d.data[0].id }));
        }
      });
  }, []);

  async function refresh() {
    const res = await fetch("/api/drivers");
    const d = await res.json();
    if (d.success) setDrivers(d.data);
  }

  async function inviteDriver() {
    if (!/^\d{10}$/.test(form.mobile)) {
      toast.error("Mobile must be 10 digits");
      return;
    }
    if (!form.branchId) {
      toast.error("Please select a branch");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/drivers/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile: form.mobile,
          name: form.name.trim() || undefined,
          branchId: form.branchId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Invite sent — driver can now log in via OTP");
        setForm((f) => ({ name: "", mobile: "", branchId: f.branchId }));
        setShowModal(false);
        refresh();
      } else {
        toast.error(data.error ?? "Failed to invite");
      }
    } finally {
      setBusy(false);
    }
  }

  async function removeDriver(id: string, name: string) {
    if (!confirm(`Deactivate ${name}? They won't be able to log in or create LRs. Existing LRs are preserved.`)) {
      return;
    }
    setRemoving(id);
    try {
      const res = await fetch(`/api/drivers/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success(`${name} deactivated`);
        refresh();
      } else {
        toast.error(data.error ?? "Failed to deactivate");
      }
    } finally {
      setRemoving(null);
    }
  }

  const filtered = drivers.filter((d) => {
    if (statusFilter !== "all" && d.status !== statusFilter) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      d.name.toLowerCase().includes(q) ||
      d.mobile.includes(q) ||
      (d.branch?.name ?? "").toLowerCase().includes(q)
    );
  });

  const counts = drivers.reduce(
    (acc, d) => {
      acc.all += 1;
      acc[d.status as "active" | "invited" | "inactive"] = (acc[d.status as "active" | "invited" | "inactive"] ?? 0) + 1;
      return acc;
    },
    { all: 0, active: 0, invited: 0, inactive: 0 } as Record<string, number>,
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Driver Management</h1>
          <p className="text-sm text-slate-500">
            Invite new drivers, manage branches, and deactivate ex-employees.
          </p>
        </div>
        <Button
          className="bg-violet-600 hover:bg-violet-700"
          onClick={() => setShowModal(true)}
        >
          <UserPlus className="mr-1.5 h-4 w-4" />
          Invite Driver
        </Button>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by name, mobile, branch…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(["all", "active", "invited", "inactive"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition ${
                statusFilter === s
                  ? "bg-violet-600 text-white shadow"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-violet-300"
              }`}
            >
              {s} ({counts[s] ?? 0})
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="p-4">Driver</th>
              <th className="p-4">Mobile</th>
              <th className="p-4">Branch</th>
              <th className="p-4">LRs (Month)</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-10 text-center text-sm text-slate-400">
                  {drivers.length === 0
                    ? "No drivers yet. Click Invite Driver to add the first one."
                    : "No drivers match your filters."}
                </td>
              </tr>
            ) : (
              filtered.map((d) => (
                <tr key={d.id} className="border-b last:border-b-0 hover:bg-slate-50">
                  <td className="p-4 font-medium">{d.name}</td>
                  <td className="p-4 text-slate-600">+91 {d.mobile}</td>
                  <td className="p-4 text-slate-600">{d.branch?.name ?? "—"}</td>
                  <td className="p-4">{d.lrsThisMonth}</td>
                  <td className="p-4">
                    <StatusPill status={d.status} />
                  </td>
                  <td className="p-4 text-right">
                    {d.status !== "inactive" ? (
                      <button
                        onClick={() => removeDriver(d.id, d.name)}
                        disabled={removing === d.id}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-100 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {removing === d.id ? "Removing…" : "Deactivate"}
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400">Deactivated</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 backdrop-blur sm:items-center">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="border-b p-5">
              <h2 className="text-lg font-bold">Invite a Driver</h2>
              <p className="text-xs text-slate-500">
                The driver will log in via OTP and be auto-activated on first login.
              </p>
            </div>
            <div className="space-y-4 p-5">
              <div>
                <Label>Driver Name (optional)</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Defaults to 'New Driver'"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Mobile (10 digits) *</Label>
                <Input
                  value={form.mobile}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      mobile: e.target.value.replace(/\D/g, "").slice(0, 10),
                    })
                  }
                  placeholder="9876543210"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Branch *</Label>
                <Select
                  value={form.branchId}
                  onValueChange={(v) => setForm({ ...form, branchId: v })}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select a branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name} · {b.city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t bg-slate-50 p-5">
              <Button
                variant="outline"
                onClick={() => setShowModal(false)}
                disabled={busy}
              >
                Cancel
              </Button>
              <Button
                className="bg-violet-600 hover:bg-violet-700"
                onClick={inviteDriver}
                disabled={busy}
              >
                {busy ? "Inviting…" : "Send Invite"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    invited: "bg-amber-50 text-amber-700 ring-amber-200",
    inactive: "bg-slate-100 text-slate-500 ring-slate-200",
  };
  const cls = map[status] ?? map.inactive;
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ring-1 ${cls}`}
    >
      {status}
    </span>
  );
}
