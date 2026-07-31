/**
 * Server-side image normalization for uploads (photos, logos, stamps).
 *
 * Why this exists:
 *  1. `pdf-lib` (used to generate LR PDFs) can only embed PNG or JPEG bytes.
 *     Photos captured on phones are sometimes HEIC/HEIF (iOS) or WebP
 *     (Android), which are allowed at upload time but would silently fail
 *     to embed later — the image would just be missing from the PDF.
 *  2. Raster decoders (including pdf-lib) draw raw pixel data and ignore
 *     the EXIF `Orientation` tag, so photos taken in portrait on phones
 *     that store orientation via EXIF (instead of physically rotating
 *     pixels) end up sideways/upside-down wherever they're rendered.
 *
 * `normalizeImage()` re-encodes any raster image to a pdf-lib-safe format
 * (JPEG, or PNG when transparency must be preserved) and bakes in EXIF
 * orientation via `sharp().rotate()` (no args = auto-orient from EXIF,
 * then strip it since it's no longer needed).
 *
 * This is deliberately fail-open: if `sharp` throws (corrupt image, missing
 * native binary on some constrained host, unsupported codec, etc.) we fall
 * back to the original bytes/mime so an upload never hard-fails because of
 * this optimization.
 */
import sharp from "sharp";

export interface NormalizedImage {
  data: Buffer;
  mime: "image/jpeg" | "image/png";
}

const MAX_DIMENSION = 2400;
const JPEG_QUALITY = 85;

/**
 * @param preferPng Preserve transparency (used for logos/stamps, where a
 *   transparent background is often intentional). Photos and signatures
 *   default to JPEG/PNG based on whether the source actually has alpha.
 */
export async function normalizeImage(
  data: Buffer,
  mime: string,
  opts: { preferPng?: boolean } = {},
): Promise<NormalizedImage | null> {
  // SVG is vector — nothing to raster-normalize, and pdf-lib can't embed it
  // anyway (handled separately by callers).
  if (mime === "image/svg+xml") return null;

  try {
    const pipeline = sharp(data, { failOn: "none" })
      .rotate() // auto-orient from EXIF, then strips the tag
      .resize({
        width: MAX_DIMENSION,
        height: MAX_DIMENSION,
        fit: "inside",
        withoutEnlargement: true,
      });

    const meta = await sharp(data, { failOn: "none" }).metadata();
    const hasAlpha = meta.hasAlpha ?? false;
    const wantsPng = opts.preferPng || hasAlpha;

    if (wantsPng) {
      const out = await pipeline.png({ compressionLevel: 8 }).toBuffer();
      return { data: out, mime: "image/png" };
    }

    const out = await pipeline
      .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
      .toBuffer();
    return { data: out, mime: "image/jpeg" };
  } catch (err) {
    console.error("[image-normalize] failed, keeping original bytes:", err);
    return null;
  }
}
