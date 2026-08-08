import { NextRequest } from "next/server";
import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { DEV_OTP_CODE } from "@/lib/otp/config";

/**
 * Email OTP is currently only used for self-service company registration.
 * There's no email-sending provider wired up yet (see AUTH.md / otp/config),
 * so — mirroring the SMS "dev bypass" pattern already used for mobile OTP —
 * the generated code is returned in the response for local/demo use until a
 * real provider (Resend/SES/SMTP) is configured.
 */
const schema = z.object({
  email: z.string().email("Enter a valid email address"),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.errors[0]?.message ?? "Invalid email");
  }

  const email = parsed.data.email.toLowerCase().trim();

  const taken = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (taken) {
    return jsonError(
      "This email is already registered. Please log in instead.",
      409,
    );
  }

  // No email-sending provider is configured yet (see module docblock), so we
  // always use the fixed dev code and hand it back in the response — the
  // only way the caller can otherwise learn it. Swap this out once a real
  // provider (Resend/SES/SMTP) is wired up.
  const code = DEV_OTP_CODE;
  const expiresAt = new Date(Date.now() + 2 * 60 * 1000);

  await prisma.emailOtp.upsert({
    where: { email },
    create: { email, code, expiresAt },
    update: { code, expiresAt },
  });

  console.info(`[dev email OTP] ${email}: ${code}`);

  return jsonOk({
    message: "OTP generated for email verification (dev mode)",
    devOtp: code,
  });
}
