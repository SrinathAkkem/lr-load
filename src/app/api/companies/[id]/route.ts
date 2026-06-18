import { NextRequest } from "next/server";
import {
  forbidden,
  getAuthFromRequest,
  unauthorized,
} from "@/lib/api/auth-middleware";
import { jsonError, jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { toBranch, toCompany, toUser } from "@/lib/db/serialize";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAuthFromRequest(req);
  if (!session) return unauthorized();

  const { id } = await params;

  if (session.role !== "super_admin" && session.companyId !== id) {
    return forbidden();
  }

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

  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      branches: { orderBy: { createdAt: "asc" } },
      users: { where: { role: "driver" }, orderBy: { createdAt: "desc" } },
      _count: {
        select: {
          branches: true,
          users: { where: { role: "driver" } },
          lrRequests: {
            where: { createdAt: { gte: monthStart, lt: monthEnd } },
          },
        },
      },
    },
  });
  if (!company) return jsonError("Company not found", 404);

  return jsonOk({
    ...toCompany(company),
    branchCount: company._count.branches,
    driverCount: company._count.users,
    lrsThisMonth: company._count.lrRequests,
    branches: company.branches.map(toBranch),
    drivers: company.users.map(toUser),
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAuthFromRequest(req);
  if (!session) return unauthorized();
  if (session.role !== "super_admin") return forbidden();

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const data: {
    maxBranches?: number;
    maxDrivers?: number;
    maxLrPerMonth?: number;
    status?: "active" | "suspended";
  } = {};
  if (body.maxBranches !== undefined) data.maxBranches = Number(body.maxBranches);
  if (body.maxDrivers !== undefined) data.maxDrivers = Number(body.maxDrivers);
  if (body.maxLrPerMonth !== undefined) {
    data.maxLrPerMonth = Number(body.maxLrPerMonth);
  }
  if (body.status === "active" || body.status === "suspended") {
    data.status = body.status;
  }

  const updated = await prisma.company.update({ where: { id }, data });
  return jsonOk(toCompany(updated));
}
