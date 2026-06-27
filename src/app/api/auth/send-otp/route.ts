import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { otpSchema } from "@/lib/validations/lr";
import { isDevelopment } from "@/lib/env";
import { sendOtpSms } from "@/lib/sms/twilio";
import { randomInt } from "crypto";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = otpSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.errors[0]?.message ?? "Invalid mobile");
  }

  const { mobile } = parsed.data;

  const user = await prisma.user.findFirst({
    where: { mobile, role: { not: "super_admin" } },
  });
  if (!user) {
    return jsonError("Mobile number not registered", 404);
  }
  if (user.status === "inactive") {
    return jsonError("Account is inactive", 403);
  }

  const code = isDevelopment()
    ? "123456"
    : String(randomInt(100000, 999999));
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await prisma.otp.upsert({
    where: { mobile },
    create: { mobile, code, expiresAt },
    update: { code, expiresAt },
  });

  try {
    await sendOtpSms(mobile, code);
  } catch (e) {
    return jsonError(
      e instanceof Error ? e.message : "Failed to send OTP",
      502,
    );
  }

  return jsonOk({
    message: "OTP sent",
    devOtp: isDevelopment() ? code : undefined,
  });
}
