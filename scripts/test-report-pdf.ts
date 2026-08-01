/**
 * Temporary, throwaway script to visually sanity-check the reports PDF
 * layout with mock data (no DB/auth needed). Mirrors src/app/api/reports/pdf/route.ts.
 * Not wired into any npm script; delete after verifying visually.
 */
import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "pdf-lib";
import { writeFileSync } from "fs";
import { pdfText } from "../src/lib/pdf/pdf-text";

const BRAND = {
  primary: rgb(0.369, 0.243, 0.631),
  accent: rgb(0.95, 0.92, 1),
  ink: rgb(0.06, 0.09, 0.16),
  muted: rgb(0.42, 0.45, 0.55),
  border: rgb(0.85, 0.86, 0.92),
  paper: rgb(1, 1, 1),
} as const;

const PAGE_SIZE: [number, number] = [595, 842];
const MARGIN = 34;

const TABLE_COLS = [
  { label: "LR No.", w: 0.15 },
  { label: "Date", w: 0.09 },
  { label: "Route", w: 0.22 },
  { label: "Executive", w: 0.16 },
  { label: "Status", w: 0.13 },
  { label: "Payment", w: 0.11 },
  { label: "Freight", w: 0.14 },
] as const;

const STATUS_COLORS: Record<string, ReturnType<typeof rgb>> = {
  pending: rgb(0.96, 0.65, 0.14),
  approved: rgb(0.05, 0.6, 0.35),
  rejected: rgb(0.85, 0.2, 0.2),
  in_transit: rgb(0.14, 0.44, 0.87),
  delivered: BRAND.primary,
};
const STATUS_LABELS: Record<string, string> = {
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
const PAYMENT_LABELS: Record<string, string> = { TO_PAY: "To Pay", PAID: "Paid", TO_BE_BILLED: "To Be Billed" };

const truncate = (s: string, max: number) => (s.length <= max ? s : s.slice(0, Math.max(0, max - 1)) + "…");

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

function formatCurrency(n: number) {
  return `Rs.${n.toLocaleString("en-IN")}`;
}

function drawDonutChart(
  page: PDFPage,
  opts: { cx: number; cy: number; r: number; slices: { value: number; color: ReturnType<typeof rgb> }[] },
) {
  const total = opts.slices.reduce((s, x) => s + x.value, 0);
  if (total > 0) {
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
      page.drawSvgPath(d, { x: 0, y: 0, color: slice.color, borderWidth: 0 });
      angle += sweep;
    }
  }
  page.drawEllipse({ x: opts.cx, y: opts.cy, xScale: opts.r * 0.55, yScale: opts.r * 0.55, color: BRAND.paper });
}

function drawLegendRow(
  page: PDFPage,
  helv: PDFFont,
  helvBold: PDFFont,
  opts: { x: number; y: number; color: ReturnType<typeof rgb>; label: string; value: string },
) {
  page.drawRectangle({ x: opts.x, y: opts.y - 6, width: 8, height: 8, color: opts.color });
  page.drawText(pdfText(opts.label), { x: opts.x + 13, y: opts.y - 5, size: 7.5, font: helv, color: BRAND.ink });
  const valueText = pdfText(opts.value);
  page.drawText(valueText, {
    x: opts.x + 148 - helvBold.widthOfTextAtSize(valueText, 7.5),
    y: opts.y - 5,
    size: 7.5,
    font: helvBold,
    color: BRAND.muted,
  });
}

