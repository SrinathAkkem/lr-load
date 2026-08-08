"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Eye, Pencil, RotateCw, Trash2 } from "lucide-react";
import { IconSearch, IconUserGroup } from "@/components/rono/dashboard-icons";
import { FilterDropdown } from "@/components/rono/filter-dropdown";
import { ActionMenu } from "@/components/rono/action-menu";
import { SendInviteModal } from "./send-invite-modal";

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

const PER_PAGE = 10;

const FILTERS: ReadonlyArray<{ key: "all" | "invited" | "active" | "inactive"; label: string }> = [
  { key: "all", label: "All" },
  { key: "invited", label: "Invited (Pending)" },
  { key: "active", label: "Active" },
  { key: "inactive", label: "Inactive" },
];

const FILTER_PILL_STYLES: Record<string, { active: string; inactive: string }> = {
  all: { active: "bg-[#5E3EA1] text-white", inactive: "bg-[#F5F5F7] text-[#4D4D4D]" },
  invited: { active: "bg-[#967E1C] text-white", inactive: "bg-[#F7CE25]/20 text-[#967E1C]" },
  active: { active: "bg-[#0C6B24] text-white", inactive: "bg-[#0C6B24]/10 text-[#0C6B24]" },
  inactive: { active: "bg-[#961C1C] text-white", inactive: "bg-[#961C1C]/20 text-[#961C1C]" },
};

