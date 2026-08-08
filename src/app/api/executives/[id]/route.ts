import { NextRequest } from "next/server";
import {
  forbidden,
  getAuthFromRequest,
  unauthorized,
} from "@/lib/api/auth-middleware";
import { jsonError, jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { toUser } from "@/lib/db/serialize";
import { normalizeIndianMobile } from "@/lib/phone";

/**
 * Update an executive's branch assignment and/or mobile number.
 */
export async function PUT(
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

  const body = await req.json().catch(() => ({}));
  const data: { branchId?: string; mobile?: string } = {};

  if (body.branchId !== undefined) {
    const branch = await prisma.branch.findFirst({
      where: { id: String(body.branchId), companyId: session.companyId },
    });
    if (!branch) return jsonError("Branch does not belong to this company", 400);
    data.branchId = branch.id;
  }

  if (body.mobile !== undefined) {
    const mobile = normalizeIndianMobile(String(body.mobile));
    if (!/^\d{10}$/.test(mobile)) {
      return jsonError("Mobile must be 10 digits", 400);
    }
    if (mobile !== executive.mobile) {
      const taken = await prisma.user.findUnique({ where: { mobile } });
      if (taken) return jsonError("Mobile number already registered", 409);
      data.mobile = mobile;
    }
  }

  const updated = await prisma.user.update({ where: { id }, data });
  return jsonOk(toUser(updated));
}

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
