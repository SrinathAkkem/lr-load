import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "pdf-lib";
import { getAuthFromRequest, forbidden } from "@/lib/api/auth-middleware";
import { prisma } from "@/lib/db/prisma";
import { formatCurrency } from "@/lib/services/lr-service";
import { pdfText } from "@/lib/pdf/pdf-text";
import { loadImageBytes } from "@/lib/pdf/image-loader";
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

// Brand colors — kept in sync with src/lib/pdf/lr-pdf.ts so every PDF the
// platform generates (LR + reports) shares the same visual language.
const BRAND = {
  primary: rgb(0.369, 0.243, 0.631),
  accent: rgb(0.95, 0.92, 1),
  ink: rgb(0.06, 0.09, 0.16),
  muted: rgb(0.42, 0.45, 0.55),
  border: rgb(0.85, 0.86, 0.92),
  paper: rgb(1, 1, 1),
} as const;

const PAGE_SIZE: [number, number] = [595, 842]; // A4 portrait
const MARGIN = 34;

interface Ctx {
  pdf: PDFDocument;
  page: PDFPage;
  y: number;
  margin: number;
  width: number;
  height: number;
  contentW: number;
  helv: PDFFont;
  helvBold: PDFFont;
  pageNum: number;
}

const trimmed = (v: string | null | undefined) => (v && v.trim() ? v.trim() : null);

const STATUS_COLORS: Record<LRStatus, ReturnType<typeof rgb>> = {
  pending: rgb(0.96, 0.65, 0.14),
  approved: rgb(0.05, 0.6, 0.35),
  rejected: rgb(0.85, 0.2, 0.2),
  in_transit: rgb(0.14, 0.44, 0.87),
  delivered: rgb(0.369, 0.243, 0.631),
};
const STATUS_LABELS: Record<LRStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  in_transit: "In Transit",
  delivered: "Delivered",
};
const PAYMENT_COLORS: Record<string, ReturnType<typeof rgb>> = {
  TO_PAY: rgb(0.14, 0.44, 0.87),
  PAID: rgb(0.05, 0.6, 0.35),
  TO_BE_BILLED: rgb(0.9, 0.6, 0.1),
};

const TABLE_COLS = [
  { label: "LR No.", w: 0.15 },
  { label: "Date", w: 0.09 },
  { label: "Route", w: 0.22 },
  { label: "Executive", w: 0.16 },
  { label: "Status", w: 0.13 },
  { label: "Payment", w: 0.11 },
  { label: "Freight", w: 0.14 },
] as const;

