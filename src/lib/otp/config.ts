import { getAppEnv, isProduction } from "@/lib/env";

export const DEV_OTP_CODE = "123456";

export function isSmsLoginConfigured(): boolean {
  return Boolean(
    process.env.SMSLOGIN_USERNAME?.trim() &&
      process.env.SMSLOGIN_PASSWORD?.trim(),
  );
}

/** SMSLogin needs DLT IDs to deliver in India. */
export function isSmsLoginReady(): boolean {
  return Boolean(
    isSmsLoginConfigured() &&
      process.env.SMSLOGIN_DLT_ENTITY_ID?.trim() &&
      process.env.SMSLOGIN_DLT_TEMPLATE_ID?.trim(),
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
  return isSmsLoginReady() || isTwilioConfigured();
}

export type SmsConfigField =
  | "OTP_SMS_ENABLED"
  | "SMSLOGIN_USERNAME"
  | "SMSLOGIN_PASSWORD"
  | "SMSLOGIN_SENDER_ID"
  | "SMSLOGIN_DLT_ENTITY_ID"
  | "SMSLOGIN_DLT_TELEMARKETER_ID"
  | "SMSLOGIN_DLT_TEMPLATE_ID"
  | "SMSLOGIN_OTP_MESSAGE";

export function getSmsConfigStatus() {
  const fields: Record<SmsConfigField, boolean> = {
    OTP_SMS_ENABLED: process.env.OTP_SMS_ENABLED === "true",
    SMSLOGIN_USERNAME: Boolean(process.env.SMSLOGIN_USERNAME?.trim()),
    SMSLOGIN_PASSWORD: Boolean(process.env.SMSLOGIN_PASSWORD?.trim()),
    SMSLOGIN_SENDER_ID: Boolean(process.env.SMSLOGIN_SENDER_ID?.trim()),
    SMSLOGIN_DLT_ENTITY_ID: Boolean(process.env.SMSLOGIN_DLT_ENTITY_ID?.trim()),
    SMSLOGIN_DLT_TELEMARKETER_ID: Boolean(
      process.env.SMSLOGIN_DLT_TELEMARKETER_ID?.trim(),
    ),
    SMSLOGIN_DLT_TEMPLATE_ID: Boolean(
      process.env.SMSLOGIN_DLT_TEMPLATE_ID?.trim(),
    ),
    SMSLOGIN_OTP_MESSAGE: Boolean(
      process.env.SMSLOGIN_OTP_MESSAGE?.trim() ||
        process.env.OTP_MESSAGE_TEMPLATE?.trim(),
    ),
  };

  const missing: SmsConfigField[] = [];
  if (!fields.SMSLOGIN_USERNAME) missing.push("SMSLOGIN_USERNAME");
  if (!fields.SMSLOGIN_PASSWORD) missing.push("SMSLOGIN_PASSWORD");
  if (!fields.SMSLOGIN_SENDER_ID) missing.push("SMSLOGIN_SENDER_ID");
  if (!fields.SMSLOGIN_DLT_ENTITY_ID) missing.push("SMSLOGIN_DLT_ENTITY_ID");
  if (!fields.SMSLOGIN_DLT_TEMPLATE_ID) missing.push("SMSLOGIN_DLT_TEMPLATE_ID");

  const provider = isSmsLoginConfigured()
    ? "smslogin"
    : isTwilioConfigured()
      ? "twilio"
      : null;

  return {
    appEnv: getAppEnv(),
    otpSmsEnabled: fields.OTP_SMS_ENABLED,
    otpSmsDisabled: isOtpSmsDisabled(),
    shouldSendRealSms: shouldSendRealSms(),
    devOtpBypass: isDevOtpBypassAllowed(),
    provider,
    smsLoginReady: isSmsLoginReady(),
    twilioReady: isTwilioConfigured(),
    smsReady: isSmsConfigured(),
    fields,
    missing,
    optional: {
      telemarketerIdSet: fields.SMSLOGIN_DLT_TELEMARKETER_ID,
    },
    otpMessageUsesDefault: !fields.SMSLOGIN_OTP_MESSAGE,
  };
}

export function isOtpSmsDisabled(): boolean {
  return process.env.OTP_SMS_ENABLED === "false";
}

/**
 * Send real SMS when OTP_SMS_ENABLED=true and SMS is fully configured.
 * Set OTP_SMS_ENABLED=false to use fixed OTP 123456 until DLT is ready.
 */
export function shouldSendRealSms(): boolean {
  if (isOtpSmsDisabled()) return false;
  if (process.env.OTP_SMS_ENABLED === "true") return isSmsConfigured();
  if (isProduction()) return isSmsConfigured();
  return isSmsConfigured();
}

/** Allow fixed dev OTP when SMS is disabled or not configured. */
export function isDevOtpBypassAllowed(): boolean {
  if (isOtpSmsDisabled()) return true;
  return !shouldSendRealSms();
}

export function getOtpMessage(code: string): string {
  const template =
    process.env.SMSLOGIN_OTP_MESSAGE?.trim() ||
    process.env.OTP_MESSAGE_TEMPLATE?.trim() ||
    "Your RonoHub login code is {code}. Valid for 5 minutes. Do not share this code with anyone.";
  return template.replace(/\{code\}/g, code);
}
