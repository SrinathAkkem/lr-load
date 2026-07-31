import { randomBytes } from "crypto";
import { prisma } from "@/lib/db/prisma";
import { normalizeImage } from "./image-normalize";

/**
 * File storage backed by MySQL LONGBLOB.
 *
 * Every upload goes into the `Upload` table. No disk paths, symlinks, or
 * UPLOAD_DIR config needed. Files persist with the database and survive
 * all redeploys automatically.
 *
 * Public URLs stored in the DB remain `/uploads/{kind}/{filename}`.
 */

const UPLOAD_KINDS = ["photos", "signatures", "logos", "stamps"] as const;
export type UploadKind = (typeof UPLOAD_KINDS)[number];

const ALLOWED_MIME: Record<UploadKind, RegExp> = {
  photos: /^image\/(jpe?g|png|webp|heic)$/i,
  signatures: /^image\/(png|svg\+xml|jpe?g)$/i,
  logos: /^image\/(jpe?g|png|webp|svg\+xml)$/i,
  stamps: /^image\/(jpe?g|png|webp|svg\+xml)$/i,
};

const MAX_BYTES: Record<UploadKind, number> = {
  photos: 12 * 1024 * 1024,
  signatures: 2 * 1024 * 1024,
  logos: 4 * 1024 * 1024,
  stamps: 4 * 1024 * 1024,
};

const EXT_FROM_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/svg+xml": "svg",
};

/**
 * Sniff the real image format from magic bytes instead of trusting the
 * caller-provided MIME type. Clients (mobile in particular) sometimes send
 * a hardcoded/incorrect Content-Type (e.g. a PNG logo uploaded as
 * "image/jpeg"), which then gets the wrong file extension and later fails
 * to embed in generated PDFs (embedJpg throws on non-JPEG bytes). Detecting
 * the real format here keeps storage + downstream PDF embedding correct
 * regardless of what the client claims.
 */
function detectRealMime(data: Buffer | Uint8Array, fallback: string): string {
  const b = data instanceof Buffer ? data : Buffer.from(data);
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) {
    return "image/png";
  }
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    b.length >= 12 &&
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50
  ) {
    return "image/webp";
  }
  if (b.length >= 4 && b[0] === 0x00 && b[1] === 0x00 && b[2] === 0x00 && (b[3] === 0x18 || b[3] === 0x1c || b[3] === 0x20)) {
    // HEIC/HEIF ftyp box heuristic — only used if the box actually says heic.
    const boxType = b.slice(4, 8).toString("ascii");
    if (boxType === "ftyp") {
      const brand = b.slice(8, 12).toString("ascii");
      if (/^(heic|heix|hevc|heim|heis|mif1)$/i.test(brand)) return "image/heic";
    }
  }
  // SVG is text-based — sniff for the tag rather than magic bytes.
  const head = b.slice(0, 256).toString("utf8").trim().toLowerCase();
  if (head.startsWith("<?xml") || head.startsWith("<svg")) {
    return "image/svg+xml";
  }
  return fallback;
}

export interface SaveResult {
  url: string;
  bytes: number;
  mime: string;
}

export interface SaveArgs {
  kind: UploadKind;
  data: Buffer | Uint8Array;
  mime: string;
  ownerId: string;
}

function buildFilename(args: SaveArgs): string {
  const ext = EXT_FROM_MIME[args.mime.toLowerCase()] ?? "bin";
  const slug = randomBytes(8).toString("hex");
  return `${args.ownerId.slice(0, 12)}_${Date.now()}_${slug}.${ext}`;
}

function validate(args: SaveArgs): void {
  if (!ALLOWED_MIME[args.kind].test(args.mime)) {
    throw new Error(
      `Unsupported ${args.kind.slice(0, -1)} format: ${args.mime}`,
    );
  }
  if (args.data.byteLength > MAX_BYTES[args.kind]) {
    throw new Error(
      `${args.kind.slice(0, -1)} exceeds ${Math.round(
        MAX_BYTES[args.kind] / 1024 / 1024,
      )}MB limit`,
    );
  }
}

export async function saveUpload(args: SaveArgs): Promise<SaveResult> {
  // Trust the actual file bytes over whatever Content-Type the client sent —
  // this keeps the stored extension/mime accurate even when a client
  // mislabels the upload (see detectRealMime for why this matters).
  const realMime = detectRealMime(args.data, args.mime.toLowerCase());

  // Re-encode to a pdf-lib-safe format (JPEG/PNG) and bake in EXIF
  // orientation, so PDFs never silently drop/misrotate an image because of
  // an unsupported source format (HEIC/WebP) or ignored orientation tag.
  // Falls back to the original bytes if normalization isn't possible.
  const preferPng = args.kind === "logos" || args.kind === "stamps";
  const normalized =
    realMime === "image/svg+xml"
      ? null
      : await normalizeImage(Buffer.from(args.data), realMime, { preferPng });

  const finalData = normalized ? normalized.data : Buffer.from(args.data);
  const finalMime = normalized ? normalized.mime : realMime;

  const resolvedArgs: SaveArgs = { ...args, data: finalData, mime: finalMime };
  validate(resolvedArgs);

  const filename = buildFilename(resolvedArgs);
  const urlPath = `/uploads/${args.kind}/${filename}`;

  await prisma.upload.create({
    data: {
      path: urlPath,
      data: new Uint8Array(finalData),
      mime: finalMime,
      size: finalData.byteLength,
      ownerId: args.ownerId,
    },
  });

  return {
    url: urlPath,
    bytes: finalData.byteLength,
    mime: finalMime,
  };
}

/** Fetch file binary from the database by its URL path. */
export async function getUpload(
  urlPath: string,
): Promise<{ data: Buffer; mime: string } | null> {
  const record = await prisma.upload.findUnique({
    where: { path: urlPath },
    select: { data: true, mime: true },
  });
  if (!record) return null;
  return { data: Buffer.from(record.data), mime: record.mime };
}

/** Delete an upload by its URL path. */
export async function deleteUpload(urlPath: string): Promise<boolean> {
  try {
    await prisma.upload.delete({ where: { path: urlPath } });
    return true;
  } catch {
    return false;
  }
}

export function decodeDataUri(
  dataUri: string,
): { mime: string; data: Buffer } | null {
  const match = dataUri.match(/^data:(image\/[a-z0-9+.-]+);base64,(.+)$/i);
  if (!match) return null;
  return { mime: match[1].toLowerCase(), data: Buffer.from(match[2], "base64") };
}
