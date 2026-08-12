import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api/response";

/**
 * GET /api/test-sms?phone=9876543210
 * Test SMS delivery without authentication.
 * FOR TESTING ONLY - Remove in production.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const phone = searchParams.get("phone");

  if (!phone) {
    return jsonError("Phone number required. Use ?phone=9876543210", 400);
  }

  // Test by calling the send-otp endpoint
  try {
    const response = await fetch(`${req.nextUrl.origin}/api/auth/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile: phone }),
    });

    const data = await response.json();
    
    return jsonOk({
      success: response.ok,
      status: response.status,
      message: data.message || data.error,
      devOtp: data.devOtp,
      smsSent: data.smsSent,
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Test failed",
      500
    );
  }
}
