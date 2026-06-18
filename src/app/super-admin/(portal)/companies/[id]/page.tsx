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

export default function CompanyDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [company, setCompany] = useState<Company & { branchCount?: number; driverCount?: number; lrsThisMonth?: number } | null>(null);
  const [limits, setLimits] = useState({ maxBranches: 10, maxDrivers: 150, maxLrPerMonth: 500 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/companies/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setCompany(data.data);
          setLimits({
            maxBranches: data.data.maxBranches,
            maxDrivers: data.data.maxDrivers,
            maxLrPerMonth: data.data.maxLrPerMonth,
          });
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function saveLimits() {
    const res = await fetch(`/api/companies/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(limits),
    });
    const data = await res.json();
    if (data.success) {
      toast.success("Limits saved");
      setCompany(data.data);
    } else {
      toast.error(data.error);
    }
  }

  async function toggleStatus() {
    const newStatus = company?.status === "active" ? "suspended" : "active";
    const res = await fetch(`/api/companies/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    const data = await res.json();
    if (data.success) {
      toast.success(`Company ${newStatus}`);
      setCompany(data.data);
    }
  }

  if (loading) return <div className="p-8">Loading...</div>;
  if (!company) return <div className="p-8">Company not found</div>;

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">
            <Link href="/super-admin/companies" className="hover:underline">
              Companies
            </Link>{" "}
            / {company.name}
          </p>
          <h1 className="text-2xl font-bold">{company.name}</h1>
        </div>
        <Link href="/super-admin/companies">
          <Button variant="outline">← Back to Companies</Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="font-semibold">Platform Limits</h2>
          <p className="text-sm text-slate-500">Changes take effect immediately</p>
          <div className="mt-6 space-y-4">
            {[
              { key: "maxBranches" as const, label: "Max Branches", used: company.branchCount },
              { key: "maxDrivers" as const, label: "Max Drivers", used: company.driverCount },
              { key: "maxLrPerMonth" as const, label: "Max LRs per Month", used: company.lrsThisMonth },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between gap-4">
                <div>
                  <Label>{item.label}</Label>
                  <p className="text-xs text-slate-500">Used: {item.used ?? 0}</p>
                </div>
                <Input
                  type="number"
                  className="w-24"
                  value={limits[item.key]}
                  onChange={(e) =>
                    setLimits({ ...limits, [item.key]: Number(e.target.value) })
                  }
                />
              </div>
            ))}
          </div>
          <Button onClick={saveLimits} className="mt-6 w-full bg-violet-600 hover:bg-violet-700">
            Save Limits
          </Button>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="font-semibold">Company Information</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div><dt className="text-slate-500">GST</dt><dd>{company.gstNumber}</dd></div>
              <div><dt className="text-slate-500">Contact</dt><dd>{company.contactPhone}</dd></div>
              <div><dt className="text-slate-500">Address</dt><dd>{company.address}</dd></div>
            </dl>
          </div>

          <div className="flex items-center justify-between rounded-2xl border bg-white p-6 shadow-sm">
            <div>
              <p className="font-semibold">Platform Access</p>
              <p className="text-sm text-slate-500">
                {company.status === "active" ? "Active" : "Suspended"}
              </p>
            </div>
            <Switch
              checked={company.status === "active"}
              onCheckedChange={toggleStatus}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
