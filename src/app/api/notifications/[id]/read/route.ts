import { NextRequest } from "next/server";
import {
  getAuthFromRequest,
  unauthorized,
} from "@/lib/api/auth-middleware";
import { jsonError, jsonOk } from "@/lib/api/response";
import { markNotificationRead } from "@/lib/services/lr-service";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAuthFromRequest(req);
  if (!session) return unauthorized();

  const { id } = await params;
  const notification = await markNotificationRead(session.userId, id);
  if (!notification) return jsonError("Notification not found", 404);

  return jsonOk(notification);
}
