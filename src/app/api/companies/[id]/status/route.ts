import { NextRequest } from "next/server";
import {
  forbidden,
  getAuthFromRequest,
  unauthorized,
} from "@/lib/api/auth-middleware";
import { jsonError, jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { toCompany } from "@/lib/db/serialize";
import { recordAuditEvent } from "@/lib/services/audit-log";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAuthFromRequest(req);
  if (!session) return unauthorized();
  if (session.role !== "super_admin") return forbidden();

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const status = body.status;
  const rejectionReason =
    typeof body.rejectionReason === "string" ? body.rejectionReason.trim() : undefined;

  if (status !== "active" && status !== "suspended" && status !== "pending") {
    return jsonError("status must be 'pending', 'active' or 'suspended'", 400);
  }

  try {
    const existing = await prisma.company.findUnique({ where: { id } });
    if (!existing) return jsonError("Company not found", 404);

    const wasPending = existing.status === "pending";
    const updated = await prisma.company.update({
      where: { id },
      data: {
        status,
        // Clear a stale rejection reason on (re)activation; store a fresh one
        // when a pending registration is rejected.
        rejectionReason:
          status === "suspended" && rejectionReason
            ? rejectionReason
            : status === "active"
              ? null
              : existing.rejectionReason,
      },
    });

    if (wasPending) {
      const admin = await prisma.user.findFirst({
        where: { companyId: id, role: "company_admin" },
        select: { id: true },
      });
      if (admin) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            title: status === "active" ? "Company approved" : "Registration rejected",
            message:
              status === "active"
                ? `${updated.name} has been approved. You can now create LRs.`
                : `${updated.name}'s registration was rejected.${rejectionReason ? ` Reason: ${rejectionReason}` : ""}`,
          },
        });
      }
    }

    await recordAuditEvent({
      actorId: session.userId,
      actorName: session.name,
      actorRole: session.role,
      companyId: id,
      action:
        wasPending && status === "active"
          ? "company.approve"
          : wasPending
            ? "company.reject"
            : status === "active"
              ? "company.activate"
              : "company.suspend",
      target: updated.name,
      metadata: rejectionReason ? { rejectionReason } : undefined,
      ip: req.headers.get("x-forwarded-for") ?? null,
    });
    return jsonOk(toCompany(updated));
  } catch {
    return jsonError("Company not found", 404);
  }
}
