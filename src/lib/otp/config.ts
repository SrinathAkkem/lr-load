import { isDevelopment, isProduction } from "@/lib/env";

export const DEV_OTP_CODE = "123456";

export function isSmsLoginConfigured(): boolean {
  return Boolean(
    process.env.SMSLOGIN_USERNAME?.trim() &&
      process.env.SMSLOGIN_PASSWORD?.trim(),
  );
}

export function isTwilioConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID?.trim() &&
      process.env.TWILIO_AUTH_TOKEN?.trim() &&
      process.env.TWILIO_FROM_NUMBER?.trim(),
  );
}

/** True when an SMS provider is configured in environment variables. */
export function isSmsConfigured(): boolean {
  return isSmsLoginConfigured() || isTwilioConfigured();
}

/**
 * Send real SMS when:
 * - APP_ENV/NODE_ENV is production, or
 * - OTP_SMS_ENABLED=true, or
 * - SMS credentials are present (allows testing SMS from local dev)
 */
export function shouldSendRealSms(): boolean {
  if (process.env.OTP_SMS_ENABLED === "true") return true;
  if (isProduction()) return isSmsConfigured();
  return isSmsConfigured() && process.env.OTP_SMS_ENABLED !== "false";
}

/** Fixed dev OTP + bypass only when SMS is not being sent. */
export function isDevOtpBypassAllowed(): boolean {
  return isDevelopment() && !shouldSendRealSms();
}

export function getOtpMessage(code: string): string {
  const template =
    process.env.SMSLOGIN_OTP_MESSAGE?.trim() ||
    process.env.OTP_MESSAGE_TEMPLATE?.trim() ||
    "Your RonoHub login code is {code}. Valid for 5 minutes. Do not share this code with anyone.";
  return template.replace(/\{code\}/g, code);
}
