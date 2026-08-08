import { NextRequest } from "next/server";
import { getAuthFromRequest } from "@/lib/api/auth-middleware";
import { jsonOk } from "@/lib/api/response";

/**
 * Lightweight session probe used by the public marketing homepage to decide
 * where the "Login" button should route the visitor, without pulling in the
 * full profile payload.
 */
export async function GET(req: NextRequest) {
  const session = await getAuthFromRequest(req);
  if (!session) return jsonOk({ authenticated: false });

  return jsonOk({
    authenticated: true,
    role: session.role,
    companyId: session.companyId,
  });
}
