import type { PrismaClient } from "@prisma/client";
import { startOfDay, endOfDay, daysAgo } from "@/lib/dates";

/** Plan items scheduled for the given day, with their completion status. */
export async function getPlanForDay(db: PrismaClient, membershipId: string, day: Date) {
  return db.planItem.findMany({
    where: { membershipId, scheduledFor: { gte: startOfDay(day), lte: endOfDay(day) } },
    include: { completions: true },
    orderBy: { createdAt: "asc" },
  });
}

/** Recent daily check-ins (most recent last) for the trend view. */
export async function getRecentCheckIns(
  db: PrismaClient,
  membershipId: string,
  days: number,
  today: Date,
) {
  return db.checkIn.findMany({
    where: { membershipId, date: { gte: daysAgo(today, days - 1) } },
    orderBy: { date: "asc" },
  });
}

/** Consistency: share of the last N days' plan items marked completed. */
export async function getConsistency(
  db: PrismaClient,
  membershipId: string,
  days: number,
  today: Date,
): Promise<{ completed: number; total: number }> {
  const items = await db.planItem.findMany({
    where: { membershipId, scheduledFor: { gte: daysAgo(today, days - 1), lte: endOfDay(today) } },
    include: { completions: true },
  });
  const total = items.length;
  const completed = items.filter((i) => i.completions[0]?.status === "COMPLETED").length;
  return { completed, total };
}
