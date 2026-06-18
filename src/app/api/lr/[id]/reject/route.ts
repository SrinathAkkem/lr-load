import { NextRequest } from "next/server";
import {
  forbidden,
  getAuthFromRequest,
  unauthorized,
} from "@/lib/api/auth-middleware";
import { jsonError, jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { rejectLR } from "@/lib/services/lr-service";
import { rejectLRSchema } from "@/lib/validations/lr";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAuthFromRequest(req);
  if (!session) return unauthorized();
  if (session.role !== "company_admin") return forbidden();

  const { id } = await params;
  const lr = await prisma.lRRequest.findUnique({
    where: { id },
    select: { companyId: true },
  });
  if (!lr) return jsonError("LR not found", 404);
  if (lr.companyId !== session.companyId) return forbidden();

  const body = await req.json().catch(() => ({}));
  const parsed = rejectLRSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.errors[0]?.message ?? "Reason required");
  }

  try {
    const updated = await rejectLR(id, parsed.data.reason);
    return jsonOk(updated);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Reject failed");
  }
}
