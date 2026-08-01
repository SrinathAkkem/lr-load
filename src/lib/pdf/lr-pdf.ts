import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb, RGB } from "pdf-lib";
import QRCode from "qrcode";
import type { Company, LRRequest } from "@prisma/client";
import { toLR } from "@/lib/db/serialize";
import { loadImageBytes } from "./image-loader";
import { pdfText } from "./pdf-text";

/**
 * Brand colors — synced with src/lib/brand.ts (#5E3EA1 purple gradient).
 *   accent   → table header rows + chips (violet 100)
 *   ink      → body copy (slate 900)
 *   muted    → labels and meta text (slate 500)
 */
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

type LRWithCompany = LRRequest & { company: Company };

interface PdfDeps {
  appUrl: string;
}

/** Mutable drawing context shared by every section helper. `page`/`y` are
 * reassigned in place (never destructured to a local copy) so callers
 * always see the latest cursor position. */
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
}

const blank = (v: string | null | undefined) => (v && v.trim() ? v.trim() : "—");

/**
 * Exactly two pages:
 *   Page 1 — dense classic/legal LR layout (Ogin-style): every captured
 *            field, goods table, freight, signatures, QR, and T&C.
 *   Page 2 — Goods Photos (or a "none attached" notice, so the document is
 *            always exactly two pages regardless of whether photos exist).
 */
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

  const helv = await pdf.embedFont(StandardFonts.Helvetica);
  const helvBold = await pdf.embedFont(StandardFonts.HelveticaBold);

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
  };

  const [logo, signature, stamp, photos] = await Promise.all([
    loadImageBytes(company.logoUrl),
    loadImageBytes(view.signatureUrl ?? null),
    loadImageBytes(company.stampUrl),
    Promise.all((view.photos ?? []).map((url) => loadImageBytes(url))),
  ]);

  const qrUrl = `${appUrl.replace(/\/$/, "")}/qr/${view.qrCode}`;
  await drawLegalPage(ctx, { company, logo, signature, stamp, view, qrUrl });

  const validPhotos = photos.filter(
    (p): p is { bytes: Uint8Array; kind: "png" | "jpg" } => p !== null,
  );
  await drawGoodsPhotosPage(pdf, helv, helvBold, {
    margin,
    photos: validPhotos,
    lrLabel: view.lrNumber ?? view.trackingId,
  });

  return await pdf.save();
}

type ViewLR = ReturnType<typeof toLR>;

// ─────────────────────────────────────────────────────────────────────────
// PAGE 1 — dense classic/legal LR layout (Ogin-style) with every field,
// goods table, freight, signatures/QR, and terms & conditions.
// ─────────────────────────────────────────────────────────────────────────

