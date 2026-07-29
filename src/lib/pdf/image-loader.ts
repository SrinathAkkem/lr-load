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
      const lower = url.toLowerCase();
      if (lower.endsWith(".svg")) return null;
      const file = await getUpload(url);
      if (!file) return null;
      const kind: "png" | "jpg" = lower.endsWith(".png") ? "png" : "jpg";
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
