import { isSmsLoginReady, isTwilioConfigured } from "@/lib/otp/config";
import { sendOtpSms as sendViaSmsLogin } from "./smslogin";
import { sendOtpSms as sendViaTwilio } from "./twilio";

export async function sendOtpSms(mobile: string, code: string): Promise<void> {
  if (isSmsLoginReady()) {
    await sendViaSmsLogin(mobile, code);
    return;
  }

  if (isTwilioConfigured()) {
    await sendViaTwilio(mobile, code);
    return;
  }

  if (
    process.env.SMSLOGIN_USERNAME?.trim() &&
    process.env.SMSLOGIN_API_KEY?.trim()
  ) {
    throw new Error(
      "SMSLogin credentials found but config is incomplete. Set SMSLOGIN_SENDER_ID and SMSLOGIN_DLT_TEMPLATE_ID.",
    );
  }

  throw new Error(
    "SMS is not configured. Set SMSLOGIN_* or TWILIO_* environment variables.",
  );
}
