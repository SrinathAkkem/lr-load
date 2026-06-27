import { NextRequest } from "next/server";
import {
  forbidden,
  getAuthFromRequest,
  unauthorized,
} from "@/lib/api/auth-middleware";
import { jsonError, jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { toBranch, toCompany, toUser } from "@/lib/db/serialize";
import { inviteExecutiveSchema } from "@/lib/validations/lr";
import type { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getAuthFromRequest(req);
  if (!session) return unauthorized();

  const url = new URL(req.url);
  const search = url.searchParams.get("search")?.trim().toLowerCase() ?? "";
  const statusFilter = url.searchParams.get("status");
  const companyFilter = url.searchParams.get("companyId");

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

  const where: Prisma.UserWhereInput = { role: "executive" };
  if (session.role === "company_admin") {
    if (!session.companyId) return forbidden();
    where.companyId = session.companyId;
  } else if (session.role === "super_admin") {
    if (companyFilter) where.companyId = companyFilter;
  } else {
    return forbidden();
  }

  if (statusFilter && ["active", "invited", "inactive"].includes(statusFilter)) {
    where.status = statusFilter as Prisma.UserWhereInput["status"];
  }
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { mobile: { contains: search } },
    ];
  }

  const executives = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      branch: true,
      ...(session.role === "super_admin" ? { company: true } : {}),
      executiveLrs: {
        where: { createdAt: { gte: monthStart, lt: monthEnd } },
        select: { id: true },
      },
    },
  });

  const executiveIds = executives.map((d) => d.id);
  const latestLrs = await prisma.lRRequest.groupBy({
    by: ["executiveId"],
    where: { executiveId: { in: executiveIds } },
    _max: { createdAt: true },
  });
  const lastActiveMap = new Map(
    latestLrs.map((l) => [l.executiveId, l._max.createdAt]),
  );

  return jsonOk(
    executives.map((d) => ({
      ...toUser(d),
      branch: d.branch ? toBranch(d.branch) : null,
      company:
        session.role === "super_admin" && (d as typeof d & { company: unknown }).company
          ? toCompany(
              (d as typeof d & { company: Parameters<typeof toCompany>[0] })
                .company,
            )
          : null,
      lrsThisMonth: d.executiveLrs.length,
      lastActive: lastActiveMap.get(d.id)?.toISOString() ?? null,
    })),
  );
}

export async function POST(req: NextRequest) {
  const session = await getAuthFromRequest(req);
  if (!session) return unauthorized();
  if (session.role !== "company_admin" || !session.companyId) return forbidden();

  const body = await req.json().catch(() => ({}));
  const parsed = inviteExecutiveSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.errors[0]?.message ?? "Invalid input");
  }

  const company = await prisma.company.findUnique({
    where: { id: session.companyId },
  });
  if (!company) return jsonError("Company not found", 404);

  const existingCount = await prisma.user.count({
    where: { companyId: session.companyId, role: "executive" },
  });
  if (existingCount >= company.maxExecutives) {
    return jsonError("Executive limit reached");
  }

  const duplicate = await prisma.user.findUnique({
    where: { mobile: parsed.data.mobile },
  });
  if (duplicate) return jsonError("Mobile number already registered");

  const branch = await prisma.branch.findFirst({
    where: { id: parsed.data.branchId, companyId: session.companyId },
  });
  if (!branch) return jsonError("Branch does not belong to this company", 400);

  const executive = await prisma.user.create({
    data: {
      mobile: parsed.data.mobile,
      role: "executive",
      companyId: session.companyId,
      branchId: parsed.data.branchId,
      name: `Executive ${parsed.data.mobile.slice(-4)}`,
      status: "invited",
    },
  });
  return jsonOk(toUser(executive), 201);
}
