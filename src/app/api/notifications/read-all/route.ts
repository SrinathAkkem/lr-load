import { NextRequest } from "next/server";
import { getAuthFromRequest, unauthorized } from "@/lib/api/auth-middleware";
import { jsonOk } from "@/lib/api/response";
import { markAllNotificationsRead } from "@/lib/services/lr-service";

export async function PUT(req: NextRequest) {
  const session = await getAuthFromRequest(req);
  if (!session) return unauthorized();

  const notifications = await markAllNotificationsRead(session.userId);
  return jsonOk(notifications);
}
