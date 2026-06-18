import { NextRequest } from "next/server";
import {
  forbidden,
  getAuthFromRequest,
  unauthorized,
} from "@/lib/api/auth-middleware";
import { jsonError, jsonOk } from "@/lib/api/response";
import { saveUpload } from "@/lib/storage/local-storage";

export async function POST(req: NextRequest) {
  const session = await getAuthFromRequest(req);
  if (!session) return unauthorized();
  if (session.role !== "company_admin") return forbidden();

  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return jsonError("file field is required", 400);
    }
    const buf = Buffer.from(await file.arrayBuffer());
    const result = await saveUpload({
      kind: "logos",
      data: buf,
      mime: file.type || "image/png",
      ownerId: session.companyId ?? session.userId,
    });
    return jsonOk(result, 201);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Upload failed", 400);
  }
}
