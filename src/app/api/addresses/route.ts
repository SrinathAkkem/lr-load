import { NextRequest } from "next/server";
import {
  forbidden,
  getAuthFromRequest,
  unauthorized,
} from "@/lib/api/auth-middleware";
import { jsonError, jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { toSavedAddress } from "@/lib/db/serialize";
import { createAddressSchema } from "@/lib/validations/address";

export async function GET(req: NextRequest) {
  const session = await getAuthFromRequest(req);
  if (!session) return unauthorized();
  if (session.role !== "executive") return forbidden();

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  const rows = await prisma.savedAddress.findMany({
    where: {
      userId: session.userId,
      ...(type === "consigner" || type === "consignee" ? { type } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return jsonOk(rows.map(toSavedAddress));
}

export async function POST(req: NextRequest) {
  const session = await getAuthFromRequest(req);
  if (!session) return unauthorized();
  if (session.role !== "executive") return forbidden();

  const body = await req.json().catch(() => ({}));
  const parsed = createAddressSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.errors[0]?.message ?? "Invalid input");
  }

  const row = await prisma.savedAddress.create({
    data: {
      userId: session.userId,
      type: parsed.data.type,
      name: parsed.data.name,
      company: parsed.data.company ?? null,
      address: parsed.data.address,
      pincode: parsed.data.pincode ?? null,
      phone: parsed.data.phone ?? "",
    },
  });

  return jsonOk(toSavedAddress(row), 201);
}
