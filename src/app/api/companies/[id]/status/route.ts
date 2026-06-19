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

  if (status !== "active" && status !== "suspended") {
    return jsonError("status must be 'active' or 'suspended'", 400);
  }

  try {
    const updated = await prisma.company.update({
      where: { id },
      data: { status },
    });
    await recordAuditEvent({
      actorId: session.userId,
      actorName: session.name,
      actorRole: session.role,
      companyId: id,
      action: status === "active" ? "company.activate" : "company.suspend",
      target: updated.name,
      ip: req.headers.get("x-forwarded-for") ?? null,
    });
    return jsonOk(toCompany(updated));
  } catch {
    return jsonError("Company not found", 404);
  }
}
