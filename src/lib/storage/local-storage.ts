import { randomBytes } from "crypto";
import { prisma } from "@/lib/db/prisma";

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
  validate(args);

  const filename = buildFilename(args);
  const urlPath = `/uploads/${args.kind}/${filename}`;

  await prisma.upload.create({
    data: {
      path: urlPath,
      data: Buffer.from(args.data),
      mime: args.mime,
      size: args.data.byteLength,
      ownerId: args.ownerId,
    },
  });

  return {
    url: urlPath,
    bytes: args.data.byteLength,
    mime: args.mime,
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
