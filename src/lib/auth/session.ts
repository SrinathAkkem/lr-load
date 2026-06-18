import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";
import type { AuthSession, UserRole } from "@/lib/types";
import { prisma } from "@/lib/db/prisma";

const SESSION_COOKIE = "rono_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Tokens are HMAC-signed payloads of the form `userId.issuedAtMs.sig`.
 * The signature uses `AUTH_SECRET` (or a built-in fallback for dev) so that
 * tokens cannot be forged client-side. They expire after 7 days and the user
 * is then required to log in again.
 */
function getSecret(): string {
  return (
    process.env.AUTH_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    "rono-lr-development-secret-do-not-use-in-prod"
  );
}

function signPayload(payload: string): string {
  return createHmac("sha256", getSecret())
    .update(payload)
    .digest("base64url");
}

export function createToken(userId: string): string {
  const issuedAt = Date.now();
  const payload = `${userId}.${issuedAt}`;
  const sig = signPayload(payload);
  return `${payload}.${sig}`;
}

export function parseToken(
  token: string,
): { userId: string; issuedAt: number } | null {
  try {
    const [userId, issuedAtStr, sig] = token.split(".");
    if (!userId || !issuedAtStr || !sig) return null;

    const expected = signPayload(`${userId}.${issuedAtStr}`);
    const expectedBuf = Buffer.from(expected);
    const sigBuf = Buffer.from(sig);
    if (
      sigBuf.length !== expectedBuf.length ||
      !timingSafeEqual(sigBuf, expectedBuf)
    ) {
      return null;
    }

    const issuedAt = Number(issuedAtStr);
    if (!Number.isFinite(issuedAt)) return null;
    if (Date.now() - issuedAt > SESSION_TTL_MS) return null;

    return { userId, issuedAt };
  } catch {
    return null;
  }
}

export async function setSession(session: AuthSession) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, session.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSessionFromToken(
  token: string,
): Promise<AuthSession | null> {
  const parsed = parseToken(token);
  if (!parsed) return null;

  const user = await prisma.user.findUnique({ where: { id: parsed.userId } });
  if (!user || user.status === "inactive") return null;

  return {
    userId: user.id,
    role: user.role,
    companyId: user.companyId,
    branchId: user.branchId,
    name: user.name,
    token,
  };
}

export async function getSession(): Promise<AuthSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return getSessionFromToken(token);
}

export function requireRole(session: AuthSession | null, roles: UserRole[]) {
  if (!session || !roles.includes(session.role)) {
    return { error: "Unauthorized", status: 401 as const };
  }
  return { session };
}
