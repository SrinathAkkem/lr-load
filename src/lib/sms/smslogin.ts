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

function normalizeMobile(mobile: string): string {
  const digits = mobile.replace(/\D/g, "");
  if (digits.length >= 10) return digits.slice(-10);
  return digits;
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
    const campid = json.campid ?? json.Campid ?? json.campId;
    if (campid) {
      return { ok: true, message: String(campid) };
    }
    const credits = json.Credits ?? json.credits;
    if (credits !== undefined) {
      return { ok: true, message: `Credits: ${credits}` };
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
    lower.includes("submitted") ||
    lower.includes("campid")
  ) {
    return { ok: true, message: trimmed };
  }

  return { ok: false, message: trimmed.slice(0, 300) };
}

/**
 * Send OTP SMS using SMSLogin.co HTTP API.
 * Docs: SMSLogin panel → Developers → HTTP API
 * Uses username + apikey (not account password).
 */
export async function sendOtpSms(mobile: string, code: string): Promise<void> {
  const username = requireEnv("SMSLOGIN_USERNAME");
  const apiKey = requireEnv("SMSLOGIN_API_KEY");
  const senderId = env("SMSLOGIN_SENDER_ID") ?? "RONOLR";
  const templateId = requireEnv("SMSLOGIN_DLT_TEMPLATE_ID");
  const message = getOtpMessage(code);
  const mobile10 = normalizeMobile(mobile);

  const apiUrl = "https://smslogin.co/v3/api.php";
  const params = new URLSearchParams({
    username,
    apikey: apiKey,
    senderid: senderId,
    mobile: mobile10,
    message,
    templateid: templateId,
  });

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

    console.log(`[smslogin] OTP sent to +91${mobile10}: ${parsed.message}`);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("SMS gateway timeout");
    }
    throw new Error(
      error instanceof Error ? error.message : "Failed to send SMS",
    );
  }
}
