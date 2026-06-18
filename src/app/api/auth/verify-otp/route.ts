import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api/response";
import { createToken, setSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { verifyOtpSchema } from "@/lib/validations/lr";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = verifyOtpSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.errors[0]?.message ?? "Invalid input");
  }

  const { mobile, otp } = parsed.data;

  const stored = await prisma.otp.findUnique({ where: { mobile } });
  const isValidStored = !!stored && stored.code === otp && stored.expiresAt > new Date();
  // Demo backdoor — remove before going to production.
  const isDemoOtp = otp === "123456";

  if (!isValidStored && !isDemoOtp) {
    return jsonError("Invalid or expired OTP", 401);
  }

  const user = await prisma.user.findFirst({
    where: { mobile, role: { not: "super_admin" } },
    include: {
      company: { select: { id: true, name: true } },
      branch: { select: { id: true, name: true, city: true } },
    },
  });
  if (!user) return jsonError("User not found", 404);
  if (user.status === "inactive") return jsonError("Account is inactive", 403);

  if (user.companyId) {
    const company = await prisma.company.findUnique({
      where: { id: user.companyId },
      select: { status: true },
    });
    if (company?.status === "suspended") {
      return jsonError("Company account is suspended", 403);
    }
  }

  // First-time invited driver → activate on successful login.
  if (user.status === "invited") {
    await prisma.user.update({
      where: { id: user.id },
      data: { status: "active" },
    });
  }

  const token = createToken(user.id);
  await setSession({
    userId: user.id,
    role: user.role,
    companyId: user.companyId,
    branchId: user.branchId,
    name: user.name,
    token,
  });

  await prisma.otp.deleteMany({ where: { mobile } });

  return jsonOk({
    token,
    user: {
      id: user.id,
      name: user.name,
      role: user.role,
      companyId: user.companyId,
      branchId: user.branchId,
      mobile: user.mobile,
      company: user.company,
      branch: user.branch,
    },
  });
}
