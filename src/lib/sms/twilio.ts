import { isDevelopment } from "@/lib/env";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not configured`);
  return v;
}

export async function sendOtpSms(mobile: string, code: string): Promise<void> {
  if (isDevelopment()) {
    console.info(`[dev OTP] +91${mobile}: ${code}`);
    return;
  }

  const accountSid = requireEnv("TWILIO_ACCOUNT_SID");
  const authToken = requireEnv("TWILIO_AUTH_TOKEN");
  const from = requireEnv("TWILIO_FROM_NUMBER");

  const body = new URLSearchParams({
    To: `+91${mobile}`,
    From: from,
    Body: `Your RonoHub login code is ${code}. Valid for 5 minutes.`,
  });

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization:
          "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    },
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Twilio SMS failed (${res.status}): ${text.slice(0, 200)}`);
  }
}
