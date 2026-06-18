import { NextRequest } from "next/server";
import {
  forbidden,
  getAuthFromRequest,
  unauthorized,
} from "@/lib/api/auth-middleware";
import { jsonError, jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { toUser } from "@/lib/db/serialize";
import { inviteDriverSchema } from "@/lib/validations/lr";

/**
 * Invite a driver by mobile number. The created `User` row starts in
 * `invited` status and is flipped to `active` on first successful OTP verify.
 *
 * Same logic as `POST /api/drivers` — kept here as a brief-aligned alias.
 */
export async function POST(req: NextRequest) {
  const session = await getAuthFromRequest(req);
  if (!session) return unauthorized();
  if (session.role !== "company_admin" || !session.companyId) {
    return forbidden();
  }

  const body = await req.json().catch(() => ({}));
  const parsed = inviteDriverSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.errors[0]?.message ?? "Invalid input");
  }

  const company = await prisma.company.findUnique({
    where: { id: session.companyId },
  });
  if (!company) return jsonError("Company not found", 404);

  const existingCount = await prisma.user.count({
    where: { companyId: session.companyId, role: "driver" },
  });
  if (existingCount >= company.maxDrivers) {
    return jsonError(
      "Driver limit reached. Contact the platform admin to raise it.",
    );
  }

  const duplicate = await prisma.user.findUnique({
    where: { mobile: parsed.data.mobile },
  });
  if (duplicate) return jsonError("Mobile number already registered", 409);

  const branch = await prisma.branch.findFirst({
    where: { id: parsed.data.branchId, companyId: session.companyId },
  });
  if (!branch) return jsonError("Branch does not belong to this company", 400);

  const driver = await prisma.user.create({
    data: {
      mobile: parsed.data.mobile,
      role: "driver",
      companyId: session.companyId,
      branchId: parsed.data.branchId,
      name: parsed.data.name?.trim() || `Driver ${parsed.data.mobile.slice(-4)}`,
      status: "invited",
    },
  });
  return jsonOk(toUser(driver), 201);
}
