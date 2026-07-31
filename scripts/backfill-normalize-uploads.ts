/**
 * One-off backfill: re-normalize every existing `Upload` row (logos, stamps,
 * signatures, photos) with the same pipeline `saveUpload()` now applies to
 * new uploads — real-mime sniffing, EXIF auto-rotate, and re-encoding to a
 * pdf-lib-safe format (JPEG/PNG).
 *
 * This fixes images uploaded *before* the fix (mislabeled Content-Type from
 * the mobile app, sideways photos from ignored EXIF orientation, HEIC/WebP
 * photos that silently failed to embed in generated PDFs).
 *
 * Safe to run multiple times (idempotent — already-normalized rows are
 * re-processed but come out unchanged). The `path` (public URL) is never
 * modified, only `data`/`mime`/`size`, so nothing that references the old
 * URL (Company.logoUrl, LRRequest.signatureUrl, LRPhoto.url, etc.) breaks.
 *
 * Usage:
 *   npx tsx scripts/backfill-normalize-uploads.ts [--dry-run]
 */
import { PrismaClient } from "@prisma/client";
import { normalizeImage } from "../src/lib/storage/image-normalize";

const prisma = new PrismaClient();

function detectRealMime(data: Buffer, fallback: string): string {
  const b = data;
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
  const head = b.slice(0, 256).toString("utf8").trim().toLowerCase();
  if (head.startsWith("<?xml") || head.startsWith("<svg")) return "image/svg+xml";
  return fallback;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  console.log(`[backfill] starting${dryRun ? " (dry run)" : ""}...`);

  const uploads = await prisma.upload.findMany({
    select: { id: true, path: true, data: true, mime: true },
  });
  console.log(`[backfill] found ${uploads.length} upload row(s)`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of uploads) {
    try {
      const data = Buffer.from(row.data);
      const realMime = detectRealMime(data, row.mime.toLowerCase());

      if (realMime === "image/svg+xml") {
        if (row.mime !== realMime) {
          if (!dryRun) {
            await prisma.upload.update({
              where: { id: row.id },
              data: { mime: realMime },
            });
          }
          console.log(`[backfill] ${row.path}: mime ${row.mime} -> ${realMime} (svg, no re-encode)`);
          updated++;
        } else {
          skipped++;
        }
        continue;
      }

      const preferPng = row.path.includes("/logos/") || row.path.includes("/stamps/");
      const normalized = await normalizeImage(data, realMime, { preferPng });

      if (!normalized) {
        skipped++;
        continue;
      }

      const changed =
        normalized.mime !== row.mime || normalized.data.length !== data.length;

      if (changed) {
        console.log(
          `[backfill] ${row.path}: ${row.mime} (${data.length}b) -> ${normalized.mime} (${normalized.data.length}b)`,
        );
        if (!dryRun) {
          await prisma.upload.update({
            where: { id: row.id },
            data: {
              mime: normalized.mime,
              data: new Uint8Array(normalized.data),
              size: normalized.data.length,
            },
          });
        }
        updated++;
      } else {
        skipped++;
      }
    } catch (err) {
      failed++;
      console.error(`[backfill] FAILED ${row.path}:`, err);
    }
  }

  console.log(
    `[backfill] done. updated=${updated} skipped=${skipped} failed=${failed} total=${uploads.length}`,
  );
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("[backfill] fatal error:", err);
  await prisma.$disconnect();
  process.exit(1);
});