async function drawLegalPage(
  ctx: Ctx,
  args: {
    company: Company;
    logo: { bytes: Uint8Array; kind: "png" | "jpg" } | null;
    signature: { bytes: Uint8Array; kind: "png" | "jpg" } | null;
    stamp: { bytes: Uint8Array; kind: "png" | "jpg" } | null;
    view: ViewLR;
    qrUrl: string;
  },
) {
  const { view, company, signature, stamp, qrUrl } = args;
  const { pdf, margin, contentW } = ctx;

  await drawHeader(ctx, { company, logo: args.logo });
  ctx.y -= 10;

  drawColonRow(ctx, [
    { label: "TRANSPORT CODE", value: company.lrCode },
    { label: "LR NO.", value: blank(view.lrNumber) },
  ]);
  drawColonRow(ctx, [
    { label: "DATE OF DISPATCH", value: view.dispatchDate },
    { label: "STATUS", value: view.status.replace("_", " ").toUpperCase() },
  ]);
  drawColonRow(ctx, [
    { label: "WORK ORDER NO.", value: blank(view.workOrderNo) },
    { label: "INVOICE NUMBER", value: blank(view.invoiceNumber) },
  ]);
  drawColonRow(ctx, [
    { label: "INSURANCE", value: blank(view.insurance) },
    { label: "PAYMENT MODE", value: view.paymentMode },
  ]);
  drawColonRow(ctx, [
    { label: "TRUCK NUMBER", value: view.vehicleNumber },
    { label: "DRIVER NUMBER", value: blank(view.driverPhone) },
  ]);
  drawColonRow(ctx, [
    { label: "DRIVER NAME", value: blank(view.driverName) },
    { label: "DRIVING LICENSE NUMBER", value: blank(view.drivingLicenseNumber) },
  ]);
  drawColonRow(ctx, [
    { label: "LOADING POINT", value: blank(view.loadingPoint) },
    { label: "LOADING WEIGHT", value: `${view.weightKg} KG` },
  ]);
  drawColonRow(ctx, [
    { label: "UNLOADING POINT", value: blank(view.unloadingPoint) },
    { label: "UNLOADING WEIGHT", value: "—" },
  ]);
  drawColonRow(ctx, [
    { label: "ROUTE", value: `${view.originCity} to ${view.destinationCity}` },
  ]);
  ctx.y -= 4;

  const halfW = (contentW - 10) / 2;
  const boxH = 46;
  drawNameAddressBox(ctx, {
    x: margin,
    y: ctx.y,
    w: halfW,
    h: boxH,
    title: "CONSIGNOR",
    name: view.consignorName,
    address: view.consignorAddress,
  });
  drawNameAddressBox(ctx, {
    x: margin + halfW + 10,
    y: ctx.y,
    w: halfW,
    h: boxH,
    title: "CONSIGNEE",
    name: view.consigneeCompany
      ? `${view.consigneeCompany} — ${view.consigneeName}`
      : view.consigneeName,
    address: `${view.consigneeAddress} (Ph: ${view.consigneePhone})`,
  });
  ctx.y -= boxH + 8;

  drawGoodsTable(ctx, {
    y: ctx.y,
    description: pdfText(view.goodsDescription),
    packages: view.noOfPackages,
    weight: view.weightKg,
    declaredValue: view.declaredValue,
  });
  ctx.y -= 46;

  drawFreightBox(ctx, {
    y: ctx.y,
    freight: view.freightAmount,
    payment: view.paymentMode,
  });
  ctx.y -= 40;

  if (view.specialInstructions) {
    ctx.page.drawText("SPECIAL INSTRUCTIONS", {
      x: margin,
      y: ctx.y,
      size: 6.5,
      font: ctx.helvBold,
      color: BRAND.muted,
    });
    ctx.y -= 10;
    const lines = wrap(pdfText(view.specialInstructions), contentW, ctx.helv, 8);
    const shown = lines.slice(0, 2);
    shown.forEach((line, i) => {
      ctx.page.drawText(line, {
        x: margin,
        y: ctx.y - i * 10,
        size: 8,
        font: ctx.helv,
        color: BRAND.ink,
      });
    });
    ctx.y -= shown.length * 10 + 4;
  }

  // ─── Delivery acknowledgement + Loading officer signature ────────────
  // No digital consignee/loading-officer sign-off exists in the app today,
  // so both are printed as blank lines to be signed by hand after
  // printing — matching standard printed LR formats.
  const ackY = ctx.y;
  ctx.page.drawText("DELIVERY ACKNOWLEDGEMENT", {
    x: margin,
    y: ackY,
    size: 6.5,
    font: ctx.helvBold,
    color: BRAND.muted,
  });
  ctx.page.drawText(pdfText("(Goods received in good condition)"), {
    x: margin,
    y: ackY - 10,
    size: 7.5,
    font: ctx.helv,
    color: BRAND.muted,
  });
  ctx.page.drawLine({
    start: { x: margin, y: ackY - 26 },
    end: { x: margin + halfW - 10, y: ackY - 26 },
    thickness: 0.6,
    color: BRAND.border,
  });
  ctx.page.drawText("Consignee Signature & Date", {
    x: margin,
    y: ackY - 36,
    size: 6,
    font: ctx.helv,
    color: BRAND.muted,
  });

  const officerX = margin + halfW + 10;
  ctx.page.drawText("LOADING OFFICER ACKNOWLEDGMENT", {
    x: officerX,
    y: ackY,
    size: 6.5,
    font: ctx.helvBold,
    color: BRAND.muted,
  });
  ctx.page.drawLine({
    start: { x: officerX, y: ackY - 26 },
    end: { x: officerX + halfW - 10, y: ackY - 26 },
    thickness: 0.6,
    color: BRAND.border,
  });
  ctx.page.drawText("Loading Officer Signature", {
    x: officerX,
    y: ackY - 36,
    size: 6,
    font: ctx.helv,
    color: BRAND.muted,
  });
  ctx.y -= 48;

  // ─── Executive Signature + Stamp + QR ─────────────────────────────────
  const qrPngBytes = await QRCode.toBuffer(qrUrl, { type: "png", margin: 1, width: 220 });
  const qrPng = await pdf.embedPng(qrPngBytes);

  const sigBoxW = 150;
  const sigBoxH = 46;
  const sigX = margin;
  const sigY = ctx.y - sigBoxH - 12;

  ctx.page.drawText("EXECUTIVE SIGNATURE", {
    x: sigX,
    y: sigY + sigBoxH + 4,
    size: 6.5,
    font: ctx.helvBold,
    color: BRAND.muted,
  });
  ctx.page.drawRectangle({
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
      const dims = sigImg.scaleToFit(sigBoxW - 10, sigBoxH - 10);
      ctx.page.drawImage(sigImg, {
        x: sigX + (sigBoxW - dims.width) / 2,
        y: sigY + (sigBoxH - dims.height) / 2,
        width: dims.width,
        height: dims.height,
      });
    } catch {
      drawCenteredText(ctx.page, ctx.helv, "(signature)", {
        x: sigX,
        y: sigY + sigBoxH / 2 - 3,
        w: sigBoxW,
        size: 7,
        color: BRAND.muted,
      });
    }
  } else {
    drawCenteredText(ctx.page, ctx.helv, "Signed digitally on submission", {
      x: sigX,
      y: sigY + sigBoxH / 2 - 3,
      w: sigBoxW,
      size: 7,
      color: BRAND.muted,
    });
  }

  const stampX = sigX + sigBoxW + 16;
  if (stamp) {
    try {
      const stampImg =
        stamp.kind === "png"
          ? await pdf.embedPng(stamp.bytes)
          : await pdf.embedJpg(stamp.bytes);
      const dims = stampImg.scaleToFit(sigBoxH, sigBoxH);
      ctx.page.drawText("COMPANY STAMP", {
        x: stampX,
        y: sigY + sigBoxH + 4,
        size: 6.5,
        font: ctx.helvBold,
        color: BRAND.muted,
      });
      ctx.page.drawImage(stampImg, {
        x: stampX,
        y: sigY,
        width: dims.width,
        height: dims.height,
      });
    } catch {
      // ignore — stamp is optional
    }
  }

  const qrSize = 62;
  const qrX = ctx.width - margin - qrSize;
  const qrY = sigY + sigBoxH - qrSize;
  ctx.page.drawImage(qrPng, { x: qrX, y: qrY, width: qrSize, height: qrSize });
  ctx.page.drawText("Scan to verify", {
    x: qrX - 4,
    y: qrY - 10,
    size: 6.5,
    font: ctx.helv,
    color: BRAND.muted,
  });

  ctx.y = sigY - 14;

  // ─── Footer branding ───────────────────────────────────────────────────
  ctx.page.drawLine({
    start: { x: margin, y: ctx.y },
    end: { x: margin + contentW, y: ctx.y },
    thickness: 0.5,
    color: BRAND.border,
  });
  ctx.y -= 12;
  drawCenteredText(ctx.page, ctx.helvBold, "Empowered by Rayudu Group · RonoHub", {
    x: margin,
    y: ctx.y,
    w: contentW,
    size: 8,
    color: BRAND.primary,
  });
  ctx.y -= 16;

  drawTermsAndConditions(ctx);
}