async function main() {
  const pdf = await PDFDocument.create();
  const helv = await pdf.embedFont(StandardFonts.Helvetica);
  const helvBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const [width, height] = PAGE_SIZE;
  const margin = MARGIN;
  const contentW = width - 2 * margin;

  let page = pdf.addPage(PAGE_SIZE);
  let y = height - margin;

  page.drawRectangle({ x: 0, y: height - 74, width, height: 74, color: BRAND.primary });
  page.drawText(pdfText("Lorry Receipt Report"), { x: margin, y: height - 38, size: 17, font: helvBold, color: rgb(1, 1, 1) });
  page.drawText(pdfText("Mahadev Road Lines"), { x: margin, y: height - 56, size: 10.5, font: helv, color: rgb(0.92, 0.9, 1) });
  page.drawText(pdfText("GSTIN: 45RSSRRFGHJJJ56  ·  CIN: U41001AP2023PTC111480"), { x: margin, y: height - 68, size: 7.5, font: helv, color: rgb(0.85, 0.82, 1) });

  y = height - 74 - 20;
  page.drawText(pdfText("Filters: Status: approved  ·  Payment: Paid"), { x: margin, y, size: 8.5, font: helv, color: BRAND.muted });
  y -= 26;

  const kpis = [
    { label: "Total LRs", value: "128" },
    { label: "Total Freight", value: "Rs.4,52,300" },
    { label: "Approval Rate", value: "91.3%" },
    { label: "Rejected", value: "6" },
  ];
  const kgap = 8;
  const kpiW = (contentW - kgap * (kpis.length - 1)) / kpis.length;
  kpis.forEach((kpi, i) => {
    const x = margin + i * (kpiW + kgap);
    page.drawRectangle({ x, y: y - 46, width: kpiW, height: 46, borderColor: BRAND.border, borderWidth: 1, color: BRAND.accent });
    page.drawText(pdfText(kpi.label.toUpperCase()), { x: x + 10, y: y - 16, size: 7, font: helvBold, color: BRAND.muted });
    page.drawText(pdfText(kpi.value), { x: x + 10, y: y - 34, size: 13, font: helvBold, color: BRAND.primary });
  });
  y -= 46 + 26;

  // ─── Overview charts ───
  const sectionTop = y;
  const chartGap = 28;
  const halfW = (contentW - chartGap) / 2;
  const panelH = 118;
  const totalCount = 128;
  const statusCounts = [
    { status: "pending", count: 18 },
    { status: "approved", count: 62 },
    { status: "rejected", count: 6 },
    { status: "in_transit", count: 14 },
    { status: "delivered", count: 28 },
  ];
  const paymentBreakdown = [
    { mode: "TO_PAY", amount: 152000 },
    { mode: "PAID", amount: 248300 },
    { mode: "TO_BE_BILLED", amount: 52000 },
  ];

  page.drawText(pdfText("STATUS BREAKDOWN"), { x: margin, y: sectionTop, size: 8, font: helvBold, color: BRAND.muted });
  const donutCx = margin + 42;
  const donutCy = sectionTop - panelH / 2 - 4;
  drawDonutChart(page, { cx: donutCx, cy: donutCy, r: 38, slices: statusCounts.map((s) => ({ value: s.count, color: STATUS_COLORS[s.status] })) });
  page.drawText(pdfText(String(totalCount)), {
    x: donutCx - helvBold.widthOfTextAtSize(String(totalCount), 12) / 2,
    y: donutCy - 4,
    size: 12,
    font: helvBold,
    color: BRAND.primary,
  });
  const legendX = margin + 96;
  let legendY = sectionTop - 22;
  statusCounts.forEach((s) => {
    const pct = Math.round((s.count / totalCount) * 100);
    drawLegendRow(page, helv, helvBold, { x: legendX, y: legendY, color: STATUS_COLORS[s.status], label: STATUS_LABELS[s.status], value: `${s.count} (${pct}%)` });
    legendY -= 15;
  });

  const rightX = margin + halfW + chartGap;
  page.drawText(pdfText("PAYMENT MODE BREAKDOWN"), { x: rightX, y: sectionTop, size: 8, font: helvBold, color: BRAND.muted });
  const barMax = Math.max(1, ...paymentBreakdown.map((p) => p.amount));
  const barTrackW = halfW - 4;
  let barY = sectionTop - 26;
  paymentBreakdown.forEach((p) => {
    const label = PAYMENT_LABELS[p.mode];
    const color = PAYMENT_COLORS[p.mode];
    page.drawRectangle({ x: rightX, y: barY - 4, width: 8, height: 8, color });
    page.drawText(pdfText(label), { x: rightX + 13, y: barY - 3, size: 7.5, font: helv, color: BRAND.ink });
    const valueText = pdfText(formatCurrency(p.amount));
    page.drawText(valueText, { x: rightX + barTrackW - helvBold.widthOfTextAtSize(valueText, 7.5), y: barY - 3, size: 7.5, font: helvBold, color: BRAND.muted });
    barY -= 12;
    page.drawRectangle({ x: rightX, y: barY - 8, width: barTrackW, height: 8, color: BRAND.accent });
    const fillW = Math.max(2, (p.amount / barMax) * barTrackW);
    page.drawRectangle({ x: rightX, y: barY - 8, width: fillW, height: 8, color });
    barY -= 20;
  });

  y = sectionTop - panelH - 10;

  function drawTableHeaderRow() {
    page.drawRectangle({ x: margin, y: y - 16, width: contentW, height: 18, color: BRAND.accent });
    let x = margin;
    TABLE_COLS.forEach((col) => {
      const colW = contentW * col.w;
      page.drawText(pdfText(col.label.toUpperCase()), { x: x + 4, y: y - 11, size: 7, font: helvBold, color: BRAND.primary });
      x += colW;
    });
    y -= 26;
  }
  drawTableHeaderRow();

  const mockRows = Array.from({ length: 16 }).map((_, i) => ({
    lrNumber: `RONO/${2026}/${1000 + i}`,
    date: "31 Jul",
    route: "Hyderabad to Chennai",
    executive: "Ramesh Kumar",
    status: i % 4 === 0 ? "pending" : "approved",
    payment: i % 3 === 0 ? "To Pay" : "Paid",
    freight: "Rs.3,450",
    consignor: "Fghh Traders",
    consignee: "Vhh Enterprises",
    branch: i % 2 === 0 ? "Hyderabad HQ" : undefined,
    weight: "555kg",
    pkgs: "12",
    declared: "Rs.8,885",
    invoice: i % 2 === 0 ? `INV-2026-00${i}` : undefined,
    wo: i % 3 === 0 ? `WO-45${i}` : undefined,
    driver: "Ramesh Kumar",
    driverPh: "9876543210",
    license: "TS0920021001234",
    insurance: i % 2 === 0 ? "Insured - Policy #INS-99812" : undefined,
    loading: "Plot 12, Industrial Estate, Hyderabad",
    unloading: "Warehouse 4, Logistics Park, Chennai",
    vehicle: "TS09FF4566",
  }));

  for (const row of mockRows) {
    const detailParts = [
      `Consignor: ${row.consignor}`,
      `Consignee: ${row.consignee}`,
      row.branch && `Branch: ${row.branch}`,
      `Weight: ${row.weight}`,
      `Pkgs: ${row.pkgs}`,
      `Declared: ${row.declared}`,
      row.invoice && `Invoice: ${row.invoice}`,
      row.wo && `WO: ${row.wo}`,
      `Driver: ${row.driver}`,
      `Driver Ph: ${row.driverPh}`,
      `License: ${row.license}`,
      row.insurance && `Insurance: ${row.insurance}`,
      `Loading: ${row.loading}`,
      `Unloading: ${row.unloading}`,
      `Vehicle: ${row.vehicle}`,
    ].filter((v): v is string => Boolean(v));

    const detailLines = wrap(detailParts.join("   ·   "), contentW - 8, helv, 6.5).slice(0, 2);
    const rowH = 16 + detailLines.length * 9 + 10;

    if (y - rowH < margin + 20) {
      page = pdf.addPage(PAGE_SIZE);
      y = height - margin;
      page.drawText(pdfText("Lorry Receipt Report — Mahadev Road Lines (continued)"), { x: margin, y, size: 10, font: helvBold, color: BRAND.primary });
      y -= 16;
      drawTableHeaderRow();
    }

    let x = margin;
    [row.lrNumber, row.date, row.route, row.executive, row.status, row.payment, row.freight].forEach((cell, i) => {
      const colW = contentW * TABLE_COLS[i].w;
      const maxChars = Math.max(6, Math.floor(colW / 4.6));
      page.drawText(pdfText(truncate(cell, maxChars)), { x: x + 4, y, size: 8.5, font: helv, color: BRAND.ink });
      x += colW;
    });
    y -= 16;

    detailLines.forEach((line) => {
      page.drawText(pdfText(line), { x: margin + 4, y, size: 6.5, font: helv, color: BRAND.muted });
      y -= 9;
    });
    y -= 4;
    page.drawLine({ start: { x: margin, y: y + 5 }, end: { x: margin + contentW, y: y + 5 }, thickness: 0.4, color: BRAND.border });
    y -= 6;
  }

  page.drawText(pdfText("Empowered by Rayudu Group · RonoHub  —  Page 1"), { x: margin, y: 22, size: 7.5, font: helv, color: BRAND.muted });

  const bytes = await pdf.save();
  writeFileSync("/tmp/test-report.pdf", bytes);
  console.log("wrote /tmp/test-report.pdf, pages:", pdf.getPageCount());
}

main();
