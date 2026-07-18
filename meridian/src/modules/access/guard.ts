import type { Role } from "@prisma/client";

/**
 * Route/action-level authorization primitives. Keeps client and coach data
 * strictly separated: a client may only ever reach their own membership, and a
 * coach may only reach memberships explicitly assigned to them.
 */

export type Principal = {
  userId: string;
  role: Role;
  /** Present only for coaches — their CoachProfile id. */
  coachProfileId?: string;
};

export class AccessError extends Error {
  constructor(message = "Not authorized") {
    super(message);
    this.name = "AccessError";
  }
}

export function requireRole(principal: Principal, role: Role): void {
  if (principal.role !== role) {
    throw new AccessError(`Requires ${role} role`);
  }
}

/** A client may act on a membership only if they own it. */
export function assertClientOwnsMembership(
  principal: Principal,
  membership: { clientId: string },
): void {
  if (principal.role !== "CLIENT" || membership.clientId !== principal.userId) {
    throw new AccessError();
  }
}

/** A coach may act on a membership only if it is assigned to them (admins bypass). */
export function assertCoachManagesMembership(
  principal: Principal,
  membership: { coachId: string | null },
): void {
  if (principal.role === "ADMIN") return;
  if (
    principal.role !== "COACH" ||
    !principal.coachProfileId ||
    membership.coachId !== principal.coachProfileId
  ) {
    throw new AccessError();
  }
}