// ─────────────────────────────────────────────────────────────────────────
// Terms & Conditions — fixed generic clauses, same for every company.
// Kept short with tight leading so the whole document still fits on the
// single legal page alongside everything else above.
// ─────────────────────────────────────────────────────────────────────────

const TERMS_AND_CONDITIONS: string[] = [
  "The Carrier will not accept gold, silver, jewellery, currency, securities, or other valuable documents unless declared in writing. Such goods carried inadvertently are entirely at the Consignor's risk.",
  "Inflammable, explosive, or hazardous goods will not be accepted unless permitted by law and packed per applicable regulations. The Consignor must disclose the true nature of goods before booking.",
  "Perishable, fragile, hazardous, or liquid goods are accepted for carriage only at the risk of the Consignor and/or Consignee.",
  "The Carrier reserves the right to choose any reasonable route or mode of transport without prior notice.",
  "If delivery is not accepted within a reasonable time of arrival, the Carrier may recover freight, demurrage, and related charges from the sale proceeds of the goods, after due notice.",
  "The Carrier is not liable for loss, damage, or delay caused by force majeure — acts of God, war, riots, strikes, natural disasters, or other events beyond its reasonable control.",
  "Claims for loss, damage, or shortage must be submitted in writing within 15 days of booking, with the original invoice and consignee copy of this Lorry Receipt.",
  "Employees or agents of the Carrier are not authorised to alter, waive, or override any of these terms and conditions.",
  "The Carrier shall have a lien on the goods carried until all freight and other charges due are paid in full.",
  "The Consignor and Consignee are responsible for accurate GST/PAN details. The Carrier is not liable for delay or penalty from incomplete or incorrect declarations.",
  "The Carrier does not guarantee delivery within a specific time frame and is not liable for delays due to traffic, breakdown, permits, weather, or other operational constraints.",
];

