import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api/response";
import { createToken, setSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

/**
 * Password-based sign-in for company admins. Accepts either the registered
 * mobile (10 digits) or the company email as the `identifier`. Drivers and
 * super admins always go through their dedicated endpoints.
 */
const schema = z.object({
  identifier: z.string().min(1, "Mobile or email is required"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.errors[0]?.message ?? "Invalid input");
  }

  const { identifier, password } = parsed.data;
  const looksLikeEmail = identifier.includes("@");
  const mobile = identifier.replace(/\D/g, "");

  const user = await prisma.user.findFirst({
    where: {
      role: "company_admin",
      ...(looksLikeEmail
        ? { email: identifier.toLowerCase() }
        : { mobile }),
    },
    include: { company: { select: { status: true } } },
  });

  if (!user || !user.password) {
    return jsonError(
      "Invalid credentials. New accounts can use OTP login.",
      401,
    );
  }

  const stored = user.password;
  const looksHashed = stored.startsWith("$2a$") || stored.startsWith("$2b$");
  const ok = looksHashed
    ? await bcrypt.compare(password, stored)
    : stored === password;

  if (!ok) {
    return jsonError("Invalid credentials", 401);
  }

  // Auto-upgrade plaintext seed passwords to bcrypt the first time the user
  // logs in successfully.
  if (!looksHashed) {
    const upgraded = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: upgraded },
    });
  }

  if (user.status === "inactive") {
    return jsonError("Your account is inactive", 403);
  }
  if (user.company?.status === "suspended") {
    return jsonError("Company account is suspended", 403);
  }

  const token = createToken(user.id);
  await setSession({
    userId: user.id,
    role: user.role,
    companyId: user.companyId,
    branchId: user.branchId,
    name: user.name,
    token,
  });

  return jsonOk({
    token,
    user: {
      id: user.id,
      name: user.name,
      role: user.role,
      mobile: user.mobile,
      email: user.email,
      companyId: user.companyId,
    },
  });
}
