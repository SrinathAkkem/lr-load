import { NextRequest } from "next/server";
import {
  forbidden,
  getAuthFromRequest,
  unauthorized,
} from "@/lib/api/auth-middleware";
import { jsonError, jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { toCompany } from "@/lib/db/serialize";
import { recordAuditEvent } from "@/lib/services/audit-log";

export async function GET(req: NextRequest) {
  const session = await getAuthFromRequest(req);
  if (!session) return unauthorized();
  if (session.role !== "super_admin") return forbidden();

  const monthStart = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1,
  );
  const monthEnd = new Date(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    1,
  );

  const companies = await prisma.company.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          branches: true,
          users: { where: { role: "executive" } },
          lrRequests: {
            where: { createdAt: { gte: monthStart, lt: monthEnd } },
          },
        },
      },
    },
  });

  return jsonOk(
    companies.map((c) => ({
      ...toCompany(c),
      branchCount: c._count.branches,
      executiveCount: c._count.users,
      lrsThisMonth: c._count.lrRequests,
    })),
  );
}

export async function POST(req: NextRequest) {
  const session = await getAuthFromRequest(req);
  if (!session) return unauthorized();
  if (session.role !== "super_admin") return forbidden();

  const body = await req.json().catch(() => ({}));

  const name = String(body.name ?? "").trim();
  if (!name) return jsonError("Name is required");
  const address = String(body.address ?? "").trim();
  if (!address) return jsonError("Address is required");
  const gstNumber = String(body.gstNumber ?? "").trim();
  if (!gstNumber) return jsonError("GST number is required");
  const lrCode = String(body.lrCode ?? "").trim();
  if (!lrCode) {
    return jsonError("Company code is required", 400);
  }
  const adminMobile = String(body.adminMobile ?? body.contactPhone ?? "").replace(
    /\D/g,
    "",
  );
  if (!/^\d{10}$/.test(adminMobile)) {
    return jsonError("Admin mobile (10 digits) is required", 400);
  }
  const adminName = String(body.adminName ?? "").trim() || "Company Admin";

  const [existingCode, existingMobile] = await Promise.all([
    prisma.company.findUnique({ where: { lrCode } }),
    prisma.user.findUnique({ where: { mobile: adminMobile } }),
  ]);
  if (existingCode) return jsonError("LR code already in use", 409);
  if (existingMobile) {
    return jsonError("Admin mobile is already registered", 409);
  }

  // Wrap company + serial counter + admin user in one transaction so a
  // partial failure never leaves a company without an admin or counter.
  const company = await prisma.$transaction(async (tx) => {
    const created = await tx.company.create({
      data: {
        name,
        address,
        gstNumber,
        lrCode,
        contactPhone: String(body.contactPhone ?? adminMobile),
        maxBranches: Number(body.maxBranches ?? 5),
        maxExecutives: Number(body.maxExecutives ?? 50),
        maxLrPerMonth: Number(body.maxLrPerMonth ?? 200),
        status: "active",
      },
    });

    await tx.lRSerial.create({
      data: { companyId: created.id, counter: 1 },
    });

    await tx.user.create({
      data: {
        mobile: adminMobile,
        role: "company_admin",
        companyId: created.id,
        name: adminName,
        status: "active",
      },
    });

    return created;
  });

  await recordAuditEvent({
    actorId: session.userId,
    actorName: session.name,
    actorRole: session.role,
    companyId: company.id,
    action: "company.create",
    target: company.name,
    metadata: { lrCode: company.lrCode },
    ip: req.headers.get("x-forwarded-for") ?? null,
  });

  return jsonOk(toCompany(company), 201);
}
