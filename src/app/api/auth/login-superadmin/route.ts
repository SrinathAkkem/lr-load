import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { jsonError, jsonOk } from "@/lib/api/response";
import { createToken, setSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { superAdminLoginSchema } from "@/lib/validations/lr";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = superAdminLoginSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.errors[0]?.message ?? "Invalid credentials");
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findFirst({
    where: { role: "super_admin", email },
  });
  if (!user || !user.password) {
    return jsonError("Invalid email or password", 401);
  }

  // Backwards compat: if the stored password is a plaintext seed value, treat
  // it as a one-time match and immediately upgrade to a bcrypt hash on success.
  const stored = user.password;
  const looksHashed = stored.startsWith("$2a$") || stored.startsWith("$2b$");
  const ok = looksHashed
    ? await bcrypt.compare(password, stored)
    : stored === password;

  if (!ok) {
    return jsonError("Invalid email or password", 401);
  }

  if (!looksHashed) {
    const upgraded = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: upgraded },
    });
  }

  const token = createToken(user.id);
  await setSession({
    userId: user.id,
    role: user.role,
    companyId: null,
    branchId: null,
    name: user.name,
    token,
  });

  return jsonOk({
    token,
    user: { id: user.id, name: user.name, role: user.role, email: user.email },
  });
}
