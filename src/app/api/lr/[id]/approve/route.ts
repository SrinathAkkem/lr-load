import { NextRequest } from "next/server";
import {
  forbidden,
  getAuthFromRequest,
  unauthorized,
} from "@/lib/api/auth-middleware";
import { jsonError, jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { approveLR } from "@/lib/services/lr-service";

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

  try {
    const updated = await approveLR(id, session.userId);
    return jsonOk(updated);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Approve failed");
  }
}
