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
  executiveCount?: number;
  lrsThisMonth?: number;
}

export default function CompanyDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [limits, setLimits] = useState({
    maxBranches: 10,
    maxExecutives: 150,
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
        maxExecutives: data.data.maxExecutives,
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

  const onboardedDate = new Date(company.createdAt).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="p-6 md:p-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[#9ca3af]">
        <Link href="/super-admin/companies" className="hover:text-[#7b4fd4] transition font-semibold">Companies</Link>
        <span>/</span>
        <span className="font-bold text-[#2d2d4e]">{company.name}</span>
        <Link
          href="/super-admin/companies"
          className="ml-auto inline-flex items-center gap-1 text-sm font-medium text-slate-500 transition hover:text-slate-900"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Companies
        </Link>
      </div>

      {/* Company Banner */}
      <div className="mt-4 rounded-2xl border-0 bg-gradient-to-r from-[#f0ebfc] to-[#ebf5fd] p-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#7b4fd4] text-xs font-bold text-white">
            {company.lrCode}
          </span>
          <div>
            <h2 className="text-lg font-extrabold text-[#2d2d4e]">{company.name}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-4 text-xs font-semibold text-[#6b7280]">
              <span>Code: <span className="font-bold text-[#2d2d4e]">{company.lrCode}</span></span>
              <span>GST: <span className="font-mono font-bold text-[#2d2d4e]">{company.gstNumber}</span></span>
              <span>{company.contactPhone}</span>
              <span>Onboarded: {onboardedDate}</span>
            </div>
          </div>
          <span
            className={`ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
              company.status === "active"
                ? "bg-[#e8f8f0] text-[#2ecc71]"
                : "bg-[#fdedec] text-[#e74c3c]"
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
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border-0 bg-white p-6 shadow-sm">
            <h3 className="font-bold text-[#2d2d4e]">Platform Limits</h3>
            <p className="text-sm font-semibold text-[#6b7280]">
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
                label="Max Executives"
                description="Total executives across all branches"
                used={company.executiveCount}
                value={limits.maxExecutives}
                onChange={(v) => setLimits({ ...limits, maxExecutives: v })}
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
              >
                {savingLimits ? "Saving…" : "Save Limits"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setLimits({
                    maxBranches: company.maxBranches,
                    maxExecutives: company.maxExecutives,
                    maxLrPerMonth: company.maxLrPerMonth,
                  });
                }}
              >
                Reset
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border-0 bg-white p-6 shadow-sm">
            <h3 className="font-bold text-[#2d2d4e]">Company Information</h3>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label="Company Name" value={company.name} />
              <Field label="LR Code" value={company.lrCode} />
              <Field label="GST Number" value={company.gstNumber} />
              <Field label="Contact Phone" value={company.contactPhone} />
              <div className="sm:col-span-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#9ca3af]">
                  Address
                </p>
                <p className="mt-1 text-sm font-semibold text-[#2d2d4e]">{company.address}</p>
              </div>
            </dl>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border-0 bg-white p-6 shadow-sm">
            <h3 className="font-bold text-[#2d2d4e]">Usage This Month</h3>
            <div className="mt-4 space-y-4 text-sm">
              <UsageRow
                label="Branches"
                used={company.branchCount ?? 0}
                max={company.maxBranches}
              />
              <UsageRow
                label="Executives"
                used={company.executiveCount ?? 0}
                max={company.maxExecutives}
              />
              <UsageRow
                label="LRs Issued"
                used={company.lrsThisMonth ?? 0}
                max={company.maxLrPerMonth}
              />
            </div>
          </div>

          <div className="rounded-2xl border-0 bg-white p-6 shadow-sm">
            <p className="font-bold text-[#2d2d4e]">Platform Access</p>
            <p className="mt-1 text-sm font-semibold text-[#6b7280]">
              {company.status === "active"
                ? "All executives and the company admin can sign in."
                : "All executives and the company admin are blocked from signing in."}
            </p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wide text-[#6b7280]">
                {company.status === "active" ? "Active" : "Suspended"}
              </span>
              <Switch
                checked={company.status === "active"}
                disabled={togglingStatus}
                onCheckedChange={toggleStatus}
              />
            </div>
          </div>

          <div className="rounded-2xl border-0 bg-[#fdedec] p-6 shadow-sm">
            <p className="font-bold text-[#e74c3c]">Suspend Company Access</p>
            <p className="mt-2 text-xs font-semibold leading-relaxed text-[#2d2d4e]">
              Suspending will immediately block all executives and the company
              admin from logging in. All LR data is preserved. You can
              reactivate the company at any time from this page.
            </p>
            <button
              type="button"
              onClick={toggleStatus}
              disabled={togglingStatus}
              className={`mt-4 w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition disabled:opacity-60 ${
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
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e8edf5] text-[#6b7280] transition hover:border-[#7b4fd4] hover:text-[#7b4fd4]"
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
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e8edf5] text-[#6b7280] transition hover:border-[#7b4fd4] hover:text-[#7b4fd4]"
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
  const tone = pct >= 90 ? "bg-[#e74c3c]" : pct >= 75 ? "bg-[#f5a623]" : "bg-gradient-to-r from-[#7b4fd4] to-[#3b9fe8]";
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
