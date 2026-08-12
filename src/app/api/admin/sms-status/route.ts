import { NextRequest } from "next/server";
import { getAuthFromRequest, unauthorized } from "@/lib/api/auth-middleware";
import { jsonOk } from "@/lib/api/response";
import { getSmsConfigStatus } from "@/lib/otp/config";

/**
 * GET /api/admin/sms-status
 * Check SMS configuration and provider status.
 * Super admin only.
 */
export async function GET(req: NextRequest) {
  const session = await getAuthFromRequest(req);
  if (!session || session.role !== "super_admin") return unauthorized();

  const status = getSmsConfigStatus();

  // Try to fetch current credit balance from SMSLogin
  let credits = null;
  let creditsError = null;
  
  try {
    const username = process.env.SMSLOGIN_USERNAME?.trim();
    const apiKey = process.env.SMSLOGIN_API_KEY?.trim();
    
    if (username && apiKey) {
      const balanceUrl = `https://smslogin.co/v3/api.php?username=${username}&apikey=${apiKey}&action=balance`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const res = await fetch(balanceUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (res.ok) {
        const text = await res.text();
        // SMSLogin returns balance as plain number or JSON
        const match = text.match(/\d+/);
        if (match) {
          credits = parseInt(match[0], 10);
        }
      }
    }
  } catch (error) {
    creditsError = error instanceof Error ? error.message : "Unknown error";
  }

  return jsonOk({
    ...status,
    credits,
    creditsError,
    timestamp: new Date().toISOString(),
  });
}
