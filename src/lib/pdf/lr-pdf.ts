import { PDFDocument, PDFPage, StandardFonts, rgb, RGB } from "pdf-lib";
import QRCode from "qrcode";
import type { Company, LRRequest } from "@prisma/client";
import { toLR } from "@/lib/db/serialize";
import { loadImageBytes } from "./image-loader";
import { pdfText } from "./pdf-text";

/**
 * Brand colors — kept in sync with the web UI's purple gradient.
 *   primary  → header + LR-number + section labels (violet 600)
 *   accent   → table header rows + chips (violet 100)
 *   ink      → body copy (slate 900)
 *   muted    → labels and meta text (slate 500)
 */
const BRAND = {
  primary: rgb(0.42, 0.27, 0.76),
  accent: rgb(0.95, 0.92, 1),
  ink: rgb(0.06, 0.09, 0.16),
  muted: rgb(0.42, 0.45, 0.55),
  border: rgb(0.85, 0.86, 0.92),
  paper: rgb(1, 1, 1),
} as const;

type LRWithCompany = LRRequest & { company: Company };

interface PdfDeps {
  appUrl: string;
}

export async function generateLrPdf(
  lr: LRWithCompany,
  { appUrl }: PdfDeps,
): Promise<Uint8Array> {
  const view = toLR(lr);
  const company = lr.company;

  const pdf = await PDFDocument.create();
  pdf.setTitle(`Lorry Receipt ${view.lrNumber ?? view.trackingId}`);
  pdf.setAuthor(company.name);
  pdf.setProducer("RonoHub");
  pdf.setCreator("RonoHub LR System");

  const page = pdf.addPage([595, 842]); // A4 portrait
  const helv = await pdf.embedFont(StandardFonts.Helvetica);
  const helvBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const margin = 40;
  const width = page.getWidth();
  let y = page.getHeight() - margin;

  const [logo, signature, stamp] = await Promise.all([
    loadImageBytes(company.logoUrl),
    loadImageBytes(view.signatureUrl ?? null),
    loadImageBytes(company.stampUrl),
  ]);

  // ─── Header ─────────────────────────────────────────────────────────────
  await drawHeader(page, pdf, helv, helvBold, {
    y,
    x: margin,
    w: width - 2 * margin,
    company,
    logo,
  });
  y -= 90;

  // ─── LR number + dispatch ──────────────────────────────────────────────
  page.drawText(pdfText(`LR No. ${view.lrNumber ?? view.trackingId}`), {
    x: margin,
    y: y - 4,
    size: 18,
    font: helvBold,
    color: BRAND.primary,
  });
  page.drawText(pdfText(`Date of Dispatch: ${view.dispatchDate}`), {
    x: margin,
    y: y - 24,
    size: 10,
    font: helv,
    color: BRAND.muted,
  });
  page.drawText(pdfText(`Status: ${view.status.replace("_", " ").toUpperCase()}`), {
    x: width - margin - 160,
    y: y - 24,
    size: 10,
    font: helvBold,
    color: BRAND.primary,
  });
  y -= 50;

  // ─── Consignor / Consignee ────────────────────────────────────────────
  const halfW = (width - 2 * margin - 10) / 2;
  drawAddressBlock(page, helv, helvBold, {
    x: margin,
    y,
    w: halfW,
    title: "FROM (CONSIGNOR)",
    name: pdfText(view.consignorName),
    address: pdfText(view.consignorAddress),
  });
  drawAddressBlock(page, helv, helvBold, {
    x: margin + halfW + 10,
    y,
    w: halfW,
    title: "TO (CONSIGNEE)",
    name: pdfText(view.consigneeName),
    address: pdfText(`${view.consigneeAddress}\nPhone: ${view.consigneePhone}`),
  });
  y -= 110;

  // ─── Route + Vehicle ──────────────────────────────────────────────────
  drawKeyValueRow(page, helv, helvBold, {
    x: margin,
    y,
    w: width - 2 * margin,
    items: [
      { label: "ROUTE", value: pdfText(`${view.originCity} to ${view.destinationCity}`) },
      { label: "VEHICLE", value: pdfText(view.vehicleNumber) },
      { label: "PAYMENT", value: pdfText(view.paymentMode) },
    ],
  });
  y -= 50;

  // ─── Goods table ──────────────────────────────────────────────────────
  drawGoodsTable(page, helv, helvBold, {
    x: margin,
    y,
    w: width - 2 * margin,
    description: pdfText(view.goodsDescription),
    packages: view.noOfPackages,
    weight: view.weightKg,
    declaredValue: view.declaredValue,
  });
  y -= 90;

  // ─── Freight ──────────────────────────────────────────────────────────
  drawFreightBox(page, helv, helvBold, {
    x: margin,
    y,
    w: width - 2 * margin,
    freight: view.freightAmount,
    payment: view.paymentMode,
  });
  y -= 70;

  // ─── Special instructions (optional) ──────────────────────────────────
  if (view.specialInstructions) {
    page.drawText("SPECIAL INSTRUCTIONS", {
      x: margin,
      y,
      size: 8,
      font: helvBold,
      color: BRAND.muted,
    });
    y -= 14;
    drawWrappedText(page, helv, pdfText(view.specialInstructions), {
      x: margin,
      y,
      w: width - 2 * margin,
      size: 10,
      color: BRAND.ink,
    });
    y -= 50;
  }

  // ─── Signature + QR + Stamp footer row ────────────────────────────────
  const qrUrl = `${appUrl.replace(/\/$/, "")}/qr/${view.qrCode}`;
  const qrPngBytes = await QRCode.toBuffer(qrUrl, {
    type: "png",
    margin: 1,
    width: 220,
  });
  const qrPng = await pdf.embedPng(qrPngBytes);

  const sigBoxW = 220;
  const sigBoxH = 70;
  const sigX = margin;
  const sigY = 110;

  page.drawText("EXECUTIVE SIGNATURE", {
    x: sigX,
    y: sigY + sigBoxH + 6,
    size: 8,
    font: helvBold,
    color: BRAND.muted,
  });
  page.drawRectangle({
    x: sigX,
    y: sigY,
    width: sigBoxW,
    height: sigBoxH,
    borderColor: BRAND.border,
    borderWidth: 1,
    color: BRAND.paper,
  });
  if (signature) {
    try {
      const sigImg =
        signature.kind === "png"
          ? await pdf.embedPng(signature.bytes)
          : await pdf.embedJpg(signature.bytes);
      const dims = sigImg.scaleToFit(sigBoxW - 12, sigBoxH - 12);
      page.drawImage(sigImg, {
        x: sigX + (sigBoxW - dims.width) / 2,
        y: sigY + (sigBoxH - dims.height) / 2,
        width: dims.width,
        height: dims.height,
      });
    } catch {
      drawCenteredText(page, helv, "(signature)", {
        x: sigX,
        y: sigY + sigBoxH / 2 - 4,
        w: sigBoxW,
        size: 9,
        color: BRAND.muted,
      });
    }
  } else {
    drawCenteredText(page, helv, "Signed digitally on submission", {
      x: sigX,
      y: sigY + sigBoxH / 2 - 4,
      w: sigBoxW,
      size: 9,
      color: BRAND.muted,
    });
  }

  const stampX = sigX + sigBoxW + 20;
  if (stamp) {
    try {
      const stampImg =
        stamp.kind === "png"
          ? await pdf.embedPng(stamp.bytes)
          : await pdf.embedJpg(stamp.bytes);
      const dims = stampImg.scaleToFit(sigBoxH, sigBoxH);
      page.drawText("COMPANY STAMP", {
        x: stampX,
        y: sigY + sigBoxH + 6,
        size: 8,
        font: helvBold,
        color: BRAND.muted,
      });
      page.drawImage(stampImg, {
        x: stampX,
        y: sigY,
        width: dims.width,
        height: dims.height,
      });
    } catch {
      // ignore — stamp is optional
    }
  }

  const qrSize = 90;
  const qrX = width - margin - qrSize;
  const qrY = sigY - 6;
  page.drawImage(qrPng, {
    x: qrX,
    y: qrY,
    width: qrSize,
    height: qrSize,
  });
  page.drawText("Scan to verify", {
    x: qrX + 10,
    y: qrY - 12,
    size: 8,
    font: helv,
    color: BRAND.muted,
  });

  // ─── Footer ───────────────────────────────────────────────────────────
  page.drawLine({
    start: { x: margin, y: 60 },
    end: { x: width - margin, y: 60 },
    thickness: 0.5,
    color: BRAND.border,
  });
  drawCenteredText(page, helvBold, "Empowered by Rayudu Group · RonoHub", {
    x: 0,
    y: 42,
    w: width,
    size: 10,
    color: BRAND.primary,
  });
  drawCenteredText(page, helv, pdfText(qrUrl), {
    x: 0,
    y: 28,
    w: width,
    size: 8,
    color: BRAND.muted,
  });

  return await pdf.save();
}

