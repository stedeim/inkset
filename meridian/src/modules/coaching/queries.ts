import type { PrismaClient, Role } from "@prisma/client";

/** The coach's CoachProfile id, or null for admins / non-coaches. */
export async function getCoachProfileId(db: PrismaClient, userId: string): Promise<string | null> {
  const profile = await db.coachProfile.findUnique({ where: { userId }, select: { id: true } });
  return profile?.id ?? null;
}

/**
 * The roster a coach (or admin) sees. Coaches see only their assigned members;
 * admins see everyone. Returns lightweight rows for the list view.
 */
export async function getRoster(
  db: PrismaClient,
  viewer: { userId: string; role: Role; coachProfileId: string | null },
) {
  const where =
    viewer.role === "ADMIN" ? {} : { coachId: viewer.coachProfileId ?? "__none__" };

  return db.membership.findMany({
    where,
    include: {
      client: { select: { fullName: true, email: true } },
      intake: { select: { completedAt: true, goals: true } },
    },
    orderBy: { startedAt: "desc" },
  });
}

/** Full detail for one client's membership, for the coach client-detail page. */
export async function getMembershipDetail(db: PrismaClient, membershipId: string) {
  return db.membership.findUnique({
    where: { id: membershipId },
    include: {
      client: { select: { fullName: true, email: true } },
      intake: true,
      planItems: { include: { completions: true }, orderBy: { scheduledFor: "desc" }, take: 20 },
      sessionNotes: { orderBy: { createdAt: "desc" }, take: 10 },
      milestones: { orderBy: { createdAt: "desc" } },
    },
  });
}

export type MembershipDetail = NonNullable<Awaited<ReturnType<typeof getMembershipDetail>>>;
