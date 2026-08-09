import { NextRequest } from "next/server";
import { z } from "zod";
import { jsonError, jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { toCompany, toUser } from "@/lib/db/serialize";
import { createToken, setSession } from "@/lib/auth/session";
import { normalizeIndianMobile } from "@/lib/phone";
import { validateOtpCode, clearOtpForMobile } from "@/lib/otp/validate";
import { recordAuditEvent } from "@/lib/services/audit-log";

const schema = z.object({
  name: z.string().min(1, "Company name is required"),
  lrCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2,8}$/, "Company code must be 2-8 letters"),
  gstNumber: z.string().min(1, "GST number is required"),
  ibaNumber: z.string().optional(),
  contactPhone: z.string().regex(/^\d{10}$/, "Contact number must be 10 digits"),
  email: z.string().email("Enter a valid email address"),
  address: z.string().min(1, "Address is required"),
  mobileOtp: z.string().length(6, "Mobile OTP must be 6 digits"),
});

/**
 * Public, unauthenticated self-service company registration. Creates the
 * company in `pending` status (visible to super admin for approval) and its
 * admin user, then immediately logs the admin in — per product decision the
 * dashboard is usable right away, only LR creation stays gated behind
 * approval (see `createLR` in lib/services/lr-service.ts).
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.errors[0]?.message ?? "Invalid input");
  }

  const data = parsed.data;
  const mobile = normalizeIndianMobile(data.contactPhone);
  const email = data.email.toLowerCase().trim();

  const mobileOtpResult = await validateOtpCode(mobile, data.mobileOtp);
  if (!mobileOtpResult.valid) {
    return jsonError(mobileOtpResult.reason ?? "Invalid mobile OTP", 401);
  }

  const [existingCode, existingMobile, existingEmail] = await Promise.all([
    prisma.company.findUnique({ where: { lrCode: data.lrCode } }),
    prisma.user.findUnique({ where: { mobile } }),
    prisma.user.findUnique({ where: { email } }),
  ]);
  if (existingCode) return jsonError("This company code is already in use", 409);
  if (existingMobile) {
    return jsonError("This mobile number is already registered", 409);
  }
  if (existingEmail) return jsonError("This email is already registered", 409);

  const company = await prisma.$transaction(async (tx) => {
    const created = await tx.company.create({
      data: {
        name: data.name.trim(),
        address: data.address.trim(),
        gstNumber: data.gstNumber.trim(),
        ibaNumber: data.ibaNumber?.trim() || null,
        lrCode: data.lrCode,
        contactPhone: mobile,
        email,
        status: "pending",
      },
    });

    await tx.lRSerial.create({ data: { companyId: created.id, counter: 1 } });

    const admin = await tx.user.create({
      data: {
        mobile,
        email,
        role: "company_admin",
        companyId: created.id,
        name: data.name.trim(),
        status: "active",
      },
    });

    return { company: created, admin };
  });

  await clearOtpForMobile(mobile);

  // Surface the new registration to every super admin via the existing
  // notification bell — no separate notification UI needed.
  const superAdmins = await prisma.user.findMany({
    where: { role: "super_admin" },
    select: { id: true },
  });
  if (superAdmins.length > 0) {
    await prisma.notification.createMany({
      data: superAdmins.map((admin) => ({
        userId: admin.id,
        title: "New company registration",
        message: `${company.company.name} (${company.company.lrCode}) has registered and is awaiting your approval.`,
      })),
    });
  }

  await recordAuditEvent({
    actorId: company.admin.id,
    actorName: company.admin.name,
    actorRole: "company_admin",
    companyId: company.company.id,
    action: "company.self_register",
    target: company.company.name,
    metadata: { lrCode: company.company.lrCode },
    ip: req.headers.get("x-forwarded-for") ?? null,
  });

  const token = createToken(company.admin.id);
  await setSession({
    userId: company.admin.id,
    role: "company_admin",
    companyId: company.company.id,
    branchId: null,
    name: company.admin.name,
    token,
  });

  return jsonOk(
    {
      token,
      user: toUser(company.admin),
      company: toCompany(company.company),
    },
    201,
  );
}
