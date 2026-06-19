"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Building2,
  GitBranch,
  MapPin,
  Plus,
  Search,
  Pencil,
  X,
  Users,
  FileText,
  IndianRupee,
} from "lucide-react";

interface Branch {
  id: string;
  name: string;
  city: string;
  state: string;
  driverCount: number;
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Your Branches</h1>
          <p className="text-sm text-slate-500">
            {used} of {max} branches used · {remaining} slots remaining
          </p>
        </div>
        <Button
          onClick={() => setShowAdd(true)}
          disabled={remaining === 0}
          className="bg-violet-600 hover:bg-violet-700"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Add New Branch
        </Button>
      </div>

      <div className="mt-6 relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Search branches..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading && branches.length === 0 ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-52 animate-pulse rounded-2xl border bg-white shadow-sm"
            />
          ))
        ) : visible.length === 0 ? (
          <div className="md:col-span-2 xl:col-span-3 rounded-2xl border border-dashed bg-white p-12 text-center text-sm text-slate-400">
            {branches.length === 0
              ? "No branches yet — click Add Branch to create the first one."
              : "No branches match your search."}
          </div>
        ) : (
          visible.map((b) => {
            const isActive = b.driverCount > 0 || b.lrsThisMonth > 0;
            return (
              <div
                key={b.id}
                className="group flex flex-col rounded-2xl border bg-white p-5 shadow-sm transition hover:border-violet-200 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900">{b.name}</h3>
                    <p className="mt-0.5 flex items-center gap-1 text-sm text-slate-500">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      {b.city}, {b.state}
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ${
                    isActive
                      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                      : "bg-slate-100 text-slate-500 ring-slate-200"
                  }`}>
                    {isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 text-center text-sm">
                  <div>
                    <div className="flex items-center justify-center gap-1">
                      <Users className="h-3 w-3 text-blue-500" />
                      <p className="text-base font-bold text-blue-600">
                        {b.driverCount}
                      </p>
                    </div>
                    <p className="text-[11px] uppercase tracking-wider text-slate-500">
                      Drivers
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1">
                      <FileText className="h-3 w-3 text-violet-500" />
                      <p className="text-base font-bold text-violet-600">
                        {b.lrsThisMonth}
                      </p>
                    </div>
                    <p className="text-[11px] uppercase tracking-wider text-slate-500">
                      LRs
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1">
                      <IndianRupee className="h-3 w-3 text-emerald-500" />
                      <p className="text-base font-bold text-emerald-600">
                        ₹{(b.freight / 100000).toFixed(1)}L
                      </p>
                    </div>
                    <p className="text-[11px] uppercase tracking-wider text-slate-500">
                      Freight
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setEditing(b);
                    setEditForm({ name: b.name, city: b.city, state: b.state });
                  }}
                  className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-full border border-slate-200 px-4 py-1.5 text-sm font-semibold text-slate-700 transition hover:border-violet-300 hover:text-violet-700"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit Branch
                </button>
              </div>
            );
          })
        )}

        {remaining > 0 && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 p-8 text-slate-400 transition hover:border-violet-300 hover:text-violet-600"
          >
            <Plus className="h-8 w-8" />
            <span className="text-sm font-semibold">Add New Branch</span>
            <span className="text-xs">{remaining} slots remaining</span>
          </button>
        )}
      </div>

      <div className="mt-6 text-sm text-slate-500">
        {used} / {max} branches
      </div>

      {showAdd && (
        <Modal title="Add New Branch" onClose={() => setShowAdd(false)}>
          <div className="space-y-4">
            <div>
              <Label>Branch Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Vijayawada Branch"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>City *</Label>
              <Input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="e.g. Vijayawada"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>State *</Label>
              <Input
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                className="mt-1.5"
              />
            </div>
          </div>
          <div className="mt-6 flex items-center justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowAdd(false)}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              onClick={createBranch}
              disabled={creating}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {creating ? "Creating…" : "Create Branch"}
            </Button>
          </div>
        </Modal>
      )}

      {editing && (
        <Modal title={`Edit ${editing.name}`} onClose={() => setEditing(null)}>
          <div className="space-y-4">
            <div>
              <Label>Branch Name *</Label>
              <Input
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>City *</Label>
              <Input
                value={editForm.city}
                onChange={(e) =>
                  setEditForm({ ...editForm, city: e.target.value })
                }
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>State *</Label>
              <Input
                value={editForm.state}
                onChange={(e) =>
                  setEditForm({ ...editForm, state: e.target.value })
                }
                className="mt-1.5"
              />
            </div>
          </div>
          <div className="mt-6 flex items-center justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setEditing(null)}
              disabled={savingEdit}
            >
              Cancel
            </Button>
            <Button
              onClick={saveEdit}
              disabled={savingEdit}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {savingEdit ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 backdrop-blur sm:items-center">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b p-5">
          <h2 className="text-lg font-bold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
