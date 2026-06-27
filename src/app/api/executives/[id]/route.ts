import { NextRequest } from "next/server";
import {
  forbidden,
  getAuthFromRequest,
  unauthorized,
} from "@/lib/api/auth-middleware";
import { jsonError, jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";

/**
 * Soft-deactivate an executive. We don't hard delete because they may have
 * historical LRs whose `executiveId` is a required FK.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAuthFromRequest(req);
  if (!session) return unauthorized();
  if (session.role !== "company_admin" || !session.companyId) {
    return forbidden();
  }

  const { id } = await params;
  const executive = await prisma.user.findUnique({ where: { id } });
  if (!executive || executive.role !== "executive") {
    return jsonError("Executive not found", 404);
  }
  if (executive.companyId !== session.companyId) return forbidden();

  await prisma.user.update({
    where: { id },
    data: { status: "inactive" },
  });
  return jsonOk({ id, status: "inactive" });
}
