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
  maxExecutives: string;
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
  maxExecutives: "50",
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
          maxExecutives: Number(form.maxExecutives) || 50,
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
       
        onClick={() => setOpen(true)}
      >
        <Plus className="mr-1 h-4 w-4" />
        Add Company
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 backdrop-blur sm:items-center sm:p-4">
          <form
            onSubmit={handleSubmit}
            className="flex max-h-[92vh] w-full max-w-2xl flex-col rounded-t-2xl bg-white shadow-2xl sm:max-h-[85vh] sm:rounded-2xl"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-[#e8edf5] p-4 sm:p-5">
              <div>
                <h2 className="text-base font-extrabold text-[#2d2d4e] sm:text-lg">Onboard a new company</h2>
                <p className="text-xs font-semibold text-[#6b7280]">
                  Creates the company, default LR counter, and a company admin user.
                </p>
              </div>
              <button
                type="button"
                onClick={() => !busy && setOpen(false)}
                className="rounded-full p-1 text-[#6b7280] hover:bg-[#fafbff] hover:text-[#2d2d4e]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid flex-1 gap-4 overflow-y-auto p-4 sm:grid-cols-2 sm:p-5">
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
              <Field label="Max Executives">
                <Input
                  type="number"
                  min={1}
                  value={form.maxExecutives}
                  onChange={(e) => update("maxExecutives", e.target.value)}
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

            <div className="flex shrink-0 items-center justify-end gap-3 border-t border-[#e8edf5] bg-[#fafbff] p-4 sm:p-5">
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
