import { randomInt } from "crypto";
import { NextRequest } from "next/server";
import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api/response";
import { sendEmailOtpMail } from "@/lib/email/otp-mailer";
import { isSmtpConfigured } from "@/lib/email/smtp";
import { prisma } from "@/lib/db/prisma";
import { isProduction } from "@/lib/env";
import { DEV_OTP_CODE } from "@/lib/otp/config";

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

  if (isProduction() && !isSmtpConfigured()) {
    console.error("[send-email-otp] Production requires SMTP_* env vars");
    return jsonError("Email service is not configured. Contact support.", 503);
  }

  const shouldSendRealEmail = isSmtpConfigured();
  const code = shouldSendRealEmail
    ? String(randomInt(100000, 999999))
    : DEV_OTP_CODE;
  const expiresAt = new Date(Date.now() + 2 * 60 * 1000);

  await prisma.emailOtp.upsert({
    where: { email },
    create: { email, code, expiresAt },
    update: { code, expiresAt },
  });

  let emailSent = false;
  if (shouldSendRealEmail) {
    try {
      await sendEmailOtpMail(email, code);
      emailSent = true;
    } catch (error) {
      console.error("[send-email-otp] Email delivery failed:", error);
      return jsonError("Failed to send OTP email. Try again shortly.", 502);
    }
  } else {
    console.info(`[dev email OTP] ${email}: ${code}`);
  }

  return jsonOk({
    message: emailSent ? "OTP sent to your email" : "OTP generated (dev mode)",
    devOtp: emailSent ? undefined : code,
    emailSent,
  });
}
