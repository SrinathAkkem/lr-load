import { getUpload } from "@/lib/storage/local-storage";

/**
 * Load image bytes for PDF embedding from:
 *   • data URIs (mobile signatures)
 *   • `/uploads/...` from MySQL (stored uploads)
 *   • `http(s)://...` absolute URLs (legacy or external CDN)
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

    if (url.startsWith("/uploads/")) {
      const file = await getUpload(url);
      if (!file) return null;
      // Trust the stored mime (sniffed from real bytes at upload time and
      // normalized to jpeg/png), not the filename extension — legacy
      // records or edge cases could otherwise mismatch the extension.
      if (file.mime === "image/svg+xml") return null;
      const kind: "png" | "jpg" = file.mime === "image/png" ? "png" : "jpg";
      return { bytes: new Uint8Array(file.data), kind };
    }

    if (url.startsWith("http://") || url.startsWith("https://")) {
      const res = await fetch(url);
      if (!res.ok) return null;
      const buf = Buffer.from(await res.arrayBuffer());
      const ct = res.headers.get("content-type") ?? "";
      const kind = ct.includes("png") ? "png" : "jpg";
      return { bytes: new Uint8Array(buf), kind };
    }
  } catch {
    return null;
  }

  return null;
}
