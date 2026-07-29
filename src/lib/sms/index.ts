import { isSmsLoginConfigured, isTwilioConfigured } from "@/lib/otp/config";
import { sendOtpSms as sendViaSmsLogin } from "./smslogin";
import { sendOtpSms as sendViaTwilio } from "./twilio";

export async function sendOtpSms(mobile: string, code: string): Promise<void> {
  if (isSmsLoginConfigured()) {
    await sendViaSmsLogin(mobile, code);
    return;
  }

  if (isTwilioConfigured()) {
    await sendViaTwilio(mobile, code);
    return;
  }

  throw new Error(
    "SMS is not configured. Set SMSLOGIN_* or TWILIO_* environment variables.",
  );
}