// ─────────────────────────────────────────────────────────────────────────
// internal drawing helpers
// ─────────────────────────────────────────────────────────────────────────

async function drawHeader(
  page: PDFPage,
  pdf: PDFDocument,
  helv: import("pdf-lib").PDFFont,
  helvBold: import("pdf-lib").PDFFont,
  args: {
    x: number;
    y: number;
    w: number;
    company: Company;
    logo: { bytes: Uint8Array; kind: "png" | "jpg" } | null;
  },
) {
  const logoSize = 58;
  page.drawRectangle({
    x: args.x,
    y: args.y - logoSize,
    width: logoSize,
    height: logoSize,
    color: BRAND.accent,
    borderColor: BRAND.primary,
    borderWidth: 1.5,
  });

  if (args.logo) {
    try {
      const img =
        args.logo.kind === "png"
          ? await pdf.embedPng(args.logo.bytes)
          : await pdf.embedJpg(args.logo.bytes);
      const dims = img.scaleToFit(logoSize - 10, logoSize - 10);
      page.drawImage(img, {
        x: args.x + (logoSize - dims.width) / 2,
        y: args.y - logoSize + (logoSize - dims.height) / 2,
        width: dims.width,
        height: dims.height,
      });
    } catch {
      drawCenteredText(page, helvBold, args.company.lrCode, {
        x: args.x,
        y: args.y - logoSize / 2 - 6,
        w: logoSize,
        size: 16,
        color: BRAND.primary,
      });
    }
  } else {
    drawCenteredText(page, helvBold, args.company.lrCode, {
      x: args.x,
      y: args.y - logoSize / 2 - 6,
      w: logoSize,
      size: 16,
      color: BRAND.primary,
    });
  }

  const textX = args.x + args.w;
  page.drawText(pdfText(args.company.name), {
    x: textX - helvBold.widthOfTextAtSize(args.company.name, 14),
    y: args.y - 16,
    size: 14,
    font: helvBold,
    color: BRAND.ink,
  });
  drawWrappedText(page, helv, pdfText(args.company.address), {
    x: textX - 260,
    y: args.y - 32,
    w: 260,
    size: 9,
    color: BRAND.muted,
    align: "right",
  });
  page.drawText(pdfText(`GSTIN: ${args.company.gstNumber}`), {
    x:
      textX -
      helv.widthOfTextAtSize(`GSTIN: ${args.company.gstNumber}`, 9),
    y: args.y - logoSize + 4,
    size: 9,
    font: helv,
    color: BRAND.ink,
  });
  page.drawLine({
    start: { x: args.x, y: args.y - logoSize - 8 },
    end: { x: args.x + args.w, y: args.y - logoSize - 8 },
    thickness: 1,
    color: BRAND.primary,
  });
}

