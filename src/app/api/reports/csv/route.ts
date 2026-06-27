import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import type { LRStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

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

function escapeCsv(value: string | number | null | undefined) {
  if (value == null) return "";
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.companyId || session.role !== "company_admin") {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 },
    );
  }
  const companyId = session.companyId;
  const url = new URL(req.url);

  const today = new Date();
  const defaultFrom = new Date(today.getFullYear(), today.getMonth(), 1);
  const defaultTo = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const fromStr = url.searchParams.get("from");
  const toStr = url.searchParams.get("to");
  const from = fromStr ? new Date(fromStr) : defaultFrom;
  const to = toStr ? new Date(toStr) : defaultTo;
  to.setHours(23, 59, 59, 999);

  const status = STATUS_VALUES.includes(url.searchParams.get("status") as LRStatus)
    ? (url.searchParams.get("status") as LRStatus)
    : undefined;
  const paymentMode = PAYMENT_VALUES.includes(
    url.searchParams.get("paymentMode") as (typeof PAYMENT_VALUES)[number],
  )
    ? (url.searchParams.get("paymentMode") as (typeof PAYMENT_VALUES)[number])
    : undefined;
  const branchId = url.searchParams.get("branchId");

  const lrs = await prisma.lRRequest.findMany({
    where: {
      companyId,
      createdAt: { gte: from, lte: to },
      ...(status ? { status } : {}),
      ...(paymentMode ? { paymentMode } : {}),
      ...(branchId && branchId !== "all" ? { branchId } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: { executive: true, branch: true },
  });

  const headers = [
    "LR Number",
    "Tracking ID",
    "Date",
    "Status",
    "Branch",
    "Executive",
    "Executive Mobile",
    "Vehicle",
    "Origin",
    "Destination",
    "Consignor",
    "Consignee",
    "Consignee Phone",
    "Goods",
    "Packages",
    "Weight (kg)",
    "Declared Value",
    "Freight",
    "Payment Mode",
  ];

  const rows = lrs.map((lr) => [
    lr.lrNumber ?? lr.trackingId,
    lr.trackingId,
    lr.createdAt.toISOString().slice(0, 10),
    lr.status,
    `${lr.branch.name} · ${lr.branch.city}`,
    lr.executive.name,
    `+91 ${lr.executive.mobile}`,
    lr.vehicleNumber,
    lr.originCity,
    lr.destinationCity,
    lr.consignorName,
    lr.consigneeName,
    `+91 ${lr.consigneePhone}`,
    lr.goodsDescription,
    lr.noOfPackages,
    Number(lr.weightKg.toString()),
    Number(lr.declaredValue.toString()),
    Number(lr.freightAmount.toString()),
    PAYMENT_LABELS[lr.paymentMode] ?? lr.paymentMode,
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map(escapeCsv).join(","))
    .join("\r\n");

  const fileName = `lr-report-${from.toISOString().slice(0, 10)}_${to
    .toISOString()
    .slice(0, 10)}.csv`;

  return new NextResponse("\uFEFF" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
