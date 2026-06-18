import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { formatCurrency } from "@/lib/services/lr-service";
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

const BRAND_PRIMARY = rgb(0.42, 0.27, 0.76);
const BRAND_INK = rgb(0.06, 0.09, 0.16);
const BRAND_MUTED = rgb(0.45, 0.5, 0.6);

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
  const branchIdRaw = url.searchParams.get("branchId");
  const branchId = branchIdRaw && branchIdRaw !== "all" ? branchIdRaw : undefined;

  const [company, lrs] = await Promise.all([
    prisma.company.findUnique({ where: { id: companyId } }),
    prisma.lRRequest.findMany({
      where: {
        companyId,
        createdAt: { gte: from, lte: to },
        ...(status ? { status } : {}),
        ...(paymentMode ? { paymentMode } : {}),
        ...(branchId ? { branchId } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { driver: true, branch: true },
    }),
  ]);

  const totalCount = lrs.length;
  const freightTotal = lrs.reduce(
    (s, lr) => s + Number(lr.freightAmount.toString()),
    0,
  );
  const approved = lrs.filter(
    (lr) =>
      lr.status === "approved" ||
      lr.status === "in_transit" ||
      lr.status === "delivered",
  ).length;
  const rejected = lrs.filter((lr) => lr.status === "rejected").length;
  const decided = approved + rejected;
  const approvalRate = decided > 0 ? (approved / decided) * 100 : 0;

  const pdf = await PDFDocument.create();
  pdf.setTitle("LR Report");
  pdf.setAuthor(company?.name ?? "RonoHub");
  pdf.setProducer("RonoHub");

  const fontRegular = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 40;

  let page = pdf.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const drawText = (
    text: string,
    options: {
      x: number;
      y: number;
      size?: number;
      bold?: boolean;
      color?: import("pdf-lib").RGB;
    },
  ) => {
    page.drawText(text, {
      x: options.x,
      y: options.y,
      size: options.size ?? 10,
      font: options.bold ? fontBold : fontRegular,
      color: options.color ?? BRAND_INK,
    });
  };

  // Header
  page.drawRectangle({
    x: 0,
    y: pageHeight - 70,
    width: pageWidth,
    height: 70,
    color: BRAND_PRIMARY,
  });
  drawText("LR Report", {
    x: margin,
    y: pageHeight - 40,
    size: 18,
    bold: true,
    color: rgb(1, 1, 1),
  });
  drawText(company?.name ?? "Company", {
    x: margin,
    y: pageHeight - 58,
    size: 11,
    color: rgb(0.9, 0.9, 1),
  });
  drawText(
    `${from.toLocaleDateString("en-IN")} – ${to.toLocaleDateString("en-IN")}`,
    {
      x: pageWidth - margin - 180,
      y: pageHeight - 40,
      size: 11,
      color: rgb(1, 1, 1),
    },
  );

  y = pageHeight - 100;

  // Filters block
  const filterParts: string[] = [];
  if (status) filterParts.push(`status=${status}`);
  if (paymentMode) filterParts.push(`payment=${PAYMENT_LABELS[paymentMode]}`);
  if (branchId) filterParts.push(`branchId=${branchId}`);
  drawText(`Filters: ${filterParts.length ? filterParts.join(" · ") : "none"}`, {
    x: margin,
    y,
    size: 9,
    color: BRAND_MUTED,
  });
  y -= 20;

  // KPIs
  const kpis = [
    { label: "Total LRs", value: totalCount.toLocaleString("en-IN") },
    { label: "Total Freight", value: formatCurrency(freightTotal) },
    { label: "Approval Rate", value: `${approvalRate.toFixed(1)}%` },
    { label: "Rejected", value: rejected.toLocaleString("en-IN") },
  ];
  const kpiWidth = (pageWidth - margin * 2 - 18) / 4;
  kpis.forEach((kpi, i) => {
    const x = margin + i * (kpiWidth + 6);
    page.drawRectangle({
      x,
      y: y - 50,
      width: kpiWidth,
      height: 50,
      borderColor: rgb(0.85, 0.86, 0.92),
      borderWidth: 1,
      color: rgb(0.98, 0.98, 1),
    });
    drawText(kpi.label.toUpperCase(), {
      x: x + 10,
      y: y - 18,
      size: 8,
      color: BRAND_MUTED,
      bold: true,
    });
    drawText(kpi.value, {
      x: x + 10,
      y: y - 38,
      size: 14,
      bold: true,
      color: BRAND_PRIMARY,
    });
  });
  y -= 70;

  // Table header
  drawText("Lorry Receipts", {
    x: margin,
    y,
    size: 12,
    bold: true,
  });
  y -= 12;

  const cols = [
    { label: "LR No.", w: 90 },
    { label: "Date", w: 60 },
    { label: "Route", w: 130 },
    { label: "Driver", w: 90 },
    { label: "Status", w: 60 },
    { label: "Freight", w: 70 },
  ];

  const drawRow = (cells: string[], yPos: number, opts?: { header?: boolean }) => {
    let x = margin;
    if (opts?.header) {
      page.drawRectangle({
        x: margin,
        y: yPos - 14,
        width: pageWidth - margin * 2,
        height: 16,
        color: rgb(0.95, 0.92, 1),
      });
    }
    cells.forEach((cell, i) => {
      drawText(cell, {
        x: x + 4,
        y: yPos - 11,
        size: 9,
        bold: opts?.header,
        color: opts?.header ? BRAND_PRIMARY : BRAND_INK,
      });
      x += cols[i].w;
    });
  };

  const truncate = (s: string, max: number) =>
    s.length <= max ? s : s.slice(0, Math.max(0, max - 1)) + "…";

  drawRow(
    cols.map((c) => c.label),
    y,
    { header: true },
  );
  y -= 18;

  for (const lr of lrs) {
    if (y < margin + 30) {
      page = pdf.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
    drawRow(
      [
        truncate(lr.lrNumber ?? lr.trackingId, 12),
        lr.createdAt.toISOString().slice(5, 10),
        truncate(`${lr.originCity} → ${lr.destinationCity}`, 22),
        truncate(lr.driver.name, 14),
        lr.status,
        formatCurrency(Number(lr.freightAmount.toString())),
      ],
      y,
    );
    y -= 14;
  }

  drawText(
    `Generated ${new Date().toLocaleString("en-IN")}  ·  RonoHub LR System`,
    {
      x: margin,
      y: 24,
      size: 8,
      color: BRAND_MUTED,
    },
  );

  const bytes = await pdf.save();
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="lr-report-${from.toISOString().slice(0, 10)}_${to.toISOString().slice(0, 10)}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
