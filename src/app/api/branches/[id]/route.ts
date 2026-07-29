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
import { recordAuditEvent } from "@/lib/services/audit-log";

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
  const branch = await prisma.branch.findUnique({ where: { id } });
  if (!branch || branch.companyId !== session.companyId) {
    return jsonError("Branch not found", 404);
  }

  const body = await req.json().catch(() => ({}));
  const parsed = createBranchSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.errors[0]?.message ?? "Invalid input");
  }

  const updated = await prisma.branch.update({
    where: { id },
    data: parsed.data,
  });

  await recordAuditEvent({
    actorId: session.userId,
    actorName: session.name,
    actorRole: session.role,
    companyId: session.companyId,
    action: "branch.update",
    target: updated.name,
    metadata: parsed.data as Record<string, unknown>,
    ip: req.headers.get("x-forwarded-for") ?? null,
  });

  return jsonOk(toBranch(updated));
}

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
  const branch = await prisma.branch.findUnique({
    where: { id },
    include: {
      _count: { select: { users: true, lrRequests: true } },
    },
  });
  if (!branch || branch.companyId !== session.companyId) {
    return jsonError("Branch not found", 404);
  }

  if (branch._count.users > 0 || branch._count.lrRequests > 0) {
    return jsonError(
      "Branch has executives or LRs attached. Reassign them before deleting.",
      409,
    );
  }

  await prisma.branch.delete({ where: { id } });

  await recordAuditEvent({
    actorId: session.userId,
    actorName: session.name,
    actorRole: session.role,
    companyId: session.companyId,
    action: "branch.delete",
    target: branch.name,
    ip: req.headers.get("x-forwarded-for") ?? null,
  });

  return jsonOk({ ok: true });
}
