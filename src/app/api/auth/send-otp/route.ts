import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { otpSchema } from "@/lib/validations/lr";

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

  // Demo OTP. Replace with an SMS provider (MSG91, Twilio, AWS SNS) when going live.
  const code = "123456";
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await prisma.otp.upsert({
    where: { mobile },
    create: { mobile, code, expiresAt },
    update: { code, expiresAt },
  });

  return jsonOk({
    message: "OTP sent",
    devOtp: process.env.NODE_ENV === "development" ? code : undefined,
  });
}
