"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import type { Company } from "@/lib/types";
import { ChevronLeft, Minus, Plus, ShieldCheck, ShieldX } from "lucide-react";

interface CompanyDetail extends Company {
  branchCount?: number;
  driverCount?: number;
  lrsThisMonth?: number;
}

export default function CompanyDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [limits, setLimits] = useState({
    maxBranches: 10,
    maxDrivers: 150,
    maxLrPerMonth: 500,
  });
  const [loading, setLoading] = useState(true);
  const [savingLimits, setSavingLimits] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);

  const fetchCompany = async () => {
    const res = await fetch(`/api/companies/${id}`);
    const data = await res.json();
    if (data.success) {
      setCompany(data.data);
      setLimits({
        maxBranches: data.data.maxBranches,
        maxDrivers: data.data.maxDrivers,
        maxLrPerMonth: data.data.maxLrPerMonth,
      });
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await fetchCompany();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // fetchCompany is stable across renders aside from `id`, which already
    // triggers refetch via the dependency below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function saveLimits() {
    setSavingLimits(true);
    try {
      const res = await fetch(`/api/companies/${id}/limits`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(limits),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Limits saved");
        await fetchCompany();
      } else {
        toast.error(data.error ?? "Couldn't save limits");
      }
    } finally {
      setSavingLimits(false);
    }
  }

  async function toggleStatus() {
    if (!company) return;
    setTogglingStatus(true);
    const newStatus = company.status === "active" ? "suspended" : "active";
    try {
      const res = await fetch(`/api/companies/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Company ${newStatus}`);
        await fetchCompany();
      } else {
        toast.error(data.error ?? "Couldn't update status");
      }
    } finally {
      setTogglingStatus(false);
    }
  }

  if (loading) return <div className="p-8 text-sm text-slate-500">Loading…</div>;
  if (!company) return <div className="p-8">Company not found</div>;

  return (
    <div className="p-6 md:p-8">
      <Link
        href="/super-admin/companies"
        className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 transition hover:text-slate-900"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Companies
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">
            Company
          </p>
          <h2 className="text-2xl font-bold text-slate-900">{company.name}</h2>
          <p className="mt-1 text-sm text-slate-500">
            <span className="font-mono">{company.lrCode}</span> · GST{" "}
            <span className="font-mono">{company.gstNumber}</span> ·{" "}
            {company.contactPhone}
          </p>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
            company.status === "active"
              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
              : "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
          }`}
        >
          {company.status === "active" ? (
            <ShieldCheck className="h-3 w-3" />
          ) : (
            <ShieldX className="h-3 w-3" />
          )}
          {company.status === "active" ? "Active" : "Suspended"}
        </span>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h3 className="font-semibold text-slate-900">Platform Limits</h3>
            <p className="text-sm text-slate-500">
              Changes take effect immediately and are recorded in the audit
              log.
            </p>

            <div className="mt-6 space-y-5">
              <LimitRow
                label="Max Branches"
                description="Total branches this company can create"
                used={company.branchCount}
                value={limits.maxBranches}
                onChange={(v) => setLimits({ ...limits, maxBranches: v })}
              />
              <LimitRow
                label="Max Drivers"
                description="Total drivers across all branches"
                used={company.driverCount}
                value={limits.maxDrivers}
                onChange={(v) => setLimits({ ...limits, maxDrivers: v })}
              />
              <LimitRow
                label="Max LRs per Month"
                description="Resets on the 1st of each month"
                used={company.lrsThisMonth}
                value={limits.maxLrPerMonth}
                onChange={(v) => setLimits({ ...limits, maxLrPerMonth: v })}
              />
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                onClick={saveLimits}
                disabled={savingLimits}
                className="bg-violet-600 hover:bg-violet-700"
              >
                {savingLimits ? "Saving…" : "Save Limits"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setLimits({
                    maxBranches: company.maxBranches,
                    maxDrivers: company.maxDrivers,
                    maxLrPerMonth: company.maxLrPerMonth,
                  });
                }}
              >
                Reset
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h3 className="font-semibold text-slate-900">Company Information</h3>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label="Company Name" value={company.name} />
              <Field label="LR Code" value={company.lrCode} />
              <Field label="GST Number" value={company.gstNumber} />
              <Field label="Contact Phone" value={company.contactPhone} />
              <div className="sm:col-span-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Address
                </p>
                <p className="mt-1 text-sm text-slate-700">{company.address}</p>
              </div>
            </dl>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h3 className="font-semibold text-slate-900">Usage This Month</h3>
            <div className="mt-4 space-y-4 text-sm">
              <UsageRow
                label="Branches"
                used={company.branchCount ?? 0}
                max={company.maxBranches}
              />
              <UsageRow
                label="Drivers"
                used={company.driverCount ?? 0}
                max={company.maxDrivers}
              />
              <UsageRow
                label="LRs Issued"
                used={company.lrsThisMonth ?? 0}
                max={company.maxLrPerMonth}
              />
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="font-semibold text-slate-900">Platform Access</p>
            <p className="mt-1 text-sm text-slate-500">
              {company.status === "active"
                ? "All drivers and the company admin can sign in."
                : "All drivers and the company admin are blocked from signing in."}
            </p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {company.status === "active" ? "Active" : "Suspended"}
              </span>
              <Switch
                checked={company.status === "active"}
                disabled={togglingStatus}
                onCheckedChange={toggleStatus}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800 shadow-sm">
            <p className="font-semibold">Suspend Company Access</p>
            <p className="mt-1 text-xs leading-relaxed">
              Suspending will immediately block all drivers and the company
              admin from logging in. All LR data is preserved. You can
              reactivate the company at any time from this page.
            </p>
            <button
              type="button"
              onClick={toggleStatus}
              disabled={togglingStatus}
              className={`mt-4 w-full rounded-lg px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-60 ${
                company.status === "active"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              {togglingStatus
                ? "Processing…"
                : company.status === "active"
                  ? "Suspend Company"
                  : "Reactivate Company"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-800">
        {value}
      </p>
    </div>
  );
}

function LimitRow({
  label,
  description,
  used,
  value,
  onChange,
}: {
  label: string;
  description: string;
  used?: number;
  value: number;
  onChange: (v: number) => void;
}) {
  function bump(delta: number) {
    onChange(Math.max(1, value + delta));
  }
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0 flex-1">
        <Label>{label}</Label>
        <p className="text-xs text-slate-500">{description}</p>
        <p className="text-[11px] font-medium text-slate-400">
          Used: {used ?? 0}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => bump(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-violet-300 hover:text-violet-600"
          aria-label="Decrease"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <Input
          type="number"
          className="w-24 text-center"
          value={value}
          onChange={(e) =>
            onChange(Math.max(1, Number(e.target.value) || 1))
          }
        />
        <button
          type="button"
          onClick={() => bump(1)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-violet-300 hover:text-violet-600"
          aria-label="Increase"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function UsageRow({
  label,
  used,
  max,
}: {
  label: string;
  used: number;
  max: number;
}) {
  const pct = max > 0 ? Math.min(100, (used / max) * 100) : 0;
  const tone = pct >= 90 ? "bg-rose-500" : pct >= 75 ? "bg-amber-500" : "bg-violet-500";
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="font-mono text-slate-500">
          {used} <span className="text-slate-300">/</span> {max}
        </span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-slate-100">
        <div
          className={`h-2 rounded-full transition-all ${tone}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
