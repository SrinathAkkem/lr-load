import { NextRequest } from "next/server";
import {
  forbidden,
  getAuthFromRequest,
  unauthorized,
} from "@/lib/api/auth-middleware";
import { jsonError, jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { toBranch, toCompany, toUser } from "@/lib/db/serialize";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAuthFromRequest(req);
  if (!session) return unauthorized();

  const { id } = await params;

  if (session.role !== "super_admin" && session.companyId !== id) {
    return forbidden();
  }

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

  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      branches: { orderBy: { createdAt: "asc" } },
      users: { where: { role: "executive" }, orderBy: { createdAt: "desc" } },
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
  if (!company) return jsonError("Company not found", 404);

  // Get company admin user info
  const adminUser = await prisma.user.findFirst({
    where: { companyId: id, role: "company_admin" },
    select: { id: true, mobile: true, name: true, status: true },
  });

  return jsonOk({
    ...toCompany(company),
    branchCount: company._count.branches,
    executiveCount: company._count.users,
    lrsThisMonth: company._count.lrRequests,
    branches: company.branches.map(toBranch),
    executives: company.users.map(toUser),
    adminUser: adminUser ? {
      id: adminUser.id,
      mobile: adminUser.mobile,
      name: adminUser.name,
      status: adminUser.status,
    } : null,
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAuthFromRequest(req);
  if (!session) return unauthorized();
  if (session.role !== "super_admin") return forbidden();

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const data: {
    maxBranches?: number;
    maxExecutives?: number;
    maxLrPerMonth?: number;
    status?: "pending" | "active" | "suspended";
    name?: string;
    lrCode?: string;
    gstNumber?: string;
    ibaNumber?: string | null;
    address?: string;
    contactPhone?: string;
    email?: string | null;
  } = {};
  if (body.maxBranches !== undefined) data.maxBranches = Number(body.maxBranches);
  if (body.maxExecutives !== undefined) data.maxExecutives = Number(body.maxExecutives);
  if (body.maxLrPerMonth !== undefined) {
    data.maxLrPerMonth = Number(body.maxLrPerMonth);
  }
  if (body.status === "active" || body.status === "suspended" || body.status === "pending") {
    data.status = body.status;
  }
  if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
  if (typeof body.gstNumber === "string" && body.gstNumber.trim()) {
    data.gstNumber = body.gstNumber.trim();
  }
  if (typeof body.ibaNumber === "string") data.ibaNumber = body.ibaNumber.trim() || null;
  if (typeof body.address === "string" && body.address.trim()) {
    data.address = body.address.trim();
  }
  if (typeof body.contactPhone === "string" && body.contactPhone.trim()) {
    data.contactPhone = body.contactPhone.replace(/\D/g, "").trim();
  }
  if (typeof body.email === "string") data.email = body.email.trim().toLowerCase() || null;
  if (typeof body.lrCode === "string" && body.lrCode.trim()) {
    const lrCode = body.lrCode.toUpperCase().trim();
    if (!/^[A-Z]{2,8}$/.test(lrCode)) {
      return jsonError("LR code must be 2-8 uppercase letters", 400);
    }
    const existingCode = await prisma.company.findFirst({
      where: { lrCode, id: { not: id } },
      select: { id: true },
    });
    if (existingCode) return jsonError("LR code already in use", 409);
    data.lrCode = lrCode;
  }

  const updated = await prisma.company.update({ where: { id }, data });
  return jsonOk(toCompany(updated));
}
