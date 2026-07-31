"use client";

import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface Branch {
  id: string;
  name: string;
  city: string;
}

interface Initial {
  from: string;
  to: string;
  status: string;
  paymentMode: string;
  branchId: string;
}

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "in_transit", label: "In Transit" },
  { value: "delivered", label: "Delivered" },
  { value: "rejected", label: "Rejected" },
];

const PAYMENT_OPTIONS = [
  { value: "all", label: "All modes" },
  { value: "TO_PAY", label: "To Pay" },
  { value: "PAID", label: "Paid" },
  { value: "TO_BE_BILLED", label: "To Be Billed" },
];

export function ReportsFilters({
  branches,
  initial,
}: {
  branches: Branch[];
  initial: Initial;
}) {
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const params = new URLSearchParams();
    const from = String(data.get("from") ?? "");
    const to = String(data.get("to") ?? "");
    const status = String(data.get("status") ?? "all");
    const paymentMode = String(data.get("paymentMode") ?? "all");
    const branchId = String(data.get("branchId") ?? "all");
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (status !== "all") params.set("status", status);
    if (paymentMode !== "all") params.set("paymentMode", paymentMode);
    if (branchId !== "all") params.set("branchId", branchId);
    router.push(`/company/reports?${params.toString()}`);
  }

  function handleReset() {
    router.push("/company/reports");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 grid gap-3 rounded-2xl border-0 bg-white p-4 shadow-sm sm:grid-cols-2 md:grid-cols-6 md:p-5"
    >
      <FilterField label="From">
        <Input type="date" name="from" defaultValue={initial.from} />
      </FilterField>
      <FilterField label="To">
        <Input type="date" name="to" defaultValue={initial.to} />
      </FilterField>
      <FilterField label="Status">
        <Select name="status" defaultValue={initial.status} options={STATUS_OPTIONS} />
      </FilterField>
      <FilterField label="Payment">
        <Select
          name="paymentMode"
          defaultValue={initial.paymentMode}
          options={PAYMENT_OPTIONS}
        />
      </FilterField>
      <FilterField label="Branch">
        <Select
          name="branchId"
          defaultValue={initial.branchId}
          options={[
            { value: "all", label: "All branches" },
            ...branches.map((b) => ({
              value: b.id,
              label: `${b.name} · ${b.city}`,
            })),
          ]}
        />
      </FilterField>
      <div className="flex items-end gap-2 sm:col-span-2 md:col-span-1">
        <Button type="submit">
          Apply
        </Button>
        <Button type="button" variant="outline" onClick={handleReset}>
          Reset
        </Button>
      </div>
    </form>
  );
}

function FilterField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function Select({
  name,
  defaultValue,
  options,
}: {
  name: string;
  defaultValue: string;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      name={name}
      defaultValue={defaultValue}
      className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