function drawTermsAndConditions(ctx: Ctx) {
  ctx.page.drawText("TERMS & CONDITIONS", {
    x: ctx.margin,
    y: ctx.y,
    size: 9,
    font: ctx.helvBold,
    color: BRAND.primary,
  });
  ctx.page.drawLine({
    start: { x: ctx.margin, y: ctx.y - 5 },
    end: { x: ctx.margin + ctx.contentW, y: ctx.y - 5 },
    thickness: 0.75,
    color: BRAND.border,
  });
  ctx.y -= 15;

  const fontSize = 6;
  const lineGap = fontSize + 1.6;

  for (let i = 0; i < TERMS_AND_CONDITIONS.length; i++) {
    const numbered = `${i + 1}. ${TERMS_AND_CONDITIONS[i]}`;
    const lines = wrap(numbered, ctx.contentW, ctx.helv, fontSize);
    for (const line of lines) {
      ctx.page.drawText(pdfText(line), {
        x: ctx.margin,
        y: ctx.y,
        size: fontSize,
        font: ctx.helv,
        color: BRAND.ink,
      });
      ctx.y -= lineGap;
    }
    ctx.y -= 1.5;
  }

  ctx.y -= 3;
  ctx.page.drawText(
    pdfText(
      "NOTE: We are not responsible for any breakage of goods. Consignors are advised to insure valuable goods.",
    ),
    {
      x: ctx.margin,
      y: ctx.y,
      size: 6,
      font: ctx.helvBold,
      color: BRAND.muted,
    },
  );
}

