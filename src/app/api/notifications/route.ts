import { NextRequest } from "next/server";
import { getAuthFromRequest, unauthorized } from "@/lib/api/auth-middleware";
import { jsonOk } from "@/lib/api/response";
import { getNotificationsForUser } from "@/lib/services/lr-service";

export async function GET(req: NextRequest) {
  const session = await getAuthFromRequest(req);
  if (!session) return unauthorized();

  const notifications = await getNotificationsForUser(session.userId);
  return jsonOk(notifications);
}
