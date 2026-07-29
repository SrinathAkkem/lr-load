"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Send, Search, RotateCw, Trash2 } from "lucide-react";

interface Executive {
  id: string;
  name: string;
  mobile: string;
  status: string;
  branch?: { name: string; city?: string };
  lrsThisMonth: number;
  lastActive: string | null;
  createdAt: string;
}

interface Branch {
  id: string;
  name: string;
  city: string;
}

export default function ExecutivesPage() {
  const [executives, setExecutives] = useState<Executive[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "invited" | "inactive">("all");
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [inviteMobile, setInviteMobile] = useState("");
  const [inviteBranch, setInviteBranch] = useState("");
  const [maxExecutives, setMaxExecutives] = useState(150);

  useEffect(() => {
    refresh();
    fetch("/api/branches")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setBranches(d.data);
          if (d.data[0]) setInviteBranch(d.data[0].id);
        }
      });
    fetch("/api/company/profile")
      .then((r) => r.json())
      .then((d) => {
        if (d?.success && d.data) setMaxExecutives(d.data.maxExecutives);
      });
  }, []);

  async function refresh() {
    const res = await fetch("/api/executives");
    const d = await res.json();
    if (d.success) setExecutives(d.data);
  }

  async function inviteExecutive() {
    if (!/^\d{10}$/.test(inviteMobile)) {
      toast.error("Mobile must be 10 digits");
      return;
    }
    if (!inviteBranch) {
      toast.error("Please select a branch");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/executives/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: inviteMobile, branchId: inviteBranch }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Invite sent — executive can now log in via OTP");
        setInviteMobile("");
        refresh();
      } else {
        toast.error(data.error ?? "Failed to invite");
      }
    } finally {
      setBusy(false);
    }
  }

  async function removeExecutive(id: string, name: string) {
    if (!confirm(`Deactivate ${name}? They won't be able to log in or create LRs.`)) return;
    setRemoving(id);
    try {
      const res = await fetch(`/api/executives/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) { toast.success(`${name} deactivated`); refresh(); }
      else toast.error(data.error ?? "Failed");
    } finally { setRemoving(null); }
  }

  const filtered = executives.filter((d) => {
    if (statusFilter !== "all" && d.status !== statusFilter) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return d.name.toLowerCase().includes(q) || d.mobile.includes(q) || (d.branch?.name ?? "").toLowerCase().includes(q);
  });

  const activeCount = executives.filter(d => d.status === "active").length;
  const invitedCount = executives.filter(d => d.status === "invited").length;
  const inactiveCount = executives.filter(d => d.status === "inactive").length;

  const initials = (name: string) => name.split(/\s+/).map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="p-6 md:p-8">
      {/* Invite a New Executive section */}
      <div className="rounded-2xl border border-violet-100 bg-violet-50/50 p-5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100">
            <Send className="h-5 w-5 text-violet-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-violet-900">Invite a New Executive</h3>
            <p className="text-xs text-violet-700/70">
              Enter the executive&apos;s mobile number. They will receive an OTP to set up their account and join this company.
            </p>
          </div>
          <div className="flex items-center gap-3 text-right">
            <div>
              <p className="text-3xl font-bold text-violet-700">{executives.length} / {maxExecutives}</p>
              <p className="text-[10px] font-medium text-violet-500">executives used</p>
            </div>
            <div className="h-1.5 w-16 rounded-full bg-violet-200">
              <div
                className="h-1.5 rounded-full bg-violet-600"
                style={{ width: `${Math.min(100, (executives.length / maxExecutives) * 100)}%` }}
              />
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Select value={inviteBranch} onValueChange={setInviteBranch}>
            <SelectTrigger className="w-44 rounded-lg border-violet-200 bg-white text-xs">
              <SelectValue placeholder="Select branch" />
            </SelectTrigger>
            <SelectContent>
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative flex-1 max-w-md">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">+91</span>
            <Input
              value={inviteMobile}
              onChange={(e) => setInviteMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="Enter 10-digit mobile number"
              className="pl-10 rounded-lg border-violet-200 bg-white text-sm"
            />
          </div>
          <Button onClick={inviteExecutive} disabled={busy} className="bg-violet-600 hover:bg-violet-700 rounded-lg">
            <Send className="mr-1.5 h-3.5 w-3.5" />
            {busy ? "Sending…" : "Send Invite"}
          </Button>
        </div>
      </div>

      {/* All Executives section */}
      <div className="mt-6 rounded-2xl border border-slate-100 bg-white shadow-sm">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">All Executives</h2>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-violet-50 px-3 py-1 text-[11px] font-semibold text-violet-700">
              {executives.length} executives
            </span>
            <span className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-medium text-slate-600">
              Branch: All ▼
            </span>
            <span className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-medium text-slate-600">
              Status: All ▼
            </span>
          </div>
        </div>

        {/* Filters + Search */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-slate-500 mr-1">Filter:</span>
            {([
              { key: "all", label: "All Executives" },
              { key: "active", label: "Active" },
              { key: "invited", label: "Invited (Pending)" },
              { key: "inactive", label: "Inactive" },
            ] as const).map((f) => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  statusFilter === f.key
                    ? "bg-violet-600 text-white shadow-sm"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="relative w-52">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search executive name or number…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs outline-none focus:border-violet-300 focus:bg-white focus:ring-1 focus:ring-violet-100"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left">
                <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Executive</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Mobile</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Branch</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">LRs (Month)</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Last Active</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Status</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-400">
                    {executives.length === 0 ? "No executives yet. Invite the first one above." : "No executives match your filters."}
                  </td>
                </tr>
              ) : (
                filtered.map((d) => (
                  <tr key={d.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white ${
                          d.status === "active" ? "bg-violet-500" :
                          d.status === "invited" ? "bg-amber-500" : "bg-slate-400"
                        }`}>
                          {initials(d.name)}
                        </span>
                        <div>
                          <p className="font-semibold text-slate-900">{d.name}</p>
                          <p className="text-[11px] text-slate-400">
                            {d.status === "invited"
                              ? `Invited ${relativeDate(d.createdAt)}`
                              : d.status === "inactive"
                                ? `Removed ${shortDate(d.createdAt)}`
                                : `Executive since ${shortDate(d.createdAt)}`}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">+91 {d.mobile}</td>
                    <td className="px-4 py-3.5">
                      <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-[11px] font-semibold text-violet-700">
                        {d.branch?.name ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {d.status === "invited" ? (
                        <span className="text-slate-400">—<br/><span className="text-[10px]">Not yet active</span></span>
                      ) : (
                        <div>
                          <p className="font-semibold text-slate-800">{d.lrsThisMonth}</p>
                          <p className="text-[10px] text-slate-400">
                            {d.status === "inactive" ? "LRs before removal" : "LRs submitted"}
                          </p>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-slate-500">
                      {d.lastActive ? formatLastActive(d.lastActive) : (
                        d.status === "invited" ? "Not yet joined" : "—"
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusPill status={d.status} />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {d.status === "active" ? (
                        <div className="flex items-center justify-end gap-2">
                          <button className="rounded-md border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50">
                            LR History
                          </button>
                          <button
                            onClick={() => removeExecutive(d.id, d.name)}
                            disabled={removing === d.id}
                            className="rounded-md border border-red-200 px-3 py-1.5 text-[11px] font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                          >
                            {removing === d.id ? "…" : "Remove"}
                          </button>
                        </div>
                      ) : d.status === "invited" ? (
                        <div className="flex items-center justify-end gap-2">
                          <button className="rounded-md border border-amber-200 px-3 py-1.5 text-[11px] font-semibold text-amber-700 hover:bg-amber-50">
                            <RotateCw className="mr-1 inline h-3 w-3" />
                            Resend OTP
                          </button>
                          <button
                            onClick={() => removeExecutive(d.id, d.name)}
                            className="rounded-md border border-red-200 px-3 py-1.5 text-[11px] font-semibold text-red-600 hover:bg-red-50"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button className="rounded-md border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-500 hover:bg-slate-50">
                          LR History
                        </button>
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
          <p className="text-xs text-slate-400">Showing 1–{Math.min(6, filtered.length)} of {filtered.length} executives</p>
          <div className="flex items-center gap-1">
            <span className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-400">←</span>
            <span className="rounded-md bg-violet-600 px-2.5 py-1 text-xs font-semibold text-white">1</span>
            <span className="rounded-md border border-slate-200 px-2.5 py-1 text-xs text-slate-600">2</span>
            <span className="rounded-md border border-slate-200 px-2.5 py-1 text-xs text-slate-600">3</span>
            <span className="px-1 text-xs text-slate-400">...</span>
            <span className="rounded-md border border-slate-200 px-2.5 py-1 text-xs text-slate-600">{Math.ceil(filtered.length / 6) || 1}</span>
            <span className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-400">→</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; dot: string }> = {
    active: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
    invited: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
    inactive: { bg: "bg-slate-100", text: "text-slate-500", dot: "bg-slate-400" },
  };
  const s = map[status] ?? map.inactive;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${s.bg} ${s.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {status === "invited" ? "Invited" : status === "active" ? "Active" : "Inactive"}
    </span>
  );
}

function formatLastActive(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / 3600000);
  if (diffHours < 24) return `Today, ${date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })}`;
  if (diffHours < 48) return `Yesterday, ${date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })}`;
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) + ", " + date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
}

function relativeDate(dateStr: string): string {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

function shortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
