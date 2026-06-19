import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { UserRole } from "@/lib/types";

export interface AuditEvent {
  actorId?: string | null;
  actorName: string;
  actorRole: UserRole;
  companyId?: string | null;
  action: string;
  target?: string;
  metadata?: Record<string, unknown>;
  ip?: string | null;
}

/**
 * Record a structured audit event. Failures are swallowed and logged because
 * audit logging must never break the user-facing request path.
 */
export async function recordAuditEvent(event: AuditEvent): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: event.actorId ?? null,
        actorName: event.actorName,
        actorRole: event.actorRole,
        companyId: event.companyId ?? null,
        action: event.action,
        target: event.target ?? null,
        metadata: event.metadata
          ? (event.metadata as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        ip: event.ip ?? null,
      },
    });
  } catch (err) {
    console.warn("[audit] failed to record event", event.action, err);
  }
}

export interface AuditLogQuery {
  companyId?: string;
  action?: string;
  actorRole?: UserRole;
  limit?: number;
}

export async function listAuditEvents(query: AuditLogQuery = {}) {
  const limit = Math.min(Math.max(query.limit ?? 100, 1), 500);
  const where: Prisma.AuditLogWhereInput = {};
  if (query.companyId) where.companyId = query.companyId;
  if (query.action) where.action = query.action;
  if (query.actorRole) where.actorRole = query.actorRole;

  const rows = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return rows.map((row) => ({
    id: row.id,
    actorId: row.actorId,
    actorName: row.actorName,
    actorRole: row.actorRole,
    companyId: row.companyId,
    action: row.action,
    target: row.target,
    metadata: (row.metadata as Record<string, unknown> | null) ?? null,
    ip: row.ip,
    createdAt: row.createdAt.toISOString(),
  }));
}
