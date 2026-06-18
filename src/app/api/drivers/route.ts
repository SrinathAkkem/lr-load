import { NextRequest } from "next/server";
import {
  forbidden,
  getAuthFromRequest,
  unauthorized,
} from "@/lib/api/auth-middleware";
import { jsonError, jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { toBranch, toUser } from "@/lib/db/serialize";
import { inviteDriverSchema } from "@/lib/validations/lr";

export async function GET(req: NextRequest) {
  const session = await getAuthFromRequest(req);
  if (!session) return unauthorized();
  if (session.role !== "company_admin" || !session.companyId) return forbidden();

  const monthStart = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1,
  );
  const monthEnd = new Date(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    1,
  );

  const drivers = await prisma.user.findMany({
    where: { companyId: session.companyId, role: "driver" },
    orderBy: { createdAt: "desc" },
    include: {
      branch: true,
      driverLrs: {
        where: { createdAt: { gte: monthStart, lt: monthEnd } },
        select: { id: true },
      },
    },
  });

  return jsonOk(
    drivers.map((d) => ({
      ...toUser(d),
      branch: d.branch ? toBranch(d.branch) : null,
      lrsThisMonth: d.driverLrs.length,
    })),
  );
}

export async function POST(req: NextRequest) {
  const session = await getAuthFromRequest(req);
  if (!session) return unauthorized();
  if (session.role !== "company_admin" || !session.companyId) return forbidden();

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
    return jsonError("Driver limit reached");
  }

  const duplicate = await prisma.user.findUnique({
    where: { mobile: parsed.data.mobile },
  });
  if (duplicate) return jsonError("Mobile number already registered");

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
      name: `Driver ${parsed.data.mobile.slice(-4)}`,
      status: "invited",
    },
  });
  return jsonOk(toUser(driver), 201);
}
