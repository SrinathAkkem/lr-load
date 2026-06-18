import { promises as fs } from "fs";
import path from "path";
import { randomBytes } from "crypto";

/**
 * File-storage facade with two interchangeable backends:
 *
 *   • "disk"        → writes to `UPLOAD_DIR` (default `<cwd>/public/uploads`).
 *                     Used for local dev, Hostinger Premium / VPS, and any
 *                     classic Node host with a writable filesystem.
 *
 *   • "vercel-blob" → uses `@vercel/blob` and stores files in Vercel's managed
 *                     blob bucket. Required on Vercel because the function
 *                     filesystem is read-only.
 *
 * Backend selection (in priority order):
 *   1. `STORAGE_DRIVER=vercel-blob | disk`     ← explicit override
 *   2. `BLOB_READ_WRITE_TOKEN` is set           → vercel-blob
 *   3. fallback                                  → disk
 *
 * Vercel auto-injects `BLOB_READ_WRITE_TOKEN` when a Blob store is connected
 * to the project, so a Vercel deploy needs zero env changes after setup.
 *
 * The public URLs returned by both backends are stored as-is in the existing
 * `LRRequest.photos` / `signatureUrl` columns and on `Company.logoUrl`
 * / `stampUrl`. The PDF generator and HTML pages handle both `/uploads/*`
 * and `https://*.vercel-storage.com/*` shapes transparently.
 */

const UPLOAD_KINDS = ["photos", "signatures", "logos", "stamps"] as const;
export type UploadKind = (typeof UPLOAD_KINDS)[number];

const ALLOWED_MIME: Record<UploadKind, RegExp> = {
  photos: /^image\/(jpe?g|png|webp|heic)$/i,
  signatures: /^image\/(png|svg\+xml|jpe?g)$/i,
  logos: /^image\/(jpe?g|png|webp|svg\+xml)$/i,
  stamps: /^image\/(jpe?g|png|webp|svg\+xml)$/i,
};

// Caps are sized for Vercel's 4.5 MB serverless request body limit on the
// Hobby tier. Bumping `photos` to 8 MB requires either Vercel Pro (32 MB
// configurable limit) or migrating to direct-to-blob client uploads.
const MAX_BYTES: Record<UploadKind, number> = {
  photos: 4 * 1024 * 1024,
  signatures: 1 * 1024 * 1024,
  logos: 2 * 1024 * 1024,
  stamps: 2 * 1024 * 1024,
};

const EXT_FROM_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/svg+xml": "svg",
};

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

type Driver = "disk" | "vercel-blob";

function resolveDriver(): Driver {
  const explicit = process.env.STORAGE_DRIVER?.toLowerCase().trim();
  if (explicit === "vercel-blob" || explicit === "disk") return explicit;
  if (process.env.BLOB_READ_WRITE_TOKEN) return "vercel-blob";
  return "disk";
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

// ── Disk backend ─────────────────────────────────────────────────────────────

function diskRoot(): string {
  return process.env.UPLOAD_DIR
    ? path.resolve(process.env.UPLOAD_DIR)
    : path.join(process.cwd(), "public", "uploads");
}

async function saveToDisk(args: SaveArgs): Promise<SaveResult> {
  const filename = buildFilename(args);
  const dir = path.join(diskRoot(), args.kind);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, filename), args.data);
  return {
    url: `/uploads/${args.kind}/${filename}`,
    bytes: args.data.byteLength,
    mime: args.mime,
  };
}

// ── Vercel Blob backend ──────────────────────────────────────────────────────

async function saveToVercelBlob(args: SaveArgs): Promise<SaveResult> {
  const { put } = await import("@vercel/blob");
  const filename = buildFilename(args);
  // `put()` types accept `Buffer` but not bare `Uint8Array`; normalize.
  const body = Buffer.isBuffer(args.data) ? args.data : Buffer.from(args.data);
  const result = await put(`${args.kind}/${filename}`, body, {
    access: "public",
    contentType: args.mime,
    addRandomSuffix: false,
    cacheControlMaxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return {
    url: result.url,
    bytes: body.byteLength,
    mime: args.mime,
  };
}

// ── Public API ───────────────────────────────────────────────────────────────

export async function saveUpload(args: SaveArgs): Promise<SaveResult> {
  validate(args);
  return resolveDriver() === "vercel-blob"
    ? saveToVercelBlob(args)
    : saveToDisk(args);
}

/** Decode a `data:image/png;base64,...` payload into raw bytes + mime. */
export function decodeDataUri(
  dataUri: string,
): { mime: string; data: Buffer } | null {
  const match = dataUri.match(/^data:(image\/[a-z0-9+.-]+);base64,(.+)$/i);
  if (!match) return null;
  return { mime: match[1].toLowerCase(), data: Buffer.from(match[2], "base64") };
}
