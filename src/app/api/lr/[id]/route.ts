import { NextRequest } from "next/server";
import {
  forbidden,
  getAuthFromRequest,
  unauthorized,
} from "@/lib/api/auth-middleware";
import { jsonError, jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { toBranch, toCompany, toLR, toUser } from "@/lib/db/serialize";
import { rejectLRSchema } from "@/lib/validations/lr";
import {
  approveLR,
  markDelivered,
  rejectLR,
} from "@/lib/services/lr-service";

type SessionLike = {
  userId: string;
  role: string;
  companyId: string | null;
};

async function loadLRWithRelations(lrId: string) {
  return prisma.lRRequest.findUnique({
    where: { id: lrId },
    include: { driver: true, branch: true, company: true },
  });
}

function checkAccess(
  session: SessionLike,
  lr: { driverId: string; companyId: string },
) {
  if (session.role === "driver" && lr.driverId !== session.userId) {
    return forbidden();
  }
  if (
    session.role === "company_admin" &&
    lr.companyId !== session.companyId
  ) {
    return forbidden();
  }
  return null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAuthFromRequest(req);
  if (!session) return unauthorized();

  const { id } = await params;
  const lr = await loadLRWithRelations(id);
  if (!lr) return jsonError("LR not found", 404);

  const denied = checkAccess(session, lr);
  if (denied) return denied;

  return jsonOk({
    ...toLR(lr),
    driver: toUser(lr.driver),
    branch: toBranch(lr.branch),
    company: toCompany(lr.company),
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAuthFromRequest(req);
  if (!session) return unauthorized();

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");
  const body = await req.json().catch(() => ({}));

  const lr = await loadLRWithRelations(id);
  if (!lr) return jsonError("LR not found", 404);

  const denied = checkAccess(session, lr);
  if (denied) return denied;

  try {
    if (action === "approve") {
      if (session.role !== "company_admin") return forbidden();
      const updated = await approveLR(id, session.userId);
      return jsonOk(updated);
    }

    if (action === "reject") {
      if (session.role !== "company_admin") return forbidden();
      const parsed = rejectLRSchema.safeParse(body);
      if (!parsed.success) {
        return jsonError(parsed.error.errors[0]?.message ?? "Reason required");
      }
      const updated = await rejectLR(id, parsed.data.reason);
      return jsonOk(updated);
    }

    if (action === "delivered") {
      if (session.role !== "driver") return forbidden();
      const updated = await markDelivered(id, session.userId);
      return jsonOk(updated);
    }

    return jsonError("Invalid action");
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Action failed");
  }
}
