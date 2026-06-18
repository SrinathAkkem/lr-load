import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { formatCurrency } from "@/lib/services/lr-service";
import { prisma } from "@/lib/db/prisma";
import { ReportsFilters } from "./filters";
import type { LRStatus } from "@/lib/types";
import { Download, FileSpreadsheet } from "lucide-react";

export const dynamic = "force-dynamic";

interface SearchParams {
  from?: string;
  to?: string;
  status?: string;
  paymentMode?: string;
  branchId?: string;
}

const STATUS_VALUES: LRStatus[] = [
  "pending",
  "approved",
  "rejected",
  "in_transit",
  "delivered",
];

const PAYMENT_VALUES = ["TO_PAY", "PAID", "TO_BE_BILLED"] as const;
const PAYMENT_LABELS: Record<string, string> = {
  TO_PAY: "To Pay",
  PAID: "Paid",
  TO_BE_BILLED: "To Be Billed",
};

function parseDate(s: string | undefined, fallback: Date) {
  if (!s) return fallback;
  const d = new Date(s);
  return isNaN(d.getTime()) ? fallback : d;
}

export default async function CompanyReportsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await getSession();
  if (!session?.companyId) redirect("/company/login");
  const companyId = session.companyId;

  const params = await searchParams;
  const today = new Date();
  const defaultFrom = new Date(today.getFullYear(), today.getMonth(), 1);
  const defaultTo = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const from = parseDate(params.from, defaultFrom);
  const toRaw = parseDate(params.to, defaultTo);
  const to = new Date(toRaw);
  to.setHours(23, 59, 59, 999);

  const status = STATUS_VALUES.includes(params.status as LRStatus)
    ? (params.status as LRStatus)
    : undefined;
  const paymentMode = PAYMENT_VALUES.includes(
    params.paymentMode as (typeof PAYMENT_VALUES)[number],
  )
    ? (params.paymentMode as (typeof PAYMENT_VALUES)[number])
    : undefined;
  const branchId = params.branchId && params.branchId !== "all"
    ? params.branchId
    : undefined;

  const where = {
    companyId,
    createdAt: { gte: from, lte: to },
    ...(status ? { status } : {}),
    ...(paymentMode ? { paymentMode } : {}),
    ...(branchId ? { branchId } : {}),
  };

  const [branches, lrs] = await Promise.all([
    prisma.branch.findMany({
      where: { companyId },
      orderBy: { name: "asc" },
      select: { id: true, name: true, city: true },
    }),
    prisma.lRRequest.findMany({
      where,
      select: {
        status: true,
        paymentMode: true,
        freightAmount: true,
        originCity: true,
        destinationCity: true,
      },
    }),
  ]);

  const totalCount = lrs.length;
  const freightTotal = lrs.reduce(
    (s, lr) => s + Number(lr.freightAmount.toString()),
    0,
  );
  const approved = lrs.filter(
    (lr) => lr.status === "approved" || lr.status === "in_transit" || lr.status === "delivered",
  ).length;
  const rejected = lrs.filter((lr) => lr.status === "rejected").length;
  const decided = approved + rejected;
  const approvalRate = decided > 0 ? (approved / decided) * 100 : 0;

  const sumFreight = (mode: (typeof PAYMENT_VALUES)[number]) =>
    lrs.filter((lr) => lr.paymentMode === mode).reduce(
      (s, lr) => s + Number(lr.freightAmount.toString()),
      0,
    );

  const paymentBreakdown = PAYMENT_VALUES.map((mode) => ({
    mode,
    label: PAYMENT_LABELS[mode],
    count: lrs.filter((lr) => lr.paymentMode === mode).length,
    total: sumFreight(mode),
  }));

  const routeMap = new Map<string, { count: number; freight: number }>();
  for (const lr of lrs) {
    const key = `${lr.originCity} → ${lr.destinationCity}`;
    const existing = routeMap.get(key) ?? { count: 0, freight: 0 };
    existing.count += 1;
    existing.freight += Number(lr.freightAmount.toString());
    routeMap.set(key, existing);
  }
  const topRoutes = [...routeMap.entries()]
    .map(([route, data]) => ({ route, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const exportQuery = new URLSearchParams();
  exportQuery.set("from", from.toISOString().slice(0, 10));
  exportQuery.set("to", toRaw.toISOString().slice(0, 10));
  if (status) exportQuery.set("status", status);
  if (paymentMode) exportQuery.set("paymentMode", paymentMode);
  if (branchId) exportQuery.set("branchId", branchId);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-slate-500">
            {from.toLocaleDateString("en-IN")} — {toRaw.toLocaleDateString("en-IN")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={`/api/reports/csv?${exportQuery.toString()}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-violet-300 hover:text-violet-700"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Export CSV
          </a>
          <a
            href={`/api/reports/pdf?${exportQuery.toString()}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
          >
            <Download className="h-3.5 w-3.5" />
            Export PDF
          </a>
        </div>
      </div>

      <ReportsFilters
        branches={branches}
        initial={{
          from: from.toISOString().slice(0, 10),
          to: toRaw.toISOString().slice(0, 10),
          status: status ?? "all",
          paymentMode: paymentMode ?? "all",
          branchId: branchId ?? "all",
        }}
      />

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <Kpi label="Total LRs" value={totalCount.toLocaleString("en-IN")} tone="blue" />
        <Kpi label="Total Freight" value={formatCurrency(freightTotal)} tone="emerald" />
        <Kpi
          label="Approval Rate"
          value={`${approvalRate.toFixed(1)}%`}
          tone="violet"
        />
        <Kpi label="Rejected" value={rejected.toLocaleString("en-IN")} tone="red" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="font-semibold">Top Routes</h2>
          {topRoutes.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No data for this filter.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {topRoutes.map((r, i) => (
                <div key={r.route} className="flex items-center gap-3 text-sm">
                  <span className="w-6 font-bold text-slate-400">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium">{r.route}</p>
                    <div className="mt-1 h-2 rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-violet-500"
                        style={{
                          width: `${(r.count / (topRoutes[0]?.count || 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{r.count}</p>
                    <p className="text-xs text-slate-500">
                      {formatCurrency(r.freight)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="font-semibold">Freight by Payment Mode</h2>
          <div className="mt-4 grid gap-3">
            {paymentBreakdown.map((p) => (
              <div
                key={p.mode}
                className="flex items-center justify-between rounded-xl border border-slate-100 p-4"
              >
                <div>
                  <p className="font-semibold">{p.label}</p>
                  <p className="text-xs text-slate-500">{p.count} LRs</p>
                </div>
                <p className="text-lg font-bold text-violet-700">
                  {formatCurrency(p.total)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "blue" | "emerald" | "violet" | "red";
}) {
  const map = {
    blue: "text-blue-600",
    emerald: "text-emerald-600",
    violet: "text-violet-600",
    red: "text-red-600",
  };
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${map[tone]}`}>{value}</p>
    </div>
  );
}
