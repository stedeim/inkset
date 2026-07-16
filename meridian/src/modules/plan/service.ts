import type { CompletionStatus, PrismaClient } from "@prisma/client";
import { AccessError } from "@/modules/access/guard";
import { startOfDay } from "@/lib/dates";

/**
 * Mark a plan item completed or skipped. The client may only touch plan items
 * belonging to their own membership — verified before any write.
 */
export async function setCompletion(
  db: PrismaClient,
  args: { clientId: string; planItemId: string; status: CompletionStatus },
): Promise<void> {
  const item = await db.planItem.findUnique({
    where: { id: args.planItemId },
    include: { membership: { select: { clientId: true } } },
  });
  if (!item || item.membership.clientId !== args.clientId) throw new AccessError();

  await db.completion.upsert({
    where: { planItemId: args.planItemId },
    create: { planItemId: args.planItemId, status: args.status },
    update: { status: args.status, notedAt: new Date() },
  });
}

/** Record (or overwrite) the client's self-reported check-in for a given day. */
export async function submitCheckIn(
  db: PrismaClient,
  args: {
    clientId: string;
    membershipId: string;
    energy?: number | null;
    sleepHours?: number | null;
    mood?: number | null;
  },
  day: Date = new Date(),
): Promise<void> {
  const membership = await db.membership.findUnique({
    where: { id: args.membershipId },
    select: { clientId: true },
  });
  if (!membership || membership.clientId !== args.clientId) throw new AccessError();

  const date = startOfDay(day);
  await db.checkIn.upsert({
    where: { membershipId_date: { membershipId: args.membershipId, date } },
    create: {
      membershipId: args.membershipId,
      date,
      energy: args.energy ?? null,
      sleepHours: args.sleepHours ?? null,
      mood: args.mood ?? null,
    },
    update: { energy: args.energy ?? null, sleepHours: args.sleepHours ?? null, mood: args.mood ?? null },
  });
}
