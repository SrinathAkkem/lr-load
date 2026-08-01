import { prisma } from "@/lib/db/prisma";
import { DEV_OTP_CODE, isDevOtpBypassAllowed, isStaticTestMobile } from "./config";

export async function validateOtpCode(
  mobile: string,
  otp: string,
): Promise<{ valid: boolean; reason?: string }> {
  const normalizedOtp = otp.trim();

  if (!/^\d{6}$/.test(normalizedOtp)) {
    return { valid: false, reason: "OTP must be 6 digits" };
  }

  // Reserved test/reviewer number — always accepts the fixed OTP, even if
  // real SMS delivery is configured/enabled, and even without a prior
  // send-otp call for this session.
  if (isStaticTestMobile(mobile) && normalizedOtp === DEV_OTP_CODE) {
    return { valid: true };
  }

  const stored = await prisma.otp.findUnique({ where: { mobile } });
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

export async function clearOtpForMobile(mobile: string): Promise<void> {
  await prisma.otp.deleteMany({ where: { mobile } }).catch(() => {});
}