export async function GET(req: NextRequest) {
  const session = await getAuthFromRequest(req);
  if (!session?.companyId || session.role !== "company_admin") {
    return forbidden();
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
      include: { executive: true, branch: true },
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

  const statusCounts = STATUS_VALUES.map((s) => ({
    status: s,
    count: lrs.filter((lr) => lr.status === s).length,
  }));
  const paymentBreakdown = PAYMENT_VALUES.map((mode) => ({
    mode,
    amount: lrs
      .filter((lr) => lr.paymentMode === mode)
      .reduce((s, lr) => s + Number(lr.freightAmount.toString()), 0),
  }));

  const pdf = await PDFDocument.create();
  pdf.setTitle("LR Report");
  pdf.setAuthor(company?.name ?? "RonoHub");
  pdf.setProducer("RonoHub");
  pdf.setCreator("RonoHub LR System");

  const helv = await pdf.embedFont(StandardFonts.Helvetica);
  const helvBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const logo = company?.logoUrl ? await loadImageBytes(company.logoUrl) : null;

  const [width, height] = PAGE_SIZE;
  const margin = MARGIN;

  const ctx: Ctx = {
    pdf,
    page: pdf.addPage(PAGE_SIZE),
    y: height - margin,
    margin,
    width,
    height,
    contentW: width - 2 * margin,
    helv,
    helvBold,
    pageNum: 1,
  };
  drawPageFooter(ctx);

  const filterParts: string[] = [];
  if (status) filterParts.push(`Status: ${status.replace("_", " ")}`);
  if (paymentMode) filterParts.push(`Payment: ${PAYMENT_LABELS[paymentMode]}`);
  if (branchId) {
    const branchName = lrs.find((lr) => lr.branchId === branchId)?.branch?.name;
    filterParts.push(`Branch: ${branchName ?? branchId}`);
  }

  await drawReportHeader(ctx, {
    company,
    logo,
    from,
    to,
    filters: filterParts,
    kpis: [
      { label: "Total LRs", value: totalCount.toLocaleString("en-IN") },
      { label: "Total Freight", value: formatCurrency(freightTotal) },
      { label: "Approval Rate", value: `${approvalRate.toFixed(1)}%` },
      { label: "Rejected", value: rejected.toLocaleString("en-IN") },
    ],
  });

  drawOverviewCharts(ctx, { statusCounts, paymentBreakdown, totalCount });

  drawTableHeaderRow(ctx);

  for (const lr of lrs) {
    // Gather every extra field actually present on this LR — never a fixed
    // subset — so nothing captured by the app is silently left out of the
    // report just because it doesn't fit the 7 primary columns above.
    const detailParts = [
      trimmed(lr.consignorName) && `Consignor: ${trimmed(lr.consignorName)}`,
      (trimmed(lr.consigneeCompany) || trimmed(lr.consigneeName)) &&
        `Consignee: ${trimmed(lr.consigneeCompany) ?? trimmed(lr.consigneeName)}`,
      lr.branch?.name && `Branch: ${lr.branch.name}`,
      `Weight: ${Number(lr.weightKg.toString())}kg`,
      `Pkgs: ${lr.noOfPackages}`,
      `Declared: ${formatCurrency(Number(lr.declaredValue.toString()))}`,
      trimmed(lr.invoiceNumber) && `Invoice: ${trimmed(lr.invoiceNumber)}`,
      trimmed(lr.workOrderNo) && `WO: ${trimmed(lr.workOrderNo)}`,
      trimmed(lr.driverName) && `Driver: ${trimmed(lr.driverName)}`,
      trimmed(lr.driverPhone) && `Driver Ph: ${trimmed(lr.driverPhone)}`,
      trimmed(lr.drivingLicenseNumber) && `License: ${trimmed(lr.drivingLicenseNumber)}`,
      trimmed(lr.insurance) && `Insurance: ${trimmed(lr.insurance)}`,
      trimmed(lr.loadingPoint) && `Loading: ${trimmed(lr.loadingPoint)}`,
      trimmed(lr.unloadingPoint) && `Unloading: ${trimmed(lr.unloadingPoint)}`,
      lr.vehicleNumber && `Vehicle: ${lr.vehicleNumber}`,
    ].filter((v): v is string => Boolean(v));

    const detailLines = wrap(detailParts.join("   ·   "), ctx.contentW - 8, ctx.helv, 6.5).slice(0, 2);
    const rowH = 16 + detailLines.length * 9 + 10;

    if (ctx.y - rowH < margin + 20) {
      ctx.page = pdf.addPage(PAGE_SIZE);
      ctx.pageNum += 1;
      ctx.y = height - margin;
      drawPageFooter(ctx);
      drawContinuationHeader(ctx, company?.name ?? "Company");
      drawTableHeaderRow(ctx);
    }

    drawRow(
      ctx,
      [
        truncate(lr.lrNumber ?? lr.trackingId, 16),
        lr.createdAt.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
        truncate(`${lr.originCity} to ${lr.destinationCity}`, 26),
        truncate(lr.executive.name, 18),
        lr.status.replace("_", " "),
        PAYMENT_LABELS[lr.paymentMode] ?? lr.paymentMode,
        formatCurrency(Number(lr.freightAmount.toString())),
      ],
      ctx.y,
    );
    ctx.y -= 16;

    detailLines.forEach((line) => {
      ctx.page.drawText(pdfText(line), {
        x: margin + 4,
        y: ctx.y,
        size: 6.5,
        font: helv,
        color: BRAND.muted,
      });
      ctx.y -= 9;
    });
    ctx.y -= 4;
    ctx.page.drawLine({
      start: { x: margin, y: ctx.y + 5 },
      end: { x: margin + ctx.contentW, y: ctx.y + 5 },
      thickness: 0.4,
      color: BRAND.border,
    });
    ctx.y -= 6;
  }

  if (lrs.length === 0) {
    ctx.page.drawText(pdfText("No Lorry Receipts match the selected filters."), {
      x: margin,
      y: ctx.y - 10,
      size: 10,
      font: helv,
      color: BRAND.muted,
    });
  }

  const bytes = await pdf.save();
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="lr-report-${from.toISOString().slice(0, 10)}_${to.toISOString().slice(0, 10)}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────
// Drawing helpers — mirror the structure/conventions of src/lib/pdf/lr-pdf.ts
// (mutable Ctx, manual line-by-line text, pdfText sanitization) so every
// generated PDF in the app looks and behaves consistently.
// ─────────────────────────────────────────────────────────────────────────

async function drawReportHeader(
  ctx: Ctx,
  args: {
    company: { name: string; address: string; gstNumber: string; cin?: string | null } | null;
    logo: { bytes: Uint8Array; kind: "png" | "jpg" } | null;
    from: Date;
    to: Date;
    filters: string[];
    kpis: { label: string; value: string }[];
  },
) {
  const { page, pdf, helv, helvBold, margin, contentW } = ctx;
  const { company } = args;

  page.drawRectangle({ x: 0, y: ctx.height - 74, width: ctx.width, height: 74, color: BRAND.primary });

  const logoSize = 40;
  if (args.logo) {
    try {
      const img =
        args.logo.kind === "png"
          ? await pdf.embedPng(args.logo.bytes)
          : await pdf.embedJpg(args.logo.bytes);
      const dims = img.scaleToFit(logoSize, logoSize);
      page.drawRectangle({
        x: margin,
        y: ctx.height - 20 - logoSize,
        width: logoSize,
        height: logoSize,
        color: rgb(1, 1, 1),
      });
      page.drawImage(img, {
        x: margin + (logoSize - dims.width) / 2,
        y: ctx.height - 20 - logoSize + (logoSize - dims.height) / 2,
        width: dims.width,
        height: dims.height,
      });
    } catch {
      // fall through — logo optional
    }
  }

  const textX = args.logo ? margin + logoSize + 12 : margin;
  page.drawText(pdfText("Lorry Receipt Report"), {
    x: textX,
    y: ctx.height - 38,
    size: 17,
    font: helvBold,
    color: rgb(1, 1, 1),
  });
  page.drawText(pdfText(company?.name ?? "Company"), {
    x: textX,
    y: ctx.height - 56,
    size: 10.5,
    font: helv,
    color: rgb(0.92, 0.9, 1),
  });
  if (company?.gstNumber) {
    const gstLine = company.cin
      ? `GSTIN: ${company.gstNumber}  ·  CIN: ${company.cin}`
      : `GSTIN: ${company.gstNumber}`;
    page.drawText(pdfText(gstLine), {
      x: textX,
      y: ctx.height - 68,
      size: 7.5,
      font: helv,
      color: rgb(0.85, 0.82, 1),
    });
  }

  const rangeText = pdfText(`${args.from.toLocaleDateString("en-IN")} - ${args.to.toLocaleDateString("en-IN")}`);
  page.drawText(rangeText, {
    x: ctx.width - margin - helv.widthOfTextAtSize(rangeText, 10),
    y: ctx.height - 38,
    size: 10,
    font: helv,
    color: rgb(1, 1, 1),
  });
  const genText = pdfText(`Generated ${new Date().toLocaleDateString("en-IN")}`);
  page.drawText(genText, {
    x: ctx.width - margin - helv.widthOfTextAtSize(genText, 8),
    y: ctx.height - 52,
    size: 8,
    font: helv,
    color: rgb(0.85, 0.82, 1),
  });

  ctx.y = ctx.height - 74 - 20;

  page.drawText(
    pdfText(`Filters: ${args.filters.length ? args.filters.join("  ·  ") : "None — showing all LRs in range"}`),
    { x: margin, y: ctx.y, size: 8.5, font: helv, color: BRAND.muted },
  );
  ctx.y -= 26;

  const gap = 8;
  const kpiW = (contentW - gap * (args.kpis.length - 1)) / args.kpis.length;
  args.kpis.forEach((kpi, i) => {
    const x = margin + i * (kpiW + gap);
    page.drawRectangle({
      x,
      y: ctx.y - 46,
      width: kpiW,
      height: 46,
      borderColor: BRAND.border,
      borderWidth: 1,
      color: BRAND.accent,
    });
    page.drawText(pdfText(kpi.label.toUpperCase()), {
      x: x + 10,
      y: ctx.y - 16,
      size: 7,
      font: helvBold,
      color: BRAND.muted,
    });
    page.drawText(pdfText(kpi.value), {
      x: x + 10,
      y: ctx.y - 34,
      size: 13,
      font: helvBold,
      color: BRAND.primary,
    });
  });
  ctx.y -= 46 + 26;
}

// ─── Donut chart ────────────────────────────────────────────────────────
// pdf-lib's drawSvgPath negates the path's Y coordinates then translates by
// options.x/y (which default to an internal cursor, NOT 0,0). Passing
// x:0, y:0 explicitly and negating our own Y values cancels that out, so
// real PDF page coordinates can be used directly for the slice polygons.
function drawDonutChart(
  ctx: Ctx,
  opts: { cx: number; cy: number; r: number; slices: { value: number; color: ReturnType<typeof rgb> }[] },
) {
  const total = opts.slices.reduce((s, x) => s + x.value, 0);
  if (total <= 0) {
    ctx.page.drawEllipse({
      x: opts.cx,
      y: opts.cy,
      xScale: opts.r,
      yScale: opts.r,
      color: BRAND.border,
    });
  } else {
    let angle = -Math.PI / 2;
    for (const slice of opts.slices) {
      const frac = slice.value / total;
      if (frac <= 0) continue;
      const sweep = frac * Math.PI * 2;
      const steps = Math.max(1, Math.ceil((sweep / (Math.PI * 2)) * 60));
      let d = `M ${opts.cx} ${-opts.cy} `;
      for (let i = 0; i <= steps; i++) {
        const a = angle + (sweep * i) / steps;
        d += `L ${opts.cx + opts.r * Math.cos(a)} ${-(opts.cy + opts.r * Math.sin(a))} `;
      }
      d += "Z";
      ctx.page.drawSvgPath(d, { x: 0, y: 0, color: slice.color, borderWidth: 0 });
      angle += sweep;
    }
  }
  ctx.page.drawEllipse({
    x: opts.cx,
    y: opts.cy,
    xScale: opts.r * 0.55,
    yScale: opts.r * 0.55,
    color: BRAND.paper,
  });
}

/** Color swatch + label + value — used as the legend for both the donut
 * chart and the payment bar chart, so every visual on the report is always
 * labeled rather than relying on color alone. */
function drawLegendRow(
  ctx: Ctx,
  opts: { x: number; y: number; color: ReturnType<typeof rgb>; label: string; value: string },
) {
  ctx.page.drawRectangle({ x: opts.x, y: opts.y - 6, width: 8, height: 8, color: opts.color });
  ctx.page.drawText(pdfText(opts.label), {
    x: opts.x + 13,
    y: opts.y - 5,
    size: 7.5,
    font: ctx.helv,
    color: BRAND.ink,
  });
  const valueText = pdfText(opts.value);
  const valueSize = 7.5;
  ctx.page.drawText(valueText, {
    x: opts.x + 148 - ctx.helvBold.widthOfTextAtSize(valueText, valueSize),
    y: opts.y - 5,
    size: valueSize,
    font: ctx.helvBold,
    color: BRAND.muted,
  });
}

/** Overview visuals shown once, right below the KPI cards: a status-mix
 * donut (with legend) on the left, and a payment-mode bar chart (with
 * inline legend/value) on the right — so the report is scannable at a
 * glance and not just a wall of table rows. */
function drawOverviewCharts(
  ctx: Ctx,
  args: {
    statusCounts: { status: LRStatus; count: number }[];
    paymentBreakdown: { mode: (typeof PAYMENT_VALUES)[number]; amount: number }[];
    totalCount: number;
  },
) {
  const { margin, contentW } = ctx;
  const gap = 28;
  const halfW = (contentW - gap) / 2;
  const panelH = 118;
  const sectionTop = ctx.y;

  // Left panel — Status Breakdown donut + legend
  ctx.page.drawText(pdfText("STATUS BREAKDOWN"), {
    x: margin,
    y: sectionTop,
    size: 8,
    font: ctx.helvBold,
    color: BRAND.muted,
  });
  const donutCx = margin + 42;
  const donutCy = sectionTop - panelH / 2 - 4;
  drawDonutChart(ctx, {
    cx: donutCx,
    cy: donutCy,
    r: 38,
    slices: args.statusCounts.map((s) => ({ value: s.count, color: STATUS_COLORS[s.status] })),
  });
  ctx.page.drawText(pdfText(String(args.totalCount)), {
    x: donutCx - ctx.helvBold.widthOfTextAtSize(String(args.totalCount), 12) / 2,
    y: donutCy - 4,
    size: 12,
    font: ctx.helvBold,
    color: BRAND.primary,
  });

  const legendX = margin + 96;
  let legendY = sectionTop - 22;
  args.statusCounts.forEach((s) => {
    const pct = args.totalCount > 0 ? Math.round((s.count / args.totalCount) * 100) : 0;
    drawLegendRow(ctx, {
      x: legendX,
      y: legendY,
      color: STATUS_COLORS[s.status],
      label: STATUS_LABELS[s.status],
      value: `${s.count} (${pct}%)`,
    });
    legendY -= 15;
  });

  // Right panel — Payment Mode bar chart + inline legend/value
  const rightX = margin + halfW + gap;
  ctx.page.drawText(pdfText("PAYMENT MODE BREAKDOWN"), {
    x: rightX,
    y: sectionTop,
    size: 8,
    font: ctx.helvBold,
    color: BRAND.muted,
  });
  const barMax = Math.max(1, ...args.paymentBreakdown.map((p) => p.amount));
  const barTrackW = halfW - 4;
  let barY = sectionTop - 26;
  args.paymentBreakdown.forEach((p) => {
    const label = PAYMENT_LABELS[p.mode] ?? p.mode;
    const color = PAYMENT_COLORS[p.mode] ?? BRAND.primary;
    ctx.page.drawRectangle({ x: rightX, y: barY - 4, width: 8, height: 8, color });
    ctx.page.drawText(pdfText(label), {
      x: rightX + 13,
      y: barY - 3,
      size: 7.5,
      font: ctx.helv,
      color: BRAND.ink,
    });
    const valueText = pdfText(formatCurrency(p.amount));
    ctx.page.drawText(valueText, {
      x: rightX + barTrackW - ctx.helvBold.widthOfTextAtSize(valueText, 7.5),
      y: barY - 3,
      size: 7.5,
      font: ctx.helvBold,
      color: BRAND.muted,
    });
    barY -= 12;
    ctx.page.drawRectangle({
      x: rightX,
      y: barY - 8,
      width: barTrackW,
      height: 8,
      color: BRAND.accent,
    });
    const fillW = Math.max(2, (p.amount / barMax) * barTrackW);
    ctx.page.drawRectangle({ x: rightX, y: barY - 8, width: fillW, height: 8, color });
    barY -= 20;
  });

  ctx.y = sectionTop - panelH - 10;
}

function drawContinuationHeader(ctx: Ctx, companyName: string) {
  ctx.page.drawText(pdfText(`Lorry Receipt Report — ${companyName} (continued)`), {
    x: ctx.margin,
    y: ctx.y,
    size: 10,
    font: ctx.helvBold,
    color: BRAND.primary,
  });
  ctx.y -= 16;
}

function drawTableHeaderRow(ctx: Ctx) {
  const { page, helvBold, margin, contentW } = ctx;
  page.drawRectangle({ x: margin, y: ctx.y - 16, width: contentW, height: 18, color: BRAND.accent });
  let x = margin;
  TABLE_COLS.forEach((col) => {
    const colW = contentW * col.w;
    page.drawText(pdfText(col.label.toUpperCase()), {
      x: x + 4,
      y: ctx.y - 11,
      size: 7,
      font: helvBold,
      color: BRAND.primary,
    });
    x += colW;
  });
  ctx.y -= 26;
}

function drawRow(ctx: Ctx, cells: string[], yPos: number) {
  const { page, helv, margin, contentW } = ctx;
  let x = margin;
  cells.forEach((cell, i) => {
    const colW = contentW * TABLE_COLS[i].w;
    const maxChars = Math.max(6, Math.floor(colW / 4.6));
    page.drawText(pdfText(truncate(cell, maxChars)), {
      x: x + 4,
      y: yPos,
      size: 8.5,
      font: helv,
      color: BRAND.ink,
    });
    x += colW;
  });
}

function drawPageFooter(ctx: Ctx) {
  ctx.page.drawText(
    pdfText(`Empowered by Rayudu Group · RonoHub  —  Page ${ctx.pageNum}`),
    {
      x: ctx.margin,
      y: 22,
      size: 7.5,
      font: ctx.helv,
      color: BRAND.muted,
    },
  );
}

const truncate = (s: string, max: number) =>
  s.length <= max ? s : s.slice(0, Math.max(0, max - 1)) + "…";

function wrap(text: string, maxWidth: number, font: PDFFont, size: number): string[] {
  const out: string[] = [];
  for (const paragraph of text.split(/\n+/)) {
    const words = paragraph.split(/\s+/);
    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) > maxWidth && line) {
        out.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    if (line) out.push(line);
  }
  return out;
}
