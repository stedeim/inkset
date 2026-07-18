import type { PrismaClient } from "@prisma/client";

/**
 * Load the signed-in client's membership with the context the client surfaces
 * need: tier, status, intake completion, and assigned coach. Returns null if the
 * user somehow has no membership (should not happen for a CLIENT).
 */
export async function getClientMembership(db: PrismaClient, clientId: string) {
  return db.membership.findUnique({
    where: { clientId },
    include: {
      intake: true,
      coach: { include: { user: { select: { fullName: true } } } },
    },
  });
}

export type ClientMembership = NonNullable<Awaited<ReturnType<typeof getClientMembership>>>;

/** Whether the client still needs to complete intake before using the app. */
export function needsOnboarding(membership: { intake: { completedAt: Date | null } | null }): boolean {
  return !membership.intake?.completedAt;
}
