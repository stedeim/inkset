import type { PlanItemKind, PrismaClient } from "@prisma/client";
import { assertCoachManagesMembership, type Principal } from "@/modules/access/guard";
import { recordAudit } from "@/lib/audit";

/**
 * Coach-side mutations. Each one re-loads the target membership, enforces that
 * the acting coach manages it (admins bypass), performs the change, and records
 * an audit entry — the accountability trail this market expects.
 */

async function guardMembership(db: PrismaClient, principal: Principal, membershipId: string) {
  const membership = await db.membership.findUnique({
    where: { id: membershipId },
    select: { id: true, coachId: true },
  });
  if (!membership) throw new Error("Membership not found");
  assertCoachManagesMembership(principal, membership);
  return membership;
}

export async function addPlanItem(
  db: PrismaClient,
  principal: Principal,
  input: {
    membershipId: string;
    kind: PlanItemKind;
    title: string;
    details?: string;
    scheduledFor: Date;
  },
): Promise<void> {
  await guardMembership(db, principal, input.membershipId);
  await db.$transaction(async (tx) => {
    const item = await tx.planItem.create({
      data: {
        membershipId: input.membershipId,
        kind: input.kind,
        title: input.title,
        details: input.details || null,
        scheduledFor: input.scheduledFor,
        createdById: principal.userId,
      },
    });
    await recordAudit(tx, {
      actorId: principal.userId,
      action: "plan_item.create",
      entityType: "PlanItem",
      entityId: item.id,
      metadata: { membershipId: input.membershipId, kind: input.kind },
    });
  });
}

export async function addSessionNote(
  db: PrismaClient,
  principal: Principal,
  input: { membershipId: string; body: string; nextSteps?: string },
): Promise<void> {
  await guardMembership(db, principal, input.membershipId);
  await db.$transaction(async (tx) => {
    const note = await tx.sessionNote.create({
      data: {
        membershipId: input.membershipId,
        authorId: principal.userId,
        body: input.body,
        nextSteps: input.nextSteps || null,
      },
    });
    await recordAudit(tx, {
      actorId: principal.userId,
      action: "session_note.create",
      entityType: "SessionNote",
      entityId: note.id,
      metadata: { membershipId: input.membershipId },
    });
  });
}

export async function addMilestone(
  db: PrismaClient,
  principal: Principal,
  input: { membershipId: string; title: string; targetDate?: Date | null },
): Promise<void> {
  await guardMembership(db, principal, input.membershipId);
  await db.$transaction(async (tx) => {
    const milestone = await tx.milestone.create({
      data: {
        membershipId: input.membershipId,
        title: input.title,
        targetDate: input.targetDate ?? null,
      },
    });
    await recordAudit(tx, {
      actorId: principal.userId,
      action: "milestone.create",
      entityType: "Milestone",
      entityId: milestone.id,
      metadata: { membershipId: input.membershipId },
    });
  });
}
