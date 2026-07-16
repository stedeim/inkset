import type { Prisma, PrismaClient } from "@prisma/client";

/**
 * Append an entry to the audit trail. Every sensitive or coach-initiated
 * mutation should call this. Kept deliberately small so it can be invoked
 * inside a transaction alongside the change it records.
 */
export async function recordAudit(
  db: PrismaClient | Prisma.TransactionClient,
  entry: {
    actorId: string;
    action: string;
    entityType: string;
    entityId: string;
    metadata?: Prisma.InputJsonValue;
  },
): Promise<void> {
  await db.auditLog.create({
    data: {
      actorId: entry.actorId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      metadata: entry.metadata,
    },
  });
}
