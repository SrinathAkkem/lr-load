import { NextRequest } from "next/server";
import {
  forbidden,
  getAuthFromRequest,
  unauthorized,
} from "@/lib/api/auth-middleware";
import { jsonOk } from "@/lib/api/response";
import { listAuditEvents } from "@/lib/services/audit-log";

export async function GET(req: NextRequest) {
  const session = await getAuthFromRequest(req);
  if (!session) return unauthorized();

  const url = new URL(req.url);
  const limit = Number(url.searchParams.get("limit") ?? "100");
  const action = url.searchParams.get("action") ?? undefined;
  const companyIdParam = url.searchParams.get("companyId") ?? undefined;

  // Super admin sees everything. Company admin only sees rows scoped to their
  // own company (the audit table stores `companyId` on every row that's
  // tenant-bound).
  if (session.role === "super_admin") {
    const events = await listAuditEvents({
      action,
      companyId: companyIdParam,
      limit,
    });
    return jsonOk(events);
  }

  if (session.role === "company_admin" && session.companyId) {
    const events = await listAuditEvents({
      action,
      companyId: session.companyId,
      limit,
    });
    return jsonOk(events);
  }

  return forbidden();
}
