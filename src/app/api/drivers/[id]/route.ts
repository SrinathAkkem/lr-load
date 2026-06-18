import { NextRequest } from "next/server";
import {
  forbidden,
  getAuthFromRequest,
  unauthorized,
} from "@/lib/api/auth-middleware";
import { jsonError, jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";

/**
 * Soft-deactivate a driver. We don't hard delete because the driver may have
 * historical LRs whose `driverId` is a required FK. Setting `status` to
 * `inactive` is enough to keep them out of dispatch lists and force a
 * re-invite if they need to come back.
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
  const driver = await prisma.user.findUnique({ where: { id } });
  if (!driver || driver.role !== "driver") {
    return jsonError("Driver not found", 404);
  }
  if (driver.companyId !== session.companyId) return forbidden();

  await prisma.user.update({
    where: { id },
    data: { status: "inactive" },
  });
  return jsonOk({ id, status: "inactive" });
}
