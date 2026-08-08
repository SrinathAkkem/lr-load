import { NextRequest } from "next/server";
import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api/response";
import { validateOtpCode } from "@/lib/otp/validate";
import { normalizeIndianMobile } from "@/lib/phone";

const schema = z.object({
  mobile: z.string().regex(/^\d{10}$/),
  otp: z.string().length(6, "OTP must be 6 digits"),
});

/**
 * Standalone, pre-account mobile OTP check used by the registration wizard's
 * step 2 (the user doesn't exist yet, so `/api/auth/verify-otp` — which
 * requires an existing account — doesn't apply here). Gives immediate
 * "Verified ✓" feedback; the final Create Account submit re-validates both
 * OTPs server-side regardless.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.errors[0]?.message ?? "Invalid input");
  }

  const mobile = normalizeIndianMobile(parsed.data.mobile);
  const result = await validateOtpCode(mobile, parsed.data.otp);
  if (!result.valid) {
    return jsonError(result.reason ?? "Invalid or expired OTP", 401);
  }

  return jsonOk({ verified: true });
}
