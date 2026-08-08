import { NextRequest } from "next/server";
import { getAuthFromRequest, unauthorized } from "@/lib/api/auth-middleware";
import { jsonError, jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { otpSchema } from "@/lib/validations/lr";
import { sendOtpSms } from "@/lib/sms";
import {
  DEV_OTP_CODE,
  isDevOtpBypassAllowed,
  isOtpSmsDisabled,
  isSmsConfigured,
  isStaticTestMobile,
  shouldSendRealSms,
} from "@/lib/otp/config";
import { isProduction } from "@/lib/env";
import { randomInt } from "crypto";
import { z } from "zod";
import { normalizeIndianMobile } from "@/lib/phone";

const SMS_TIMEOUT_MS = 12000;

const sendOtpBodySchema = otpSchema.extend({
  purpose: z.enum(["login", "profile_update", "register"]).optional(),
});

async function sendOtpWithTimeout(mobile: string, code: string) {
  await Promise.race([
    sendOtpSms(mobile, code),
    new Promise<void>((_, reject) => {
      setTimeout(() => reject(new Error("SMS gateway timeout")), SMS_TIMEOUT_MS);
    }),
  ]);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = sendOtpBodySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.errors[0]?.message ?? "Invalid mobile");
  }

  const rawMobile = parsed.data.mobile;
  const mobile = normalizeIndianMobile(rawMobile);
  const purpose = parsed.data.purpose ?? "login";
  
  // Validate normalized mobile is 10 digits
  if (!/^\d{10}$/.test(mobile)) {
    return jsonError("Mobile must be 10 digits", 400);
  }

  if (purpose === "profile_update") {
    const session = await getAuthFromRequest(req);
    if (!session) return unauthorized();

    const taken = await prisma.user.findFirst({
      where: { mobile, id: { not: session.userId } },
      select: { id: true },
    });
    if (taken) {
      return jsonError("Mobile number is already in use", 409);
    }
  } else if (purpose === "register") {
    // Self-service company registration: the user doesn't exist yet, so we
    // only need to make sure nobody else already owns this mobile number.
    const taken = await prisma.user.findUnique({
      where: { mobile },
      select: { id: true },
    });
    if (taken) {
      return jsonError(
        "This mobile number is already registered. Please log in instead.",
        409,
      );
    }
  } else {
    const user = await prisma.user.findFirst({
      where: { mobile, role: { not: "super_admin" } },
      select: { id: true, status: true },
    });
    if (!user) {
      return jsonError("Mobile number not registered", 404);
    }
    if (user.status === "inactive") {
      return jsonError("Account is inactive", 403);
    }
  }

  const isStaticTest = isStaticTestMobile(mobile);

  if (isProduction() && !isSmsConfigured() && !isOtpSmsDisabled() && !isStaticTest) {
    console.error("[send-otp] Production requires SMSLOGIN_* or TWILIO_* env vars");
    return jsonError("SMS service is not configured. Contact support.", 503);
  }

  const code = isStaticTest
    ? DEV_OTP_CODE
    : shouldSendRealSms()
      ? String(randomInt(100000, 999999))
      : DEV_OTP_CODE;
  const expiresAt = new Date(Date.now() + 2 * 60 * 1000);

  await prisma.otp.upsert({
    where: { mobile },
    create: { mobile, code, expiresAt },
    update: { code, expiresAt },
  });

  let smsSent = false;
  if (shouldSendRealSms() && !isStaticTest) {
    try {
      await sendOtpWithTimeout(mobile, code);
      smsSent = true;
    } catch (e) {
      console.error("[send-otp] SMS delivery failed:", e);
      return jsonError(
        e instanceof Error ? e.message : "Failed to send OTP",
        502,
      );
    }
  } else {
    console.info(`[dev OTP] +91${mobile}: ${code}`);
  }

  return jsonOk({
    message: smsSent ? "OTP sent to your mobile" : "OTP generated (dev mode)",
    devOtp: isStaticTest || isDevOtpBypassAllowed() ? code : undefined,
    smsSent,
  });
}
