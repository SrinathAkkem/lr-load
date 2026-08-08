import { NextRequest } from "next/server";
import {
  forbidden,
  getAuthFromRequest,
  unauthorized,
} from "@/lib/api/auth-middleware";
import { jsonError, jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { toBranch } from "@/lib/db/serialize";
import { createBranchSchema } from "@/lib/validations/lr";

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

  const branches = await prisma.branch.findMany({
    where: { companyId: session.companyId },
    orderBy: { createdAt: "asc" },
    include: {
      _count: {
        select: {
          users: { where: { role: "executive" } },
          lrRequests: true,
        },
      },
      lrRequests: {
        where: { createdAt: { gte: monthStart, lt: monthEnd } },
        select: { freightAmount: true, status: true },
      },
    },
  });

  return jsonOk(
    branches.map((b) => ({
      ...toBranch(b),
      executiveCount: b._count.users,
      totalLrs: b._count.lrRequests,
      lrsThisMonth: b.lrRequests.length,
      rejectedThisMonth: b.lrRequests.filter((lr) => lr.status === "rejected").length,
      freight: b.lrRequests.reduce(
        (sum, lr) => sum + Number(lr.freightAmount.toString()),
        0,
      ),
    })),
  );
}

export async function POST(req: NextRequest) {
  const session = await getAuthFromRequest(req);
  if (!session) return unauthorized();
  if (session.role !== "company_admin" || !session.companyId) return forbidden();

  const body = await req.json().catch(() => ({}));
  const parsed = createBranchSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.errors[0]?.message ?? "Invalid input");
  }

  const company = await prisma.company.findUnique({
    where: { id: session.companyId },
  });
  if (!company) return jsonError("Company not found", 404);

  const existingCount = await prisma.branch.count({
    where: { companyId: session.companyId },
  });
  if (existingCount >= company.maxBranches) {
    return jsonError("Branch limit reached");
  }

  const branch = await prisma.branch.create({
    data: { ...parsed.data, companyId: session.companyId },
  });
  return jsonOk(toBranch(branch), 201);
}
