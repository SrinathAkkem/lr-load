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

  const data: {
    maxBranches?: number;
    maxExecutives?: number;
    maxLrPerMonth?: number;
  } = {};
  if (body.maxBranches !== undefined)
    data.maxBranches = Math.max(1, Number(body.maxBranches));
  if (body.maxExecutives !== undefined)
    data.maxExecutives = Math.max(1, Number(body.maxExecutives));
  if (body.maxLrPerMonth !== undefined)
    data.maxLrPerMonth = Math.max(1, Number(body.maxLrPerMonth));

  if (Object.keys(data).length === 0) {
    return jsonError("No limits provided", 400);
  }

  try {
    const updated = await prisma.company.update({ where: { id }, data });
    await recordAuditEvent({
      actorId: session.userId,
      actorName: session.name,
      actorRole: session.role,
      companyId: id,
      action: "company.limits.update",
      target: updated.name,
      metadata: data as Record<string, unknown>,
      ip: req.headers.get("x-forwarded-for") ?? null,
    });
    return jsonOk(toCompany(updated));
  } catch {
    return jsonError("Company not found", 404);
  }
}
