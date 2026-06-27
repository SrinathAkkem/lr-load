import { NextRequest } from "next/server";
import {
  forbidden,
  getAuthFromRequest,
  unauthorized,
} from "@/lib/api/auth-middleware";
import { jsonError, jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { toBranch, toLR, toUser } from "@/lib/db/serialize";
import { createLRSchema } from "@/lib/validations/lr";
import { createLR } from "@/lib/services/lr-service";
import type { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getAuthFromRequest(req);
  if (!session) return unauthorized();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search")?.trim();
  const branchId = searchParams.get("branchId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: Prisma.LRRequestWhereInput = {};
  if (session.role === "executive") {
    where.executiveId = session.userId;
  } else if (session.role === "company_admin" && session.companyId) {
    where.companyId = session.companyId;
  }

  if (status && status !== "all") {
    where.status = status as Prisma.LRRequestWhereInput["status"];
  }

  if (branchId && branchId !== "all") {
    where.branchId = branchId;
  }

  if (from || to) {
    where.createdAt = {};
    if (from) {
      where.createdAt.gte = new Date(from);
    }
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      where.createdAt.lte = toDate;
    }
  }

  if (search) {
    where.OR = [
      { trackingId: { contains: search } },
      { lrNumber: { contains: search } },
      { consigneeName: { contains: search } },
      { consignorName: { contains: search } },
    ];
  }

  const lrs = await prisma.lRRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { executive: true, branch: true },
  });

  return jsonOk(
    lrs.map((lr) => ({
      ...toLR(lr),
      executive: toUser(lr.executive),
      branch: toBranch(lr.branch),
    })),
  );
}

export async function POST(req: NextRequest) {
  const session = await getAuthFromRequest(req);
  if (!session) return unauthorized();
  if (session.role !== "executive") return forbidden();

  const body = await req.json().catch(() => ({}));
  const parsed = createLRSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.errors[0]?.message ?? "Validation failed");
  }

  if (!session.companyId || !session.branchId) {
    return jsonError("Executive not assigned to a branch", 400);
  }

  try {
    const lr = await createLR(
      session.userId,
      session.companyId,
      session.branchId,
      parsed.data,
    );
    return jsonOk(lr, 201);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Failed to create LR");
  }
}
