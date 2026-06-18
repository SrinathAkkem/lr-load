import { promises as fs } from "fs";
import path from "path";

/**
 * Load image bytes from any of:
 *   • `data:image/png;base64,...` — base64 data URIs (mobile signatures)
 *   • `http(s)://...`             — remote logos / stamps hosted on a CDN
 *   • `/uploads/...`              — files served out of the local `public/`
 *
 * Returns the raw bytes plus a `kind` hint so the caller can choose the right
 * pdf-lib embed function (`embedPng` vs `embedJpg`). `null` is returned when
 * the URL is missing / unreadable so the PDF can render a placeholder instead
 * of failing the whole request.
 */
export async function loadImageBytes(
  url: string | null | undefined,
): Promise<{ bytes: Uint8Array; kind: "png" | "jpg" } | null> {
  if (!url) return null;

  try {
    if (url.startsWith("data:")) {
      const match = url.match(/^data:(image\/[a-z0-9+.-]+);base64,(.+)$/i);
      if (!match) return null;
      const mime = match[1].toLowerCase();
      const buf = Buffer.from(match[2], "base64");
      const kind = mime.includes("png") ? "png" : "jpg";
      return { bytes: new Uint8Array(buf), kind };
    }

    if (url.startsWith("http://") || url.startsWith("https://")) {
      const res = await fetch(url);
      if (!res.ok) return null;
      const buf = Buffer.from(await res.arrayBuffer());
      const ct = res.headers.get("content-type") ?? "";
      const kind = ct.includes("png") ? "png" : "jpg";
      return { bytes: new Uint8Array(buf), kind };
    }

    if (url.startsWith("/")) {
      const filePath = path.join(process.cwd(), "public", url.replace(/^\//, ""));
      const buf = await fs.readFile(filePath);
      const lower = url.toLowerCase();
      const kind: "png" | "jpg" = lower.endsWith(".png") ? "png" : "jpg";
      return { bytes: new Uint8Array(buf), kind };
    }
  } catch {
    return null;
  }

  return null;
}
