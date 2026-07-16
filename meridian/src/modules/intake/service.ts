import type { PrismaClient } from "@prisma/client";
import { recordAudit } from "@/lib/audit";
import type { IntakeInput } from "./schema";

/**
 * Persist a completed intake for a membership. Stores the three structured
 * groups as JSON, records consent with a timestamp, marks the intake complete,
 * and activates the membership. Idempotent via upsert so a client can revise
 * answers without creating duplicates.
 */
export async function saveIntake(
  db: PrismaClient,
  args: { membershipId: string; actorId: string; input: IntakeInput },
  now: Date = new Date(),
): Promise<void> {
  const { membershipId, actorId, input } = args;

  await db.$transaction(async (tx) => {
    await tx.intake.upsert({
      where: { membershipId },
      create: {
        membershipId,
        goals: input.goals,
        constraints: input.constraints,
        currentHabits: input.currentHabits,
        consentSigned: true,
        consentAt: now,
        completedAt: now,
      },
      update: {
        goals: input.goals,
        constraints: input.constraints,
        currentHabits: input.currentHabits,
        consentSigned: true,
        consentAt: now,
        completedAt: now,
      },
    });

    // Completing intake moves a PENDING membership into ACTIVE.
    await tx.membership.update({
      where: { id: membershipId },
      data: { status: "ACTIVE" },
    });

    await recordAudit(tx, {
      actorId,
      action: "intake.complete",
      entityType: "Membership",
      entityId: membershipId,
      metadata: { primaryGoal: input.goals.primaryGoal },
    });
  });
}
