import { NextRequest } from "next/server";
import { getAuthFromRequest, unauthorized } from "@/lib/api/auth-middleware";
import { jsonError, jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { toUser } from "@/lib/db/serialize";
import { clearOtpForMobile, validateOtpCode } from "@/lib/otp/validate";

async function resolveCompanyBranch(user: {
  companyId: string | null;
  branchId: string | null;
  company: { id: string; name: string; lrCode: string } | null;
  branch: { id: string; name: string; city: string } | null;
}) {
  const [company, branch] = await Promise.all([
    user.company
      ? Promise.resolve(user.company)
      : user.companyId
        ? prisma.company.findUnique({
            where: { id: user.companyId },
            select: { id: true, name: true, lrCode: true },
          })
        : Promise.resolve(null),
    user.branch
      ? Promise.resolve(user.branch)
      : user.branchId
        ? prisma.branch.findUnique({
            where: { id: user.branchId },
            select: { id: true, name: true, city: true },
          })
        : Promise.resolve(null),
  ]);

  return { company, branch };
}

function serializeProfileUser(
  user: Awaited<ReturnType<typeof prisma.user.findUnique>> & {
    company: { id: string; name: string; lrCode: string } | null;
    branch: { id: string; name: string; city: string } | null;
  },
  company: { id: string; name: string; lrCode: string } | null,
  branch: { id: string; name: string; city: string } | null,
) {
  return {
    ...toUser(user),
    company: company
      ? { id: company.id, name: company.name, lrCode: company.lrCode }
      : undefined,
    branch: branch
      ? { id: branch.id, name: branch.name, city: branch.city }
      : undefined,
  };
}

export async function GET(req: NextRequest) {
  const session = await getAuthFromRequest(req);
  if (!session) return unauthorized();

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { company: true, branch: true },
  });
  if (!user) return jsonError("User not found", 404);

  const { company, branch } = await resolveCompanyBranch(user);

  return jsonOk(serializeProfileUser(user, company, branch));
}

export async function PUT(req: NextRequest) {
  const session = await getAuthFromRequest(req);
  if (!session) return unauthorized();

  const body = await req.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim() : null;
  const mobile = typeof body.mobile === "string" ? body.mobile.trim() : null;
  const otp = typeof body.otp === "string" ? body.otp.trim() : null;

  const current = await prisma.user.findUnique({
    where: { id: session.userId },
  });
  if (!current) return jsonError("User not found", 404);

  const data: { name?: string; mobile?: string } = {};

  if (name) {
    if (name.length < 2) {
      return jsonError("Name must be at least 2 characters");
    }
    data.name = name;
  }

  if (mobile && mobile !== current.mobile) {
    if (!/^\d{10}$/.test(mobile)) {
      return jsonError("Invalid mobile number");
    }
    if (!otp) {
      return jsonError("OTP is required to change mobile number");
    }

    const otpResult = await validateOtpCode(mobile, otp);
    if (!otpResult.valid) {
      return jsonError(otpResult.reason ?? "Invalid or expired OTP", 401);
    }

    const taken = await prisma.user.findFirst({
      where: { mobile, id: { not: session.userId } },
    });
    if (taken) return jsonError("Mobile number is already in use");

    data.mobile = mobile;
    await clearOtpForMobile(mobile);
  }

  if (Object.keys(data).length === 0) {
    return jsonError("No valid fields to update");
  }

  const updated = await prisma.user.update({
    where: { id: session.userId },
    data,
    include: { company: true, branch: true },
  });

  const { company, branch } = await resolveCompanyBranch(updated);

  return jsonOk(serializeProfileUser(updated, company, branch));
}
