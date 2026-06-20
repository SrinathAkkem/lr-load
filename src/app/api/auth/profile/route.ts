import { NextRequest } from "next/server";
import { getAuthFromRequest, unauthorized } from "@/lib/api/auth-middleware";
import { jsonError, jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { toUser } from "@/lib/db/serialize";

export async function GET(req: NextRequest) {
  const session = await getAuthFromRequest(req);
  if (!session) return unauthorized();

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { company: true, branch: true },
  });
  if (!user) return jsonError("User not found", 404);

  return jsonOk(toUser(user));
}

export async function PUT(req: NextRequest) {
  const session = await getAuthFromRequest(req);
  if (!session) return unauthorized();

  const body = await req.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim() : null;

  if (!name || name.length < 2) {
    return jsonError("Name must be at least 2 characters");
  }

  const updated = await prisma.user.update({
    where: { id: session.userId },
    data: { name },
    include: { company: true, branch: true },
  });

  return jsonOk(toUser(updated));
}
