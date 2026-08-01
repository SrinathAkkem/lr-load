import { NextRequest } from "next/server";
import {
  forbidden,
  getAuthFromRequest,
  unauthorized,
} from "@/lib/api/auth-middleware";
import { jsonError, jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { toCompany } from "@/lib/db/serialize";
import { companyProfileSchema } from "@/lib/validations/lr";

export async function GET(req: NextRequest) {
  const session = await getAuthFromRequest(req);
  if (!session) return unauthorized();
  if (session.role !== "company_admin" || !session.companyId) {
    return forbidden();
  }

  const company = await prisma.company.findUnique({
    where: { id: session.companyId },
  });
  if (!company) return jsonError("Company not found", 404);

  return jsonOk(toCompany(company));
}

export async function POST(req: NextRequest) {
  const session = await getAuthFromRequest(req);
  if (!session) return unauthorized();
  if (session.role !== "company_admin" || !session.companyId) {
    return forbidden();
  }

  const body = await req.json().catch(() => ({}));

  // Allow partial updates so the mobile app can send just the field that
  // changed (e.g. only logoUrl after an upload).
  const partial = {
    name: body.name === undefined ? undefined : String(body.name),
    address: body.address === undefined ? undefined : String(body.address),
    gstNumber:
      body.gstNumber === undefined ? undefined : String(body.gstNumber),
    cin: body.cin === undefined ? undefined : String(body.cin) || null,
    email: body.email === undefined ? undefined : String(body.email) || null,
    website: body.website === undefined ? undefined : String(body.website) || null,
    logoUrl: body.logoUrl === undefined ? undefined : String(body.logoUrl) || null,
    stampUrl:
      body.stampUrl === undefined ? undefined : String(body.stampUrl) || null,
  };

  // For full saves we still want validation. If all required fields are present
  // we run them through the strict schema; otherwise we just apply the partial.
  if (
    partial.name !== undefined &&
    partial.address !== undefined &&
    partial.gstNumber !== undefined
  ) {
    const parsed = companyProfileSchema.safeParse({
      name: partial.name,
      address: partial.address,
      gstNumber: partial.gstNumber,
      cin: partial.cin ?? undefined,
      email: partial.email ?? undefined,
      website: partial.website ?? undefined,
      logoUrl: partial.logoUrl ?? undefined,
      stampUrl: partial.stampUrl ?? undefined,
    });
    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "Validation failed");
    }
  }

  const updateData: Record<string, string | null> = {};
  for (const [k, v] of Object.entries(partial)) {
    if (v !== undefined) updateData[k] = v;
  }

  const company = await prisma.company.update({
    where: { id: session.companyId },
    data: updateData,
  });

  return jsonOk(toCompany(company));
}
