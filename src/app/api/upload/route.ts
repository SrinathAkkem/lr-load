import { NextRequest } from "next/server";
import {
  forbidden,
  getAuthFromRequest,
  unauthorized,
} from "@/lib/api/auth-middleware";
import { jsonError, jsonOk } from "@/lib/api/response";
import { saveUpload, type UploadKind } from "@/lib/storage/local-storage";

const KIND_FROM_LEGACY: Record<string, UploadKind> = {
  photo: "photos",
  goods_photo: "photos",
  goods: "photos",
  signature: "signatures",
  logo: "logos",
  stamp: "stamps",
};

const ROLE_FOR_KIND: Record<UploadKind, ("executive" | "company_admin")[]> = {
  photos: ["executive"],
  signatures: ["executive"],
  logos: ["company_admin"],
  stamps: ["company_admin"],
};

/**
 * Legacy generic upload endpoint kept for backward compatibility with the web
 * Company Profile page. Prefer `/api/upload/photo`, `/api/upload/signature`,
 * `/api/upload/logo`, `/api/upload/stamp` for new code.
 */
export async function POST(req: NextRequest) {
  const session = await getAuthFromRequest(req);
  if (!session) return unauthorized();

  try {
    const form = await req.formData();
    const typeField = String(form.get("type") ?? "photo").toLowerCase();
    const kind = KIND_FROM_LEGACY[typeField];
    if (!kind) return jsonError("Unknown upload type", 400);

    const allowedRoles = ROLE_FOR_KIND[kind];
    if (
      session.role !== "super_admin" &&
      !allowedRoles.includes(session.role as "executive" | "company_admin")
    ) {
      return forbidden();
    }

    const file = form.get("file");
    if (!(file instanceof File)) {
      return jsonError("file field is required", 400);
    }
    const buf = Buffer.from(await file.arrayBuffer());

    const result = await saveUpload({
      kind,
      data: buf,
      mime: file.type || "image/jpeg",
      ownerId: session.userId,
    });
    return jsonOk(result, 201);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Upload failed", 400);
  }
}
