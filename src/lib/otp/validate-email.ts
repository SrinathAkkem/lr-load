import { prisma } from "@/lib/db/prisma";
import { DEV_OTP_CODE, isDevOtpBypassAllowed } from "./config";

export async function validateEmailOtpCode(
  email: string,
  otp: string,
): Promise<{ valid: boolean; reason?: string }> {
  const normalizedOtp = otp.trim();

  if (!/^\d{6}$/.test(normalizedOtp)) {
    return { valid: false, reason: "OTP must be 6 digits" };
  }

  const stored = await prisma.emailOtp.findUnique({ where: { email } });
  const isValidStored =
    !!stored &&
    stored.code === normalizedOtp &&
    stored.expiresAt > new Date();

  if (isValidStored) {
    return { valid: true };
  }

  if (isDevOtpBypassAllowed() && normalizedOtp === DEV_OTP_CODE) {
    return { valid: true };
  }

  return { valid: false, reason: "Invalid or expired OTP" };
}

export async function clearOtpForEmail(email: string): Promise<void> {
  await prisma.emailOtp.deleteMany({ where: { email } }).catch(() => {});
}