function drawAddressBlock(
  page: PDFPage,
  helv: import("pdf-lib").PDFFont,
  helvBold: import("pdf-lib").PDFFont,
  args: {
    x: number;
    y: number;
    w: number;
    title: string;
    name: string;
    address: string;
  },
) {
  page.drawRectangle({
    x: args.x,
    y: args.y - 100,
    width: args.w,
    height: 100,
    borderColor: BRAND.border,
    borderWidth: 0.6,
    color: BRAND.paper,
  });
  page.drawText(args.title, {
    x: args.x + 10,
    y: args.y - 16,
    size: 8,
    font: helvBold,
    color: BRAND.muted,
  });
  page.drawText(pdfText(args.name), {
    x: args.x + 10,
    y: args.y - 32,
    size: 11,
    font: helvBold,
    color: BRAND.ink,
  });
  drawWrappedText(page, helv, pdfText(args.address), {
    x: args.x + 10,
    y: args.y - 48,
    w: args.w - 20,
    size: 9,
    color: BRAND.ink,
  });
}

function drawKeyValueRow(
  page: PDFPage,
  helv: import("pdf-lib").PDFFont,
  helvBold: import("pdf-lib").PDFFont,
  args: {
    x: number;
    y: number;
    w: number;
    items: { label: string; value: string }[];
  },
) {
  const colW = args.w / args.items.length;
  args.items.forEach((item, i) => {
    const cx = args.x + i * colW;
    page.drawRectangle({
      x: cx,
      y: args.y - 40,
      width: colW - 8,
      height: 40,
      color: BRAND.accent,
    });
    page.drawText(item.label, {
      x: cx + 10,
      y: args.y - 14,
      size: 7,
      font: helvBold,
      color: BRAND.muted,
    });
    page.drawText(pdfText(item.value), {
      x: cx + 10,
      y: args.y - 30,
      size: 11,
      font: helvBold,
      color: BRAND.ink,
    });
  });
}

