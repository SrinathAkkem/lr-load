import { NextRequest } from "next/server";
import {
  forbidden,
  getAuthFromRequest,
  unauthorized,
} from "@/lib/api/auth-middleware";
import { jsonError, jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { toSavedAddress } from "@/lib/db/serialize";
import { updateAddressSchema } from "@/lib/validations/address";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAuthFromRequest(req);
  if (!session) return unauthorized();
  if (session.role !== "executive") return forbidden();

  const { id } = await params;
  const existing = await prisma.savedAddress.findFirst({
    where: { id, userId: session.userId },
  });
  if (!existing) return jsonError("Address not found", 404);

  const body = await req.json().catch(() => ({}));
  const parsed = updateAddressSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.errors[0]?.message ?? "Invalid input");
  }

  const data = parsed.data;
  const row = await prisma.savedAddress.update({
    where: { id },
    data: {
      ...(data.type !== undefined ? { type: data.type } : {}),
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.company !== undefined ? { company: data.company ?? null } : {}),
      ...(data.address !== undefined ? { address: data.address } : {}),
      ...(data.pincode !== undefined ? { pincode: data.pincode ?? null } : {}),
      ...(data.phone !== undefined ? { phone: data.phone } : {}),
    },
  });

  return jsonOk(toSavedAddress(row));
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAuthFromRequest(req);
  if (!session) return unauthorized();
  if (session.role !== "executive") return forbidden();

  const { id } = await params;
  const existing = await prisma.savedAddress.findFirst({
    where: { id, userId: session.userId },
  });
  if (!existing) return jsonError("Address not found", 404);

  await prisma.savedAddress.delete({ where: { id } });
  return jsonOk({ deleted: true });
}
