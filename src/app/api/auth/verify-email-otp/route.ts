import { NextRequest } from "next/server";
import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api/response";
import { validateEmailOtpCode } from "@/lib/otp/validate-email";

const schema = z.object({
  email: z.string().email(),
  otp: z.string().length(6, "OTP must be 6 digits"),
});

/**
 * Standalone check used by the registration wizard's step 3 to give
 * immediate feedback ("Verified ✓") before the final Create Account submit,
 * which re-validates both OTPs server-side anyway.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.errors[0]?.message ?? "Invalid input");
  }

  const email = parsed.data.email.toLowerCase().trim();
  const result = await validateEmailOtpCode(email, parsed.data.otp);
  if (!result.valid) {
    return jsonError(result.reason ?? "Invalid or expired OTP", 401);
  }

  return jsonOk({ verified: true });
}
