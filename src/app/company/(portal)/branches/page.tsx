"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Plus, X, Pencil, Trash2, ChevronDown } from "lucide-react";
import { IconBuilding, IconMoreDots } from "@/components/rono/dashboard-icons";
import { BranchExpenseDonut } from "@/components/rono/branch-expense-donut";
import {
  BranchStatusRatioChart,
  type MonthStatusPoint,
} from "@/components/rono/branch-status-ratio-chart";

interface Branch {
  id: string;
  name: string;
  city: string;
  state: string;
  executiveCount: number;
  totalLrs: number;
  lrsThisMonth: number;
  rejectedThisMonth: number;
  freight: number;
}

interface CompanySummary {
  maxBranches: number;
  name?: string;
}

interface BranchLr {
  createdAt: string;
  status: string;
}

const INITIAL_FORM = { name: "", city: "", state: "Telangana" };

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [editForm, setEditForm] = useState(INITIAL_FORM);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [company, setCompany] = useState<CompanySummary | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [branchLrs, setBranchLrs] = useState<BranchLr[]>([]);
  const [loadingReport, setLoadingReport] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    refresh();
    fetch("/api/company/profile")
      .then((r) => r.json())
      .then((d) => {
        if (d?.success && d.data) {
          setCompany({
            maxBranches: d.data.maxBranches,
            name: d.data.name,
          });
        }
      });
  }, []);

  useEffect(() => {
    if (!openMenuId) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenuId(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openMenuId]);

  useEffect(() => {
    if (!selectedBranchId) return;
    let cancelled = false;
    setLoadingReport(true);
    fetch(`/api/lr?branchId=${selectedBranchId}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d.success) {
          setBranchLrs(
            d.data.map((lr: { createdAt: string; status: string }) => ({
              createdAt: lr.createdAt,
              status: lr.status,
            })),
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingReport(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedBranchId]);

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch("/api/branches");
      const data = await res.json();
      if (data.success) {
        setBranches(data.data);
        setSelectedBranchId((prev) => prev ?? data.data[0]?.id ?? null);
      }
    } finally {
      setLoading(false);
    }
  }

  function openAddModal() {
    setForm(INITIAL_FORM);
    setShowAdd(true);
  }

  async function createBranch() {
    if (!form.name.trim() || !form.city.trim()) {
      toast.error("Branch name and city are required");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Branch created");
        setForm(INITIAL_FORM);
        setShowAdd(false);
        refresh();
      } else {
        toast.error(data.error ?? "Couldn't create branch");
      }
    } finally {
      setCreating(false);
    }
  }

  async function saveEdit() {
    if (!editing) return;
    if (!editForm.name.trim() || !editForm.city.trim()) {
      toast.error("Branch name and city are required");
      return;
    }
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/branches/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Branch updated");
        setEditing(null);
        refresh();
      } else {
        toast.error(data.error ?? "Couldn't update branch");
      }
    } finally {
      setSavingEdit(false);
    }
  }

  async function deleteBranch(branch: Branch) {
    if (
      !confirm(
        `Delete "${branch.name}"? This cannot be undone. Branches with executives or LRs cannot be removed.`,
      )
    ) {
      return;
    }
    setDeleting(branch.id);
    try {
      const res = await fetch(`/api/branches/${branch.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("Branch deleted");
        if (editing?.id === branch.id) setEditing(null);
        refresh();
      } else {
        toast.error(data.error ?? "Couldn't delete branch");
      }
    } finally {
      setDeleting(null);
    }
  }

  const used = branches.length;
  const max = company?.maxBranches ?? used;
  const remaining = Math.max(0, max - used);
  const selectedBranch = branches.find((b) => b.id === selectedBranchId) ?? null;

  const monthlyStatusData: MonthStatusPoint[] = useMemo(() => {
    const now = new Date();
    const months: MonthStatusPoint[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        label: d.toLocaleDateString("en-IN", { month: "short" }).toUpperCase(),
        delivered: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
      });
    }
    for (const lr of branchLrs) {
      const d = new Date(lr.createdAt);
      const monthsAgo =
        (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
      if (monthsAgo < 0 || monthsAgo > 5) continue;
      const bucket = months[5 - monthsAgo];
      if (!bucket) continue;
      if (lr.status === "delivered") bucket.delivered += 1;
      else if (lr.status === "approved") bucket.approved += 1;
      else if (lr.status === "pending") bucket.pending += 1;
      else if (lr.status === "rejected") bucket.rejected += 1;
    }
    return months;
  }, [branchLrs]);

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-bold text-black">Your Branch</h1>
        <button
          type="button"
          onClick={openAddModal}
          disabled={remaining === 0}
          className="flex items-center gap-1.5 rounded-lg bg-[#5E3EA1] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Add New Branch
        </button>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading && branches.length === 0 ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl border border-black/[0.06] bg-white shadow-sm" />
          ))
        ) : branches.length === 0 ? (
          <div className="md:col-span-2 xl:col-span-3 rounded-2xl border border-dashed border-black/10 bg-white p-12 text-center text-sm text-slate-400">
            No branches yet. Add your first branch to get started.
          </div>
        ) : (
          branches.map((b) => {
            const selected = b.id === selectedBranchId;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => setSelectedBranchId(b.id)}
                className={`rounded-2xl border bg-white p-5 text-left shadow-sm transition ${
                  selected ? "border-[#5E3EA1] ring-1 ring-[#5E3EA1]" : "border-black/[0.06] hover:border-black/10"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#5E3EA1]/10">
                      <IconBuilding className="h-4 w-[14px] text-[#5E3EA1]" />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-black">{b.name}</p>
                      <p className="text-[11px] text-[#4D4D4D]">
                        Total Executive : {b.executiveCount}
                      </p>
                    </div>
                  </div>

                  <div className="relative" ref={openMenuId === b.id ? menuRef : undefined}>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId((v) => (v === b.id ? null : b.id));
                      }}
                      className="flex h-7 w-7 items-center justify-center text-[#5E3EA1] transition hover:opacity-70"
                    >
                      <IconMoreDots className="h-7 w-7" />
                    </span>
                    {openMenuId === b.id && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-0 top-7 z-20 w-32 overflow-hidden rounded-xl border border-black/[0.06] bg-white py-1.5 shadow-lg"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenuId(null);
                            setEditing(b);
                            setEditForm({ name: b.name, city: b.city, state: b.state });
                          }}
                          className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm font-medium text-black transition hover:bg-black/[0.04]"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={deleting === b.id}
                          onClick={() => {
                            setOpenMenuId(null);
                            deleteBranch(b);
                          }}
                          className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm font-medium text-[#C00F0C] transition hover:bg-black/[0.04]"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-black/[0.06] pt-4">
                  <div>
                    <p className="text-[10px] font-medium text-[#4D4D4D]">Total LR</p>
                    <p className="text-lg font-bold text-[#3C60B6]">{b.totalLrs}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-[#4D4D4D]">LR (This Month)</p>
                    <p className="text-lg font-bold text-[#5E3EA1]">{b.lrsThisMonth}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-[#4D4D4D]">Rejected (This Month)</p>
                    <p className="text-lg font-bold text-[#DE0000]">{b.rejectedThisMonth}</p>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {selectedBranch && (
        <div className="mt-8">
          <h2 className="text-base font-bold text-black">{selectedBranch.name} Report</h2>
          <div className="mt-4 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-black">Branch Expenses</h3>
                  <p className="text-xs text-[#4D4D4D]">Freight Amount</p>
                </div>
                <span className="flex items-center gap-1 rounded-full border border-[#5E3EA1] px-4 py-2 text-xs font-semibold text-[#5E3EA1]">
                  Last Month
                  <ChevronDown className="h-3.5 w-3.5" />
                </span>
              </div>
              <div className="mt-4">
                {loadingReport ? (
                  <div className="flex h-52 items-center justify-center text-sm text-slate-400">
                    Loading…
                  </div>
                ) : (
                  <BranchExpenseDonut freightTotal={selectedBranch.freight} />
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-black">LR Status Ratio</h3>
                <span className="flex items-center gap-1 rounded-full border border-[#5E3EA1] px-4 py-2 text-xs font-semibold text-[#5E3EA1]">
                  Last 6 Months
                  <ChevronDown className="h-3.5 w-3.5" />
                </span>
              </div>
              <div className="mt-4">
                {loadingReport ? (
                  <div className="flex h-64 items-center justify-center text-sm text-slate-400">
                    Loading…
                  </div>
                ) : (
                  <BranchStatusRatioChart data={monthlyStatusData} />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showAdd && (
        <BranchFormModal
          title="Add New Branch"
          subtitle={`${remaining} branch slot${remaining === 1 ? "" : "s"} remaining`}
          form={form}
          setForm={setForm}
          onCancel={() => !creating && setShowAdd(false)}
          onSave={createBranch}
          saving={creating}
          saveLabel="Save"
        />
      )}

      {editing && (
        <BranchFormModal
          title="Edit New Branch"
          form={editForm}
          setForm={setEditForm}
          onCancel={() => !savingEdit && setEditing(null)}
          onSave={saveEdit}
          saving={savingEdit}
          saveLabel="Save"
        />
      )}
    </div>
  );
}

function BranchFormModal({
  title,
  subtitle,
  form,
  setForm,
  onCancel,
  onSave,
  saving,
  saveLabel,
}: {
  title: string;
  subtitle?: string;
  form: { name: string; city: string; state: string };
  setForm: (f: { name: string; city: string; state: string }) => void;
  onCancel: () => void;
  onSave: () => void;
  saving: boolean;
  saveLabel: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave();
        }}
        className="flex max-h-[92vh] w-full max-w-md flex-col rounded-t-2xl bg-white shadow-2xl sm:max-h-[85vh] sm:rounded-2xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-black/[0.06] p-5">
          <div>
            <h2 className="text-base font-bold text-black">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-[#9CA3AF]">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full p-1 text-[#9CA3AF] transition hover:bg-black/[0.04]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          <div>
            <label className="text-sm text-black">
              Branch Name<span className="text-red-500">*</span>
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Vijayawada Branch"
              required
              className="mt-1.5 h-11 w-full rounded-lg bg-[#F5F5F7] px-3.5 text-sm text-black outline-none focus:ring-1 focus:ring-[#5E3EA1]"
            />
          </div>
          <div>
            <label className="text-sm text-black">
              City<span className="text-red-500">*</span>
            </label>
            <input
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              placeholder="e.g. Vijayawada"
              required
              className="mt-1.5 h-11 w-full rounded-lg bg-[#F5F5F7] px-3.5 text-sm text-black outline-none focus:ring-1 focus:ring-[#5E3EA1]"
            />
          </div>
          <div>
            <label className="text-sm text-black">
              State<span className="text-red-500">*</span>
            </label>
            <input
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
              required
              className="mt-1.5 h-11 w-full rounded-lg bg-[#F5F5F7] px-3.5 text-sm text-black outline-none focus:ring-1 focus:ring-[#5E3EA1]"
            />
          </div>
        </div>
        <div className="flex shrink-0 items-center justify-end gap-3 border-t border-black/[0.06] p-5">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="rounded-xl border border-black/10 px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-black/[0.03] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-black px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Saving…" : saveLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
