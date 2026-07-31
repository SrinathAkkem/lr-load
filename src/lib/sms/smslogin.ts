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

    // Many SMS gateways (including SMSLogin.co) return an ErrorCode field
    // where "000"/"0" means success — check this BEFORE any generic "error"
    // substring checks below, since key names like "ErrorCode" would
    // otherwise falsely match a plain substring search for "error".
    const errorCode = json.ErrorCode ?? json.errorcode ?? json.error_code;
    if (errorCode !== undefined) {
      const codeStr = String(errorCode).trim();
      const isSuccessCode =
        codeStr === "000" || codeStr === "0" || codeStr.toLowerCase() === "success";
      const detail = String(
        json.ErrorMessage ?? json.errormessage ?? json.message ?? codeStr,
      );
      return { ok: isSuccessCode, message: detail };
    }

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

    // Parsed as JSON but no recognized field. Do NOT fall through to the
    // plain-text substring heuristics below — those run on the raw JSON
    // text and can misfire on key names (e.g. "ErrorCode" contains
    // "error"), silently marking successful sends as failures.
    return {
      ok: false,
      message: `Unrecognized gateway response: ${trimmed.slice(0, 300)}`,
    };
  } catch {
    // Genuinely non-JSON (plain-text) gateway response — safe to use
    // substring heuristics here since there are no field names to confuse
    // the match.
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

    // Always log the raw gateway response (truncated) so intermittent
    // delivery issues can be diagnosed from server logs even when the
    // parser considers the send successful.
    console.log(
      `[smslogin] +91${mobile10} → HTTP ${res.status}, raw response: ${text
        .trim()
        .slice(0, 300)}`,
    );

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
