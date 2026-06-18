import { NextRequest } from "next/server";
import { jsonError } from "@/lib/api/response";
import { getSession, getSessionFromToken } from "@/lib/auth/session";

/**
 * Resolve the current auth session from either:
 *   - `Authorization: Bearer <token>` header (mobile app)
 *   - `rono_session` cookie (web)
 */
export async function getAuthFromRequest(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return getSessionFromToken(authHeader.slice(7));
  }
  return getSession();
}

export function unauthorized() {
  return jsonError("Unauthorized", 401);
}

export function forbidden() {
  return jsonError("Forbidden", 403);
}
