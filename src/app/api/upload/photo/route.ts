import { NextRequest } from "next/server";
import {
  forbidden,
  getAuthFromRequest,
  unauthorized,
} from "@/lib/api/auth-middleware";
import { jsonError, jsonOk } from "@/lib/api/response";
import { saveUpload } from "@/lib/storage/local-storage";

/**
 * Executive uploads a goods photo from the mobile app.
 *
 * Accepts either:
 *   • multipart/form-data with `file` (preferred, used by RN's FormData)
 *   • application/json `{ "data": "data:image/png;base64,..." }`
 */
export async function POST(req: NextRequest) {
  const session = await getAuthFromRequest(req);
  if (!session) return unauthorized();
  if (session.role !== "executive") return forbidden();

  try {
    const ct = req.headers.get("content-type") ?? "";
    if (ct.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      if (!(file instanceof File)) {
        return jsonError("file field is required", 400);
      }
      const buf = Buffer.from(await file.arrayBuffer());
      const result = await saveUpload({
        kind: "photos",
        data: buf,
        mime: file.type || "image/jpeg",
        ownerId: session.userId,
      });
      return jsonOk(result, 201);
    }

    const body = await req.json().catch(() => ({}));
    const dataUri = typeof body.data === "string" ? body.data : null;
    if (!dataUri) return jsonError("data (data URI) is required", 400);

    const match = dataUri.match(/^data:(image\/[a-z0-9+.-]+);base64,(.+)$/i);
    if (!match) return jsonError("Invalid data URI", 400);

    const result = await saveUpload({
      kind: "photos",
      data: Buffer.from(match[2], "base64"),
      mime: match[1].toLowerCase(),
      ownerId: session.userId,
    });
    return jsonOk(result, 201);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Upload failed", 400);
  }
}
