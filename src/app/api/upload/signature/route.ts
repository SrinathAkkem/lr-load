import { NextRequest } from "next/server";
import {
  forbidden,
  getAuthFromRequest,
  unauthorized,
} from "@/lib/api/auth-middleware";
import { jsonError, jsonOk } from "@/lib/api/response";
import { saveUpload } from "@/lib/storage/local-storage";

/**
 * Driver uploads a finger-drawn signature image. Signature canvases on the
 * mobile app emit a base64 PNG data URI, so we accept JSON-only here for
 * symmetry with the photo route.
 */
export async function POST(req: NextRequest) {
  const session = await getAuthFromRequest(req);
  if (!session) return unauthorized();
  if (session.role !== "driver") return forbidden();

  try {
    const body = await req.json().catch(() => ({}));
    const dataUri = typeof body.data === "string" ? body.data : null;
    if (!dataUri) return jsonError("data (data URI) is required", 400);

    const match = dataUri.match(/^data:(image\/[a-z0-9+.-]+);base64,(.+)$/i);
    if (!match) return jsonError("Invalid data URI", 400);

    const result = await saveUpload({
      kind: "signatures",
      data: Buffer.from(match[2], "base64"),
      mime: match[1].toLowerCase(),
      ownerId: session.userId,
    });
    return jsonOk(result, 201);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Upload failed", 400);
  }
}
