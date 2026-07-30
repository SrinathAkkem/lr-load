"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Building2,
  MapPin,
  Plus,
  Pencil,
  X,
  FileText,
  CheckCircle,
  Trash2,
} from "lucide-react";

interface Branch {
  id: string;
  name: string;
  city: string;
  state: string;
  executiveCount: number;
  lrsThisMonth: number;
  freight: number;
  status?: string;
}

interface CompanySummary {
  maxBranches: number;
  name?: string;
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

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch("/api/branches");
      const data = await res.json();
      if (data.success) setBranches(data.data);
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

  return (
    <div className="p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Your Branches</h1>
          <p className="text-sm text-slate-500">
            {used} of {max} branches used · {remaining} slots remaining
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
            {used} / {max} branches
          </span>
          <Button
            onClick={openAddModal}
            disabled={remaining === 0}
           
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add New Branch
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading && branches.length === 0 ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-52 animate-pulse rounded-2xl border-0 bg-white shadow-sm" />
          ))
        ) : branches.length === 0 ? (
          <div className="md:col-span-2 xl:col-span-3 rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center text-sm text-slate-400">
            No branches yet. Add your first branch to get started.
          </div>
        ) : (
          <>
            {branches.map((b) => (
              <div
                key={b.id}
                className="rounded-2xl border-0 border-slate-100 bg-white p-5 shadow-sm transition hover:border-primary/20 hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900">{b.name}</h3>
                    <div className="mt-0.5 flex items-center gap-2">
                      <p className="flex items-center gap-1 text-xs text-slate-500">
                        <MapPin className="h-3 w-3" />
                        {b.city}, {b.state.slice(0, 2).toUpperCase()}
                      </p>
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Active
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-xl font-bold text-blue-600">{b.executiveCount}</p>
                    <p className="text-[10px] font-medium text-slate-500">Executives</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-primary">{b.lrsThisMonth}</p>
                    <p className="text-[10px] font-medium text-slate-500">LRs (Month)</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-emerald-600">₹{(b.freight / 100000).toFixed(1)}L</p>
                    <p className="text-[10px] font-medium text-slate-500">Freight</p>
                  </div>
                </div>

                <div className="mt-5 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(b);
                      setEditForm({ name: b.name, city: b.city, state: b.state });
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2 text-xs font-semibold text-slate-700 transition hover:border-primary/30 hover:text-primary"
                  >
                    <Pencil className="h-3 w-3" />
                    Edit
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-primary/30 hover:text-primary"
                  >
                    <FileText className="h-3 w-3" />
                    LRs
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteBranch(b)}
                    disabled={deleting === b.id}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                    title="Delete branch"
                  >
                    <Trash2 className="h-3 w-3" />
                    {deleting === b.id ? "…" : "Delete"}
                  </button>
                </div>
              </div>
            ))}

            {remaining > 0 && (
              <button
                type="button"
                onClick={openAddModal}
                className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-white p-8 text-slate-400 transition hover:border-primary/30 hover:text-primary"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed border-current">
                  <Plus className="h-6 w-6" />
                </div>
                <span className="text-sm font-semibold">Add New Branch</span>
                <span className="text-xs">{remaining} slots remaining</span>
              </button>
            )}
          </>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 backdrop-blur sm:items-center">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createBranch();
            }}
            className="w-full max-w-lg rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b p-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Add New Branch</h2>
                <p className="text-xs text-slate-500">
                  {remaining} branch slot{remaining === 1 ? "" : "s"} remaining
                </p>
              </div>
              <button
                type="button"
                onClick={() => !creating && setShowAdd(false)}
                className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4 p-5">
              <div>
                <Label>Branch Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Vijayawada Branch"
                  className="mt-1.5"
                  required
                />
              </div>
              <div>
                <Label>City *</Label>
                <Input
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="e.g. Vijayawada"
                  className="mt-1.5"
                  required
                />
              </div>
              <div>
                <Label>State *</Label>
                <Input
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  className="mt-1.5"
                  required
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t bg-slate-50 p-5">
              <Button
                type="button"
                variant="outline"
                onClick={() => !creating && setShowAdd(false)}
                disabled={creating}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={creating}
               
              >
                <CheckCircle className="mr-1.5 h-4 w-4" />
                {creating ? "Creating…" : "Create Branch"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 backdrop-blur sm:items-center">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b p-5">
              <h2 className="text-lg font-bold">Edit {editing.name}</h2>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4 p-5">
              <div>
                <Label>Branch Name *</Label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>City *</Label>
                <Input
                  value={editForm.city}
                  onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>State *</Label>
                <Input
                  value={editForm.state}
                  onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                  className="mt-1.5"
                />
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 border-t bg-slate-50 p-5">
              <Button
                type="button"
                variant="outline"
                onClick={() => deleteBranch(editing)}
                disabled={savingEdit || deleting === editing.id}
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="mr-1.5 h-4 w-4" />
                Delete
              </Button>
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={() => setEditing(null)} disabled={savingEdit}>
                  Cancel
                </Button>
                <Button onClick={saveEdit} disabled={savingEdit}>
                  {savingEdit ? "Saving…" : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
