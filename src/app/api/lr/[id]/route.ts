import { NextRequest } from "next/server";
import {
  forbidden,
  getAuthFromRequest,
  unauthorized,
} from "@/lib/api/auth-middleware";
import { jsonError, jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { toBranch, toCompany, toLR, toUser, paymentModeToDb } from "@/lib/db/serialize";
import type { PaymentMode } from "@/lib/types";
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
    include: { executive: true, branch: true, company: true },
  });
}

function checkAccess(
  session: SessionLike,
  lr: { executiveId: string; companyId: string },
) {
  if (session.role === "executive" && lr.executiveId !== session.userId) {
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
    executive: toUser(lr.executive),
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
      if (session.role !== "executive") return forbidden();
      const updated = await markDelivered(id, session.userId);
      return jsonOk(updated);
    }

    return jsonError("Invalid action");
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Action failed");
  }
}

/**
 * General LR field update — only the owning executive can edit, and only
 * while the LR is pending or rejected.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAuthFromRequest(req);
  if (!session) return unauthorized();

  const { id } = await params;
  const lr = await loadLRWithRelations(id);
  if (!lr) return jsonError("LR not found", 404);

  if (session.role !== "executive" || lr.executiveId !== session.userId) {
    return forbidden();
  }
  if (lr.status !== "pending" && lr.status !== "rejected") {
    return jsonError("Only pending or rejected LRs can be edited");
  }

  const body = await req.json().catch(() => ({}));

  const ALLOWED_FIELDS = [
    "consignorName", "consignorAddress",
    "consigneeCompany", "consigneeName", "consigneeAddress", "consigneePhone",
    "originCity", "destinationCity", "vehicleNumber",
    "goodsDescription", "noOfPackages", "weightKg",
    "declaredValue", "freightAmount", "paymentMode",
    "specialInstructions", "signatureUrl", "photos",
    "dispatchDate",
  ] as const;

  const data: Record<string, unknown> = {};
  for (const key of ALLOWED_FIELDS) {
    if (body[key] !== undefined) {
      if (["noOfPackages"].includes(key)) {
        data[key] = Number(body[key]);
      } else if (["weightKg", "declaredValue", "freightAmount"].includes(key)) {
        data[key] = Number(body[key]);
      } else if (key === "paymentMode") {
        data[key] = paymentModeToDb(body[key] as PaymentMode);
      } else {
        data[key] = body[key];
      }
    }
  }

  const wantsResubmit =
    lr.status === "rejected" && body.status === "pending";

  if (Object.keys(data).length === 0 && !wantsResubmit) {
    return jsonError("No valid fields to update");
  }

  if (wantsResubmit) {
    data.status = "pending";
    data.rejectionReason = null;
  }

  try {
    const updated = await prisma.lRRequest.update({
      where: { id },
      data,
      include: { executive: true, branch: true, company: true },
    });
    return jsonOk({
      ...toLR(updated),
      executive: toUser(updated.executive),
      branch: toBranch(updated.branch),
      company: toCompany(updated.company),
    });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Update failed");
  }
}
