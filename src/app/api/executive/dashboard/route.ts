import { NextRequest } from "next/server";
import {
  forbidden,
  getAuthFromRequest,
  unauthorized,
} from "@/lib/api/auth-middleware";
import { jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { toBranch, toLR, toUser } from "@/lib/db/serialize";
import { computeExecutiveDashboardStats } from "@/lib/services/lr-service";

export async function GET(req: NextRequest) {
  const session = await getAuthFromRequest(req);
  if (!session) return unauthorized();
  if (session.role !== "executive") return forbidden();

  const [stats, latestLr, history] = await Promise.all([
    computeExecutiveDashboardStats(session.userId),
    prisma.lRRequest.findFirst({
      where: { executiveId: session.userId },
      orderBy: { createdAt: "desc" },
      include: { executive: true, branch: true },
    }),
    prisma.lRRequest.findMany({
      where: { executiveId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { executive: true, branch: true },
    }),
  ]);

  const mapLr = (lr: NonNullable<typeof latestLr>) => ({
    ...toLR(lr),
    executive: { name: lr.executive.name, mobile: lr.executive.mobile },
    branch: toBranch(lr.branch),
  });

  return jsonOk({
    stats,
    latestLr: latestLr ? mapLr(latestLr) : null,
    history: history.map(mapLr),
  });
}
