import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api/response";
import { createToken, setSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { verifyOtpSchema } from "@/lib/validations/lr";
import { clearOtpForMobile, validateOtpCode } from "@/lib/otp/validate";
import { normalizeIndianMobile } from "@/lib/phone";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = verifyOtpSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.errors[0]?.message ?? "Invalid input");
  }

  const rawMobile = parsed.data.mobile;
  const mobile = normalizeIndianMobile(rawMobile);
  const otp = parsed.data.otp;
  const isMobileClient = req.headers.get("x-client") === "mobile";
  
  // Validate normalized mobile is 10 digits
  if (!/^\d{10}$/.test(mobile)) {
    return jsonError("Invalid mobile number", 400);
  }

  const otpResult = await validateOtpCode(mobile, otp);
  if (!otpResult.valid) {
    return jsonError(otpResult.reason ?? "Invalid or expired OTP", 401);
  }

  const user = await prisma.user.findFirst({
    where: { mobile, role: { not: "super_admin" } },
    include: {
      company: { select: { id: true, name: true, lrCode: true, status: true } },
      branch: { select: { id: true, name: true, city: true } },
    },
  });

  if (!user) return jsonError("User not found", 404);
  if (user.status === "inactive") return jsonError("Account is inactive", 403);

  if (user.company?.status === "suspended") {
    return jsonError("Company account is suspended", 403);
  }

  if (user.status === "invited") {
    await prisma.user.update({
      where: { id: user.id },
      data: { status: "active" },
    });
  }

  const token = createToken(user.id);

  if (!isMobileClient) {
    await setSession({
      userId: user.id,
      role: user.role,
      companyId: user.companyId,
      branchId: user.branchId,
      name: user.name,
      token,
    });
  }

  await clearOtpForMobile(mobile);

  return jsonOk({
    token,
    user: {
      id: user.id,
      name: user.name,
      role: user.role,
      companyId: user.companyId,
      branchId: user.branchId,
      mobile: user.mobile,
      status: user.status,
      company: user.company
        ? {
            id: user.company.id,
            name: user.company.name,
            lrCode: user.company.lrCode,
          }
        : undefined,
      branch: user.branch
        ? {
            id: user.branch.id,
            name: user.branch.name,
            city: user.branch.city,
          }
        : undefined,
    },
  });
}