function drawGoodsTable(
  page: PDFPage,
  helv: import("pdf-lib").PDFFont,
  helvBold: import("pdf-lib").PDFFont,
  args: {
    x: number;
    y: number;
    w: number;
    description: string;
    packages: number;
    weight: number;
    declaredValue: number;
  },
) {
  const headers = ["GOODS DESCRIPTION", "PKGS", "WEIGHT (KG)", "DECLARED Rs."];
  const widths = [args.w * 0.5, args.w * 0.13, args.w * 0.17, args.w * 0.2];

  page.drawRectangle({
    x: args.x,
    y: args.y - 20,
    width: args.w,
    height: 20,
    color: BRAND.primary,
  });
  let cx = args.x;
  headers.forEach((h, i) => {
    page.drawText(h, {
      x: cx + 8,
      y: args.y - 14,
      size: 8,
      font: helvBold,
      color: rgb(1, 1, 1),
    });
    cx += widths[i];
  });

  page.drawRectangle({
    x: args.x,
    y: args.y - 70,
    width: args.w,
    height: 50,
    borderColor: BRAND.border,
    borderWidth: 0.5,
    color: BRAND.paper,
  });
  drawWrappedText(page, helv, pdfText(args.description), {
    x: args.x + 8,
    y: args.y - 36,
    w: widths[0] - 16,
    size: 10,
    color: BRAND.ink,
  });
  cx = args.x + widths[0];
  [
    String(args.packages),
    args.weight.toFixed(2),
    `Rs.${args.declaredValue.toLocaleString("en-IN")}`,
  ].forEach((v, i) => {
    page.drawText(pdfText(v), {
      x: cx + 8,
      y: args.y - 36,
      size: 10,
      font: helvBold,
      color: BRAND.ink,
    });
    cx += widths[i + 1];
  });
}

function drawFreightBox(
  page: PDFPage,
  helv: import("pdf-lib").PDFFont,
  helvBold: import("pdf-lib").PDFFont,
  args: {
    x: number;
    y: number;
    w: number;
    freight: number;
    payment: string;
  },
) {
  page.drawRectangle({
    x: args.x,
    y: args.y - 50,
    width: args.w,
    height: 50,
    color: BRAND.primary,
  });
  page.drawText("TOTAL FREIGHT", {
    x: args.x + 14,
    y: args.y - 22,
    size: 9,
    font: helvBold,
    color: rgb(1, 1, 1),
  });
  page.drawText(`Rs.${args.freight.toLocaleString("en-IN")}`, {
    x: args.x + 14,
    y: args.y - 40,
    size: 18,
    font: helvBold,
    color: rgb(1, 1, 1),
  });

  const chipW = 90;
  const chipX = args.x + args.w - chipW - 14;
  const chipY = args.y - 33;
  page.drawRectangle({
    x: chipX,
    y: chipY,
    width: chipW,
    height: 18,
    color: rgb(1, 1, 1),
  });
  drawCenteredText(page, helvBold, pdfText(args.payment.toUpperCase()), {
    x: chipX,
    y: chipY + 4,
    w: chipW,
    size: 10,
    color: BRAND.primary,
  });
}

interface TextOptions {
  x: number;
  y: number;
  w: number;
  size: number;
  color: RGB;
  align?: "left" | "right" | "center";
}

function drawWrappedText(
  page: PDFPage,
  font: import("pdf-lib").PDFFont,
  text: string,
  opts: TextOptions,
) {
  const lines = wrap(text, opts.w, font, opts.size);
  lines.forEach((line, i) => {
    let x = opts.x;
    if (opts.align === "right") {
      x = opts.x + opts.w - font.widthOfTextAtSize(line, opts.size);
    } else if (opts.align === "center") {
      x = opts.x + (opts.w - font.widthOfTextAtSize(line, opts.size)) / 2;
    }
    page.drawText(line, {
      x,
      y: opts.y - i * (opts.size + 2),
      size: opts.size,
      font,
      color: opts.color,
    });
  });
}

function drawCenteredText(
  page: PDFPage,
  font: import("pdf-lib").PDFFont,
  text: string,
  opts: { x: number; y: number; w: number; size: number; color: RGB },
) {
  const w = font.widthOfTextAtSize(text, opts.size);
  page.drawText(pdfText(text), {
    x: opts.x + (opts.w - w) / 2,
    y: opts.y,
    size: opts.size,
    font,
    color: opts.color,
  });
}

function wrap(
  text: string,
  maxWidth: number,
  font: import("pdf-lib").PDFFont,
  size: number,
): string[] {
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
