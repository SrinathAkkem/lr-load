"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { StatusBadge, formatINR } from "@/components/rono/status-badge";
import { Input } from "@/components/ui/input";
import type { LRRequest, LRStatus } from "@/lib/types";
import { Search } from "lucide-react";

type EnrichedLR = LRRequest & {
  driver?: { name: string };
  branch?: { name: string };
};

const FILTERS: ReadonlyArray<{ key: "all" | LRStatus; label: string }> = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "in_transit", label: "In Transit" },
  { key: "delivered", label: "Delivered" },
];

export default function CompanyLRPage() {
  const [lrs, setLrs] = useState<EnrichedLR[]>([]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const id = setTimeout(async () => {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== "all") params.set("status", filter);
      if (search.trim()) params.set("search", search.trim());
      const res = await fetch(`/api/lr?${params}`);
      const data = await res.json();
      if (!cancelled && data.success) setLrs(data.data);
      if (!cancelled) setLoading(false);
    }, 150);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [filter, search]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: lrs.length };
    for (const lr of lrs) {
      map[lr.status] = (map[lr.status] ?? 0) + 1;
    }
    return map;
  }, [lrs]);

  return (
    <div className="p-6 md:p-8">
      <p className="text-sm text-slate-500">
        Approve or reject driver-submitted lorry receipts.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition ${
              filter === f.key
                ? "bg-violet-600 text-white shadow"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-violet-300"
            }`}
          >
            <span>{f.label}</span>
            {filter !== f.key && counts[f.key] != null && (
              <span className="rounded-full bg-slate-100 px-1.5 text-xs font-semibold text-slate-600">
                {counts[f.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="relative mt-4 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Search by LR number, route, driver, consignee..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="border-b bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="p-4">LR Number</th>
                <th className="p-4">Route</th>
                <th className="p-4">Driver</th>
                <th className="p-4">Branch</th>
                <th className="p-4">Freight</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && lrs.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="p-10 text-center text-sm text-slate-400"
                  >
                    Loading…
                  </td>
                </tr>
              ) : lrs.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="p-10 text-center text-sm text-slate-400"
                  >
                    No LRs match your filters.
                  </td>
                </tr>
              ) : (
                lrs.map((lr) => (
                  <tr
                    key={lr.id}
                    className="border-b last:border-b-0 hover:bg-slate-50"
                  >
                    <td className="p-4">
                      <Link
                        href={`/company/lr/${lr.id}`}
                        className="font-semibold text-violet-700 hover:underline"
                      >
                        {lr.trackingId}
                      </Link>
                    </td>
                    <td className="p-4">
                      {lr.originCity} → {lr.destinationCity}
                    </td>
                    <td className="p-4">{lr.driver?.name ?? "—"}</td>
                    <td className="p-4 text-slate-500">
                      {lr.branch?.name ?? "—"}
                    </td>
                    <td className="p-4 font-medium">
                      {formatINR(lr.freightAmount)}
                    </td>
                    <td className="p-4">
                      <StatusBadge status={lr.status} />
                    </td>
                    <td className="p-4 text-right">
                      <Link
                        href={`/company/lr/${lr.id}`}
                        className="text-sm font-semibold text-violet-600 hover:underline"
                      >
                        Open →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
