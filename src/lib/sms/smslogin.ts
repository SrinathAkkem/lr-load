import { getOtpMessage } from "@/lib/otp/config";

function env(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

function requireEnv(name: string): string {
  const value = env(name);
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

function parseSmsLoginResponse(text: string): { ok: boolean; message: string } {
  const trimmed = text.trim();
  if (!trimmed) {
    return { ok: false, message: "Empty response from SMS gateway" };
  }

  try {
    const json = JSON.parse(trimmed.replace(/'/g, '"')) as Record<string, unknown>;
    const error = json.Error ?? json.error;
    if (error) {
      return { ok: false, message: String(error) };
    }
    const success = json.Success ?? json.success ?? json.message;
    if (success) {
      return { ok: true, message: String(success) };
    }
  } catch {
    // Plain-text gateway response
  }

  const lower = trimmed.toLowerCase();
  if (
    lower.includes("invalid") ||
    lower.includes("failed") ||
    lower.includes("error") ||
    lower.includes("insufficient")
  ) {
    return { ok: false, message: trimmed.slice(0, 300) };
  }

  if (
    /^\d+$/.test(trimmed) ||
    lower.includes("success") ||
    lower.includes("sent") ||
    lower.includes("submitted")
  ) {
    return { ok: true, message: trimmed };
  }

  return { ok: false, message: trimmed.slice(0, 300) };
}

/**
 * Send OTP SMS using SMSLogin.co API (https://smslogin.co/)
 */
export async function sendOtpSms(mobile: string, code: string): Promise<void> {
  const username = requireEnv("SMSLOGIN_USERNAME");
  const password = requireEnv("SMSLOGIN_PASSWORD");
  const senderId = env("SMSLOGIN_SENDER_ID") ?? "RONOHB";
  const dltEntityId = requireEnv("SMSLOGIN_DLT_ENTITY_ID");
  const dltTemplateId = requireEnv("SMSLOGIN_DLT_TEMPLATE_ID");
  const dltTelemarketerId = env("SMSLOGIN_DLT_TELEMARKETER_ID");
  const message = getOtpMessage(code);

  const apiUrl = "https://smslogin.co/v3/api.php";
  const params = new URLSearchParams({
    username,
    password,
    from: senderId,
    to: `91${mobile}`,
    msg: message,
    type: "1",
    dltentityid: dltEntityId,
    dlttempid: dltTemplateId,
  });

  if (dltTelemarketerId) {
    params.set("dlttmid", dltTelemarketerId);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch(`${apiUrl}?${params.toString()}`, {
      method: "GET",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const text = await res.text();
    const parsed = parseSmsLoginResponse(text);

    if (!res.ok || !parsed.ok) {
      throw new Error(parsed.message || `SMS gateway error (${res.status})`);
    }

    console.log(`[smslogin] OTP sent to +91${mobile}: ${parsed.message}`);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("SMS gateway timeout");
    }
    throw new Error(
      error instanceof Error ? error.message : "Failed to send SMS",
    );
  }
}
