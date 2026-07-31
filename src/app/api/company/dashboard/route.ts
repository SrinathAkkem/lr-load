import { NextRequest } from "next/server";
import {
  forbidden,
  getAuthFromRequest,
  unauthorized,
} from "@/lib/api/auth-middleware";
import { jsonOk } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";
import { toCompany, toLR } from "@/lib/db/serialize";
import {
  computeDashboardStats,
  computeDashboardStatsAllTime,
  getTopRoutes,
} from "@/lib/services/lr-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getAuthFromRequest(req);
  if (!session) return unauthorized();
  if (session.role !== "company_admin" || !session.companyId) return forbidden();

  const [company, stats, monthStats, topRoutes, branchCount, executiveCount, recentLrs] =
    await Promise.all([
      prisma.company.findUnique({ where: { id: session.companyId } }),
      computeDashboardStatsAllTime(session.companyId),
      computeDashboardStats(session.companyId),
      getTopRoutes(session.companyId),
      prisma.branch.count({ where: { companyId: session.companyId } }),
      prisma.user.count({
        where: { companyId: session.companyId, role: "executive" },
      }),
      prisma.lRRequest.findMany({
        where: { companyId: session.companyId },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

  return jsonOk({
    company: company ? toCompany(company) : null,
    stats,
    topRoutes,
    quota: {
      branches: { used: branchCount, max: company?.maxBranches ?? 0 },
      executives: { used: executiveCount, max: company?.maxExecutives ?? 0 },
      lrs: { used: monthStats.totalLrs, max: company?.maxLrPerMonth ?? 0 },
    },
    recentLrs: recentLrs.map(toLR),
  });
}
