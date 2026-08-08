"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DateRangePicker } from "@/components/rono/date-range-picker";
import { FilterDropdown } from "@/components/rono/filter-dropdown";

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
  { value: "all", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "in_transit", label: "In Transit" },
  { value: "delivered", label: "Delivered" },
  { value: "rejected", label: "Rejected" },
];

const PAYMENT_OPTIONS = [
  { value: "all", label: "All Modes" },
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
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [status, setStatus] = useState(initial.status);
  const [paymentMode, setPaymentMode] = useState(initial.paymentMode);
  const [branchId, setBranchId] = useState(initial.branchId);

  const branchOptions = [
    { value: "all", label: "All Branches" },
    ...branches.map((b) => ({ value: b.id, label: `${b.name} · ${b.city}` })),
  ];

  function applyFilters() {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (status !== "all") params.set("status", status);
    if (paymentMode !== "all") params.set("paymentMode", paymentMode);
    if (branchId !== "all") params.set("branchId", branchId);
    router.push(`/company/reports?${params.toString()}`);
  }

  function resetFilters() {
    setFrom(initial.from);
    setTo(initial.to);
    setStatus("all");
    setPaymentMode("all");
    setBranchId("all");
    router.push("/company/reports");
  }

  return (
    <div className="mt-5 flex flex-wrap items-center gap-2.5">
      <DateRangePicker
        variant="outline"
        from={from}
        to={to}
        onChange={(f, t) => {
          setFrom(f);
          setTo(t);
        }}
      />
      <FilterDropdown
        label="Status"
        value={status}
        options={STATUS_OPTIONS}
        onChange={setStatus}
      />
      <FilterDropdown
        label="Payment Mode"
        value={paymentMode}
        options={PAYMENT_OPTIONS}
        onChange={setPaymentMode}
      />
      <FilterDropdown
        label="Branch"
        value={branchId}
        options={branchOptions}
        onChange={setBranchId}
      />
      <button
        type="button"
        onClick={applyFilters}
        className="h-10 rounded-lg bg-[#5E3EA1] px-4 text-xs font-semibold text-white transition hover:opacity-90"
      >
        Apply
      </button>
      <button
        type="button"
        onClick={resetFilters}
        className="h-10 rounded-lg px-3 text-xs font-semibold text-[#4D4D4D] transition hover:text-black"
      >
        Reset
      </button>
    </div>
  );
}