async function drawGoodsPhotosPage(
  pdf: PDFDocument,
  helv: PDFFont,
  helvBold: PDFFont,
  args: {
    margin: number;
    photos: { bytes: Uint8Array; kind: "png" | "jpg" }[];
    lrLabel: string;
  },
) {
  const page = pdf.addPage(PAGE_SIZE);
  const width = page.getWidth();
  const height = page.getHeight();
  const { margin } = args;

  page.drawText(pdfText(`Goods Photos — LR ${args.lrLabel}`), {
    x: margin,
    y: height - margin,
    size: 14,
    font: helvBold,
    color: BRAND.primary,
  });
  page.drawLine({
    start: { x: margin, y: height - margin - 10 },
    end: { x: width - margin, y: height - margin - 10 },
    thickness: 1,
    color: BRAND.border,
  });

  if (args.photos.length === 0) {
    drawCenteredText(page, helv, "No goods photos were attached to this LR.", {
      x: margin,
      y: height / 2,
      w: width - 2 * margin,
      size: 11,
      color: BRAND.muted,
    });
    return;
  }

  const cols = 2;
  const gap = 14;
  const cellW = (width - 2 * margin - gap * (cols - 1)) / cols;
  const cellH = 200;
  const startY = height - margin - 30;

  for (let i = 0; i < args.photos.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cellX = margin + col * (cellW + gap);
    const cellY = startY - row * (cellH + gap) - cellH;

    page.drawRectangle({
      x: cellX,
      y: cellY,
      width: cellW,
      height: cellH,
      borderColor: BRAND.border,
      borderWidth: 0.6,
      color: BRAND.paper,
    });

    try {
      const photo = args.photos[i];
      const img =
        photo.kind === "png"
          ? await pdf.embedPng(photo.bytes)
          : await pdf.embedJpg(photo.bytes);
      const dims = img.scaleToFit(cellW - 12, cellH - 12);
      page.drawImage(img, {
        x: cellX + (cellW - dims.width) / 2,
        y: cellY + (cellH - dims.height) / 2,
        width: dims.width,
        height: dims.height,
      });
    } catch {
      drawCenteredText(page, helv, "(photo unavailable)", {
        x: cellX,
        y: cellY + cellH / 2 - 4,
        w: cellW,
        size: 9,
        color: BRAND.muted,
      });
    }

    page.drawText(`Photo ${i + 1}`, {
      x: cellX + 6,
      y: cellY + cellH - 14,
      size: 8,
      font: helvBold,
      color: BRAND.muted,
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────
// internal drawing helpers
// ─────────────────────────────────────────────────────────────────────────

async function drawHeader(
  ctx: Ctx,
  args: {
    company: Company;
    logo: { bytes: Uint8Array; kind: "png" | "jpg" } | null;
  },
) {
  const { page, pdf, helv, helvBold, margin: x, y, contentW: w } = ctx;
  const logoSize = 50;
  page.drawRectangle({
    x,
    y: y - logoSize,
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
      const dims = img.scaleToFit(logoSize - 8, logoSize - 8);
      page.drawImage(img, {
        x: x + (logoSize - dims.width) / 2,
        y: y - logoSize + (logoSize - dims.height) / 2,
        width: dims.width,
        height: dims.height,
      });
    } catch {
      drawCenteredText(page, helvBold, args.company.lrCode, {
        x,
        y: y - logoSize / 2 - 5,
        w: logoSize,
        size: 13,
        color: BRAND.primary,
      });
    }
  } else {
    drawCenteredText(page, helvBold, args.company.lrCode, {
      x,
      y: y - logoSize / 2 - 5,
      w: logoSize,
      size: 13,
      color: BRAND.primary,
    });
  }

  const textRight = x + w;
  const nameSize = 13;

  const name = pdfText(args.company.name);
  page.drawText(name, {
    x: textRight - helvBold.widthOfTextAtSize(name, nameSize),
    y: y - 13,
    size: nameSize,
    font: helvBold,
    color: BRAND.ink,
  });

  const addrWidth = 300;
  drawRightAlignedWrapped(ctx, pdfText(args.company.address), {
    x: textRight - addrWidth,
    y: y - 26,
    w: addrWidth,
    size: 8,
    color: BRAND.muted,
  });

  const gstinLine = args.company.cin
    ? `GSTIN: ${args.company.gstNumber}  -  CIN: ${args.company.cin}`
    : `GSTIN: ${args.company.gstNumber}`;
  const gstText = pdfText(gstinLine);
  page.drawText(gstText, {
    x: textRight - helv.widthOfTextAtSize(gstText, 8),
    y: y - logoSize + 6,
    size: 8,
    font: helv,
    color: BRAND.ink,
  });

  const contactParts = [
    args.company.contactPhone ? `Ph: ${args.company.contactPhone}` : null,
    args.company.email || null,
    args.company.website || null,
  ].filter((v): v is string => Boolean(v));
  if (contactParts.length > 0) {
    const contactText = pdfText(contactParts.join("  -  "));
    page.drawText(contactText, {
      x: textRight - helv.widthOfTextAtSize(contactText, 7),
      y: y - logoSize - 4,
      size: 7,
      font: helv,
      color: BRAND.muted,
    });
  }

  page.drawLine({
    start: { x, y: y - logoSize - 12 },
    end: { x: x + w, y: y - logoSize - 12 },
    thickness: 1,
    color: BRAND.primary,
  });
  ctx.y = y - logoSize - 12;
}

/** Draws right-aligned wrapped text where each wrapped line is re-measured
 * and positioned individually (rather than relying on pdf-lib's own \n
 * handling, whose default line height doesn't match our layout). */
function drawRightAlignedWrapped(ctx: Ctx, text: string, opts: TextOptions) {
  const lines = wrap(text, opts.w, ctx.helv, opts.size);
  lines.forEach((line, i) => {
    const lineW = ctx.helv.widthOfTextAtSize(line, opts.size);
    ctx.page.drawText(line, {
      x: opts.x + opts.w - lineW,
      y: opts.y - i * (opts.size + 2),
      size: opts.size,
      font: ctx.helv,
      color: opts.color,
    });
  });
}

/** Compact "LABEL : value" row(s). Accepts 1-2 items split across the
 * content width; each item's label/value are drawn manually line-by-line
 * (never relying on pdf-lib's \n auto-split) so nothing can overlap. */
function drawColonRow(ctx: Ctx, items: { label: string; value: string }[]) {
  const colW = ctx.contentW / items.length;
  const valueSize = 8;
  let maxLines = 1;

  const rendered = items.map((item, i) => {
    const cx = ctx.margin + i * colW;
    const availW = colW - 10;
    const prefix = `${item.label}: `;
    const prefixW = ctx.helvBold.widthOfTextAtSize(prefix, valueSize);
    const valueLines = wrap(pdfText(item.value), Math.max(availW - prefixW, 40), ctx.helv, valueSize);
    return { cx, prefix, prefixW, valueLines };
  });
  rendered.forEach((r) => {
    maxLines = Math.max(maxLines, r.valueLines.length);
  });

  rendered.forEach((r) => {
    ctx.page.drawText(pdfText(r.prefix), {
      x: r.cx,
      y: ctx.y,
      size: valueSize,
      font: ctx.helvBold,
      color: BRAND.muted,
    });
    const firstLine = r.valueLines[0] ?? "—";
    ctx.page.drawText(pdfText(firstLine), {
      x: r.cx + r.prefixW,
      y: ctx.y,
      size: valueSize,
      font: ctx.helv,
      color: BRAND.ink,
    });
    for (let i = 1; i < r.valueLines.length; i++) {
      ctx.page.drawText(pdfText(r.valueLines[i]), {
        x: r.cx + r.prefixW,
        y: ctx.y - i * (valueSize + 1.5),
        size: valueSize,
        font: ctx.helv,
        color: BRAND.ink,
      });
    }
  });

  ctx.y -= (valueSize + 1.5) * maxLines + 4.5;
}

/** Name + wrapped address block. The name is split into explicit lines up
 * front and drawn one `drawText` call per line so its real height is known
 * before the address text is positioned beneath it — avoiding overlap from
 * pdf-lib's own (differently-sized) line spacing when text contains \n. */
function drawNameAddressBox(
  ctx: Ctx,
  args: {
    x: number;
    y: number;
    w: number;
    h: number;
    title: string;
    name: string;
    address: string;
  },
) {
  const { page, helv, helvBold } = ctx;
  const nameSize = 8.5;
  const addressSize = 7.5;

  page.drawRectangle({
    x: args.x,
    y: args.y - args.h,
    width: args.w,
    height: args.h,
    borderColor: BRAND.border,
    borderWidth: 0.6,
    color: BRAND.paper,
  });
  page.drawText(args.title, {
    x: args.x + 6,
    y: args.y - 9,
    size: 6,
    font: helvBold,
    color: BRAND.muted,
  });

  let cursorY = args.y - 9 - (nameSize + 2);
  const nameLines = wrap(pdfText(args.name), args.w - 12, helvBold, nameSize).slice(0, 1);
  for (const line of nameLines) {
    page.drawText(line, {
      x: args.x + 6,
      y: cursorY,
      size: nameSize,
      font: helvBold,
      color: BRAND.ink,
    });
    cursorY -= nameSize + 2;
  }

  drawWrappedText(ctx, pdfText(args.address), {
    x: args.x + 6,
    y: cursorY - 1,
    w: args.w - 12,
    size: addressSize,
    color: BRAND.ink,
  });
}

function drawGoodsTable(
  ctx: Ctx,
  args: {
    y: number;
    description: string;
    packages: number;
    weight: number;
    declaredValue: number;
  },
) {
  const { page, helv, helvBold, margin } = ctx;
  const w = ctx.contentW;
  const x = margin;
  const headers = ["GOODS DESCRIPTION", "PKGS", "WEIGHT (KG)", "DECLARED Rs."];
  const widths = [w * 0.5, w * 0.13, w * 0.17, w * 0.2];

  page.drawRectangle({ x, y: args.y - 16, width: w, height: 16, color: BRAND.primary });
  let cx = x;
  headers.forEach((h, i) => {
    page.drawText(h, {
      x: cx + 6,
      y: args.y - 11,
      size: 6.5,
      font: helvBold,
      color: rgb(1, 1, 1),
    });
    cx += widths[i];
  });

  page.drawRectangle({
    x,
    y: args.y - 40,
    width: w,
    height: 24,
    borderColor: BRAND.border,
    borderWidth: 0.5,
    color: BRAND.paper,
  });
  const descLines = wrap(pdfText(args.description), widths[0] - 12, helv, 8).slice(0, 1);
  page.drawText(descLines[0] ?? "", {
    x: x + 6,
    y: args.y - 28,
    size: 8,
    font: helv,
    color: BRAND.ink,
  });
  cx = x + widths[0];
  [
    String(args.packages),
    args.weight.toFixed(2),
    `Rs.${args.declaredValue.toLocaleString("en-IN")}`,
  ].forEach((v, i) => {
    page.drawText(pdfText(v), {
      x: cx + 6,
      y: args.y - 28,
      size: 8.5,
      font: helvBold,
      color: BRAND.ink,
    });
    cx += widths[i + 1];
  });
}

function drawFreightBox(ctx: Ctx, args: { y: number; freight: number; payment: string }) {
  const { page, helvBold, margin } = ctx;
  const x = margin;
  const w = ctx.contentW;
  page.drawRectangle({ x, y: args.y - 30, width: w, height: 30, color: BRAND.primary });
  page.drawText("TOTAL FREIGHT", {
    x: x + 10,
    y: args.y - 12,
    size: 7,
    font: helvBold,
    color: rgb(1, 1, 1),
  });
  page.drawText(`Rs.${args.freight.toLocaleString("en-IN")}`, {
    x: x + 10,
    y: args.y - 24,
    size: 11,
    font: helvBold,
    color: rgb(1, 1, 1),
  });

  const chipW = 76;
  const chipX = x + w - chipW - 10;
  const chipY = args.y - 20;
  page.drawRectangle({ x: chipX, y: chipY, width: chipW, height: 14, color: rgb(1, 1, 1) });
  drawCenteredText(page, helvBold, pdfText(args.payment.toUpperCase()), {
    x: chipX,
    y: chipY + 4,
    w: chipW,
    size: 7.5,
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

function drawWrappedText(ctx: Ctx, text: string, opts: TextOptions) {
  const lines = wrap(text, opts.w, ctx.helv, opts.size);
  lines.forEach((line, i) => {
    let x = opts.x;
    if (opts.align === "right") {
      x = opts.x + opts.w - ctx.helv.widthOfTextAtSize(line, opts.size);
    } else if (opts.align === "center") {
      x = opts.x + (opts.w - ctx.helv.widthOfTextAtSize(line, opts.size)) / 2;
    }
    ctx.page.drawText(line, {
      x,
      y: opts.y - i * (opts.size + 2),
      size: opts.size,
      font: ctx.helv,
      color: opts.color,
    });
  });
}

function drawCenteredText(
  page: PDFPage,
  font: PDFFont,
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
