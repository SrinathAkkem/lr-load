import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import {
  getAuthFromRequest,
  unauthorized,
} from "@/lib/api/auth-middleware";
import { jsonError, jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { recordAuditEvent } from "@/lib/services/audit-log";

const schema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

/**
 * Change the password for the currently authenticated user.
 *
 * - Super admins must always provide their current password.
 * - Company admins may set a password for the first time after signing in
 *   with OTP (no `currentPassword` required when one isn't already set).
 * - Drivers don't have passwords; the request is rejected for them.
 */
export async function POST(req: NextRequest) {
  const session = await getAuthFromRequest(req);
  if (!session) return unauthorized();
  if (session.role === "driver") {
    return jsonError("Drivers sign in with OTP only", 403);
  }

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.errors[0]?.message ?? "Invalid input");
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return jsonError("Account not found", 404);

  if (user.password) {
    if (!parsed.data.currentPassword) {
      return jsonError("Current password is required", 400);
    }
    const looksHashed =
      user.password.startsWith("$2a$") || user.password.startsWith("$2b$");
    const ok = looksHashed
      ? await bcrypt.compare(parsed.data.currentPassword, user.password)
      : user.password === parsed.data.currentPassword;
    if (!ok) {
      return jsonError("Current password is incorrect", 401);
    }
  } else if (session.role === "super_admin") {
    return jsonError("Current password is required", 400);
  }

  const hash = await bcrypt.hash(parsed.data.newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hash },
  });

  await recordAuditEvent({
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    companyId: user.companyId,
    action: "auth.password.change",
    target: user.email ?? user.mobile,
    ip: req.headers.get("x-forwarded-for") ?? null,
  });

  return jsonOk({ message: "Password updated" });
}
