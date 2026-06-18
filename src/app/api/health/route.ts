import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/**
 * Liveness + database probe. Returns:
 *   200 — server is running and DB is reachable
 *   503 — server is up but DB is unreachable / mis-configured
 *
 * No auth so it can be hit by uptime monitors and the Hostinger panel.
 * Keep the returned data minimal — never leak schema or credentials.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();
  try {
    // SELECT 1 is portable across MySQL/PostgreSQL/SQLite.
    const [{ now }] = await prisma.$queryRaw<{ now: Date }[]>`SELECT NOW(3) as now`;
    const companies = await prisma.company.count();

    return NextResponse.json({
      ok: true,
      service: "rono-lr-web",
      uptime_ms: Math.round(process.uptime() * 1000),
      latency_ms: Date.now() - startedAt,
      db: {
        reachable: true,
        server_time: now,
        companies,
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        service: "rono-lr-web",
        latency_ms: Date.now() - startedAt,
        db: {
          reachable: false,
          error:
            err instanceof Error
              ? err.message
              : "Database connection failed",
        },
      },
      { status: 503 },
    );
  }
}
