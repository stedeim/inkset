import type { PrismaClient } from "@prisma/client";
import {
  AccessError,
  assertClientOwnsMembership,
  assertCoachManagesMembership,
  type Principal,
} from "@/modules/access/guard";

/**
 * Send a message on a membership's thread. The sender must be either the client
 * who owns the membership or the coach who manages it (admins bypass). The
 * thread is created on demand if it does not yet exist.
 */
export async function sendMessage(
  db: PrismaClient,
  principal: Principal,
  input: { membershipId: string; body: string },
): Promise<void> {
  const membership = await db.membership.findUnique({
    where: { id: input.membershipId },
    select: { id: true, clientId: true, coachId: true },
  });
  if (!membership) throw new AccessError();

  if (principal.role === "CLIENT") assertClientOwnsMembership(principal, membership);
  else assertCoachManagesMembership(principal, membership);

  const thread = await db.messageThread.upsert({
    where: { membershipId: membership.id },
    create: { membershipId: membership.id },
    update: {},
  });

  await db.message.create({
    data: { threadId: thread.id, senderId: principal.userId, body: input.body },
  });
}

/** Mark every message the reader did not send as read. */
export async function markThreadRead(
  db: PrismaClient,
  membershipId: string,
  readerId: string,
): Promise<void> {
  const thread = await db.messageThread.findUnique({ where: { membershipId }, select: { id: true } });
  if (!thread) return;
  await db.message.updateMany({
    where: { threadId: thread.id, senderId: { not: readerId }, readAt: null },
    data: { readAt: new Date() },
  });
}
