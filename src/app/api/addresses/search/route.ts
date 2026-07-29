import { NextRequest } from "next/server";
import {
  forbidden,
  getAuthFromRequest,
  unauthorized,
} from "@/lib/api/auth-middleware";
import { jsonError, jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { toSavedAddress } from "@/lib/db/serialize";

export async function GET(req: NextRequest) {
  const session = await getAuthFromRequest(req);
  if (!session) return unauthorized();
  if (session.role !== "executive") return forbidden();

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim().toLowerCase();
  if (!q || q.length < 2) {
    return jsonError("Search query must be at least 2 characters");
  }

  const rows = await prisma.savedAddress.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
  });

  const filtered = rows.filter((row) => {
    const haystack = [
      row.name,
      row.company ?? "",
      row.address,
      row.pincode ?? "",
      row.phone,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });

  return jsonOk(filtered.map(toSavedAddress));
}
