"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";

interface FormState {
  name: string;
  lrCode: string;
  address: string;
  gstNumber: string;
  contactPhone: string;
  adminName: string;
  adminMobile: string;
  maxBranches: string;
  maxDrivers: string;
  maxLrPerMonth: string;
}

const INITIAL: FormState = {
  name: "",
  lrCode: "",
  address: "",
  gstNumber: "",
  contactPhone: "",
  adminName: "",
  adminMobile: "",
  maxBranches: "5",
  maxDrivers: "50",
  maxLrPerMonth: "200",
};

export function AddCompanyButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<FormState>(INITIAL);

  function update<K extends keyof FormState>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;

    const lrCode = form.lrCode.toUpperCase().trim();
    const adminMobile = form.adminMobile.replace(/\D/g, "");
    if (!/^[A-Z]{2,8}$/.test(lrCode)) {
      toast.error("LR code must be 2-8 uppercase letters (e.g. RG, JKLG)");
      return;
    }
    if (!/^\d{10}$/.test(adminMobile)) {
      toast.error("Admin mobile must be a 10-digit number");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          address: form.address.trim(),
          gstNumber: form.gstNumber.trim(),
          lrCode,
          contactPhone: form.contactPhone.trim() || adminMobile,
          adminName: form.adminName.trim() || "Company Admin",
          adminMobile,
          maxBranches: Number(form.maxBranches) || 5,
          maxDrivers: Number(form.maxDrivers) || 50,
          maxLrPerMonth: Number(form.maxLrPerMonth) || 200,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.success) {
        toast.success("Company created — admin can log in via OTP");
        setForm(INITIAL);
        setOpen(false);
        router.refresh();
      } else {
        toast.error(data.error ?? "Failed to create company");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button
        className="bg-violet-600 hover:bg-violet-700"
        onClick={() => setOpen(true)}
      >
        <Plus className="mr-1 h-4 w-4" />
        Add Company
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 backdrop-blur sm:items-center">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b p-5">
              <div>
                <h2 className="text-lg font-bold">Onboard a new company</h2>
                <p className="text-xs text-slate-500">
                  Creates the company, default LR counter, and a company admin user.
                </p>
              </div>
              <button
                type="button"
                onClick={() => !busy && setOpen(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <Field label="Company Name *">
                <Input
                  required
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="Rayudu Group Logistics"
                />
              </Field>
              <Field label="LR Code * (used in LR numbers)">
                <Input
                  required
                  value={form.lrCode}
                  onChange={(e) => update("lrCode", e.target.value.toUpperCase())}
                  placeholder="RG"
                  maxLength={8}
                />
              </Field>
              <Field label="GST Number *">
                <Input
                  required
                  value={form.gstNumber}
                  onChange={(e) => update("gstNumber", e.target.value)}
                  placeholder="29AAAAA0000A1Z5"
                />
              </Field>
              <Field label="Contact Phone">
                <Input
                  value={form.contactPhone}
                  onChange={(e) => update("contactPhone", e.target.value)}
                  placeholder="Defaults to admin mobile"
                />
              </Field>
              <Field label="Address *" full>
                <Input
                  required
                  value={form.address}
                  onChange={(e) => update("address", e.target.value)}
                  placeholder="Plot 12, Hyderabad, Telangana"
                />
              </Field>
              <Field label="Admin Name">
                <Input
                  value={form.adminName}
                  onChange={(e) => update("adminName", e.target.value)}
                  placeholder="Company Admin"
                />
              </Field>
              <Field label="Admin Mobile (OTP login) *">
                <Input
                  required
                  value={form.adminMobile}
                  onChange={(e) => update("adminMobile", e.target.value)}
                  placeholder="9876543210"
                  maxLength={10}
                />
              </Field>
              <Field label="Max Branches">
                <Input
                  type="number"
                  min={1}
                  value={form.maxBranches}
                  onChange={(e) => update("maxBranches", e.target.value)}
                />
              </Field>
              <Field label="Max Drivers">
                <Input
                  type="number"
                  min={1}
                  value={form.maxDrivers}
                  onChange={(e) => update("maxDrivers", e.target.value)}
                />
              </Field>
              <Field label="Max LRs per Month" full>
                <Input
                  type="number"
                  min={1}
                  value={form.maxLrPerMonth}
                  onChange={(e) => update("maxLrPerMonth", e.target.value)}
                />
              </Field>
            </div>

            <div className="flex items-center justify-end gap-3 border-t bg-slate-50 p-5">
              <Button
                type="button"
                variant="outline"
                onClick={() => !busy && setOpen(false)}
                disabled={busy}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-violet-600 hover:bg-violet-700"
                disabled={busy}
              >
                {busy ? "Creating…" : "Create Company"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

function Field({
  label,
  full,
  children,
}: {
  label: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={full ? "sm:col-span-2" : undefined}>
      <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