export default function ExecutivesPage() {
  const [executives, setExecutives] = useState<Executive[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "invited" | "inactive">("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [removing, setRemoving] = useState<string | null>(null);
  const [resending, setResending] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [lrCode, setLrCode] = useState("RONO1");
  const [page, setPage] = useState(1);

  useEffect(() => {
    refresh();
    fetch("/api/branches")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setBranches(d.data);
      });
    fetch("/api/company/profile")
      .then((r) => r.json())
      .then((d) => {
        if (d?.success && d.data?.lrCode) setLrCode(d.data.lrCode);
      });
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, branchFilter]);

  async function refresh() {
    const res = await fetch("/api/executives");
    const d = await res.json();
    if (d.success) setExecutives(d.data);
  }

  async function removeExecutive(id: string, name: string) {
    if (!confirm(`Deactivate ${name}? They won't be able to log in or create LRs.`)) return;
    setRemoving(id);
    try {
      const res = await fetch(`/api/executives/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success(`${name} deactivated`);
        refresh();
      } else toast.error(data.error ?? "Failed");
    } finally {
      setRemoving(null);
    }
  }

  async function resendOtp(mobile: string) {
    setResending(mobile);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile, purpose: "login" }),
      });
      const data = await res.json();
      if (data.success) toast.success("OTP has been sent to mobile number");
      else toast.error(data.error ?? "Failed to resend OTP");
    } finally {
      setResending(null);
    }
  }

  const filtered = useMemo(() => {
    return executives.filter((d) => {
      if (statusFilter !== "all" && d.status !== statusFilter) return false;
      if (branchFilter !== "all" && d.branch?.name !== branchFilter) return false;
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        d.name.toLowerCase().includes(q) ||
        d.mobile.includes(q) ||
        (d.branch?.name ?? "").toLowerCase().includes(q)
      );
    });
  }, [executives, statusFilter, branchFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const counts = {
    all: executives.length,
    invited: executives.filter((d) => d.status === "invited").length,
    active: executives.filter((d) => d.status === "active").length,
    inactive: executives.filter((d) => d.status === "inactive").length,
  };

  const initials = (name: string) =>
    name.split(/\s+/).map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="p-4 md:p-8">
      <div className="rounded-2xl border border-black/[0.06] bg-white shadow-sm">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.06] px-4 py-4 md:px-6">
          <h2 className="text-base font-semibold text-black">List of Executive</h2>
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                type="text"
                placeholder="Search Executive Name"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-48 rounded-lg border border-black/10 bg-white py-2 pl-9 pr-3 text-xs text-black outline-none focus:border-[#5E3EA1]/40 focus:ring-1 focus:ring-[#5E3EA1]/30"
              />
            </div>
            <FilterDropdown
              label="Status"
              value={statusFilter}
              onChange={(v) => setStatusFilter(v as typeof statusFilter)}
              options={[
                { value: "all", label: "All Status" },
                { value: "active", label: "Active" },
                { value: "invited", label: "Invited (Pending)" },
                { value: "inactive", label: "Inactive" },
              ]}
            />
            <span className="flex h-10 items-center gap-1.5 rounded-lg border border-black/10 bg-white px-3.5 text-xs font-semibold text-black">
              <IconUserGroup className="h-3.5 w-3.5 text-[#5E3EA1]" />
              Total Executive : {executives.length}
            </span>
            <button
              type="button"
              onClick={() => setInviteOpen(true)}
              className="flex h-10 items-center gap-1.5 rounded-lg bg-[#5E3EA1] px-4 text-xs font-semibold text-white transition hover:opacity-90"
            >
              + Send Invite
            </button>
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex flex-wrap items-center gap-1.5 px-4 py-3 md:px-6">
          {FILTERS.map((f) => {
            const styles = FILTER_PILL_STYLES[f.key];
            const isActive = statusFilter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  isActive ? styles.active : styles.inactive
                }`}
              >
                {f.label} <span className="opacity-70">{counts[f.key]}</span>
              </button>
            );
          })}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-sm">
            <thead>
              <tr className="border-b border-black/[0.06] text-left">
                <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">ID</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">Executive Name</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">Mobile No.</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">Branch</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">LRS (Month)</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">Last Activated</th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">Status</th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">Action</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-sm text-[#9CA3AF]">
                    {executives.length === 0
                      ? "No executives yet. Send the first invite above."
                      : "No executives match your filters."}
                  </td>
                </tr>
              ) : (
                paged.map((d, i) => (
                  <tr key={d.id} className="border-b border-black/[0.04] last:border-0 hover:bg-black/[0.015]">
                    <td className="px-6 py-3.5 text-xs font-medium text-[#9CA3AF]">
                      #{lrCode}{(page - 1) * PER_PAGE + i + 1}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${
                            d.status === "active"
                              ? "bg-[#5E3EA1]"
                              : d.status === "invited"
                                ? "bg-[#967E1C]"
                                : "bg-[#9CA3AF]"
                          }`}
                        >
                          {initials(d.name)}
                        </span>
                        <Link
                          href={`/company/executives/${d.id}`}
                          className="font-semibold text-[#5E3EA1] hover:underline"
                        >
                          {d.name}
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-black">+91 {d.mobile}</td>
                    <td className="px-4 py-3.5 text-black">{d.branch?.name ?? "—"}</td>
                    <td className="px-4 py-3.5 text-black">
                      {d.status === "invited" ? "—" : d.lrsThisMonth}
                    </td>
                    <td className="px-4 py-3.5">
                      {d.lastActive ? (
                        <>
                          <p className="text-black">{shortDate(d.lastActive)}</p>
                          <p className="text-[11px] text-[#9CA3AF]">{shortTime(d.lastActive)}</p>
                        </>
                      ) : (
                        <span className="text-[#9CA3AF]">
                          {d.status === "invited" ? "Not yet joined" : "—"}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusPill status={d.status} />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <ActionMenu
                        items={[
                          {
                            key: "view",
                            label: "View",
                            icon: <Eye className="h-4 w-4" />,
                            href: `/company/executives/${d.id}`,
                          },
                          {
                            key: "edit",
                            label: "Edit",
                            icon: <Pencil className="h-4 w-4" />,
                            href: `/company/executives/${d.id}?edit=1`,
                          },
                          ...(d.status === "invited"
                            ? [
                                {
                                  key: "resend",
                                  label: resending === d.mobile ? "Sending…" : "Resend OTP",
                                  icon: <RotateCw className="h-4 w-4" />,
                                  onClick: () => resendOtp(d.mobile),
                                },
                              ]
                            : []),
                          {
                            key: "remove",
                            label: removing === d.id ? "Removing…" : "Remove",
                            icon: <Trash2 className="h-4 w-4" />,
                            onClick: () => removeExecutive(d.id, d.name),
                            danger: true,
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
            Showing {filtered.length === 0 ? 0 : (page - 1) * PER_PAGE + 1}–
            {Math.min(page * PER_PAGE, filtered.length)} of {filtered.length} LR
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

      <SendInviteModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        branches={branches}
        onSent={refresh}
      />
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
      {status === "invited" ? "Invited (Pending)" : status}
    </span>
  );
}

function shortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function shortTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
}
