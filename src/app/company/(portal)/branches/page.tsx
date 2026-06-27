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
  Search,
  Pencil,
  X,
  FileText,
  CheckCircle,
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
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [editForm, setEditForm] = useState(INITIAL_FORM);
  const [savingEdit, setSavingEdit] = useState(false);
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

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return branches;
    return branches.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.city.toLowerCase().includes(q) ||
        b.state.toLowerCase().includes(q),
    );
  }, [branches, search]);

  const used = branches.length;
  const max = company?.maxBranches ?? used;
  const remaining = Math.max(0, max - used);

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
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
            onClick={() => setShowAdd(true)}
            disabled={remaining === 0}
            className="bg-violet-600 hover:bg-violet-700"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add New Branch
          </Button>
        </div>
      </div>

      {/* Branch Cards Grid */}
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading && branches.length === 0 ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-52 animate-pulse rounded-2xl border-0 bg-white shadow-sm" />
          ))
        ) : visible.length === 0 && branches.length > 0 ? (
          <div className="md:col-span-2 xl:col-span-3 rounded-2xl border-0 border-dashed bg-white p-12 text-center text-sm text-slate-400">
            No branches match your search.
          </div>
        ) : (
          <>
            {visible.map((b) => (
              <div
                key={b.id}
                className="rounded-2xl border-0 border-slate-100 bg-white p-5 shadow-sm transition hover:border-violet-200 hover:shadow-md"
              >
                {/* Branch header */}
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50">
                    <Building2 className="h-5 w-5 text-violet-600" />
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

                {/* Stats row */}
                <div className="mt-5 flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-xl font-bold text-blue-600">{b.executiveCount}</p>
                    <p className="text-[10px] font-medium text-slate-500">Executives</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-violet-600">{b.lrsThisMonth}</p>
                    <p className="text-[10px] font-medium text-slate-500">LRs (Month)</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-emerald-600">₹{(b.freight / 100000).toFixed(1)}L</p>
                    <p className="text-[10px] font-medium text-slate-500">Freight</p>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="mt-5 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(b);
                      setEditForm({ name: b.name, city: b.city, state: b.state });
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2 text-xs font-semibold text-slate-700 transition hover:border-violet-300 hover:text-violet-700"
                  >
                    <Pencil className="h-3 w-3" />
                    Edit Branch
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-violet-300 hover:text-violet-700"
                  >
                    <FileText className="h-3 w-3" />
                    LRs
                  </button>
                </div>
              </div>
            ))}

            {/* Add New Branch card */}
            {remaining > 0 && (
              <button
                onClick={() => setShowAdd(true)}
                className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-white p-8 text-slate-400 transition hover:border-violet-300 hover:text-violet-600"
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

      {/* Inline Add Branch form */}
      <div className="mt-8 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h3 className="flex items-center gap-2 text-sm font-bold text-violet-700">
          <Plus className="h-4 w-4" />
          Add New Branch
        </h3>
        <div className="mt-4 grid gap-4 md:grid-cols-4 items-end">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Branch Name</p>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Vijayawada Branch"
              className="mt-1.5"
            />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">City</p>
            <Input
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              placeholder="e.g. Vijayawada"
              className="mt-1.5"
            />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">State</p>
            <Input
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
              className="mt-1.5"
            />
          </div>
          <div>
            <Button
              onClick={createBranch}
              disabled={creating}
              className="w-full bg-violet-600 hover:bg-violet-700"
            >
              <CheckCircle className="mr-1.5 h-4 w-4" />
              {creating ? "Creating…" : "Create Branch"}
            </Button>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
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
            <div className="flex items-center justify-end gap-3 border-t bg-slate-50 p-5">
              <Button variant="outline" onClick={() => setEditing(null)} disabled={savingEdit}>Cancel</Button>
              <Button onClick={saveEdit} disabled={savingEdit} className="bg-violet-600 hover:bg-violet-700">
                {savingEdit ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
