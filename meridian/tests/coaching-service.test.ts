import { describe, expect, it } from "vitest";
import type { PrismaClient } from "@prisma/client";
import {
  addPlanItem,
  addSessionNote,
  setMilestoneAchieved,
} from "@/modules/coaching/service";
import { AccessError, type Principal } from "@/modules/access/guard";

function fakeDb() {
  const planItems: any[] = [];
  const notes: any[] = [];
  const audits: any[] = [];
  let seq = 0;
  const api: any = {
    membership: {
      findUnique: async ({ where }: any) =>
        where.id === "m_managed"
          ? { id: "m_managed", coachId: "coach_1" }
          : where.id === "m_other"
            ? { id: "m_other", coachId: "coach_2" }
            : null,
    },
    planItem: { create: async ({ data }: any) => ({ id: `p${++seq}`, ...data }) },
    sessionNote: { create: async ({ data }: any) => ({ id: `n${++seq}`, ...data }) },
    milestone: {
      findUnique: async ({ where }: any) =>
        where.id === "ms_managed"
          ? { id: "ms_managed", membership: { coachId: "coach_1" } }
          : where.id === "ms_other"
            ? { id: "ms_other", membership: { coachId: "coach_2" } }
            : null,
      update: async ({ data }: any) => ({ id: "ms_managed", ...data }),
    },
    auditLog: { create: async ({ data }: any) => audits.push(data) },
    $transaction: async (fn: any) => fn(api),
    _planItems: planItems,
    _notes: notes,
    _audits: audits,
  };
  return api as unknown as PrismaClient & { _audits: any[] };
}

const coach: Principal = { userId: "u_coach", role: "COACH", coachProfileId: "coach_1" };
const otherCoach: Principal = { userId: "u_coach2", role: "COACH", coachProfileId: "coach_x" };
const admin: Principal = { userId: "u_admin", role: "ADMIN" };

describe("coach mutations", () => {
  it("lets the managing coach add a plan item and writes an audit entry", async () => {
    const db = fakeDb();
    await addPlanItem(db, coach, {
      membershipId: "m_managed",
      kind: "WORKOUT",
      title: "Zone 2 — 40 min",
      scheduledFor: new Date("2026-01-02"),
    });
    expect(db._audits[0]).toMatchObject({ action: "plan_item.create", actorId: "u_coach" });
  });

  it("blocks a coach from editing a membership they do not manage", async () => {
    const db = fakeDb();
    await expect(
      addPlanItem(db, otherCoach, {
        membershipId: "m_managed",
        kind: "HABIT",
        title: "x",
        scheduledFor: new Date(),
      }),
    ).rejects.toBeInstanceOf(AccessError);
  });

  it("allows an admin to add a session note to any membership", async () => {
    const db = fakeDb();
    await addSessionNote(db, admin, { membershipId: "m_other", body: "Reviewed labs." });
    expect(db._audits[0]).toMatchObject({ action: "session_note.create", actorId: "u_admin" });
  });

  it("lets the managing coach mark a milestone achieved (audited)", async () => {
    const db = fakeDb();
    await setMilestoneAchieved(db, coach, { milestoneId: "ms_managed", achieved: true });
    expect(db._audits[0]).toMatchObject({ action: "milestone.achieve", actorId: "u_coach" });
  });

  it("blocks a coach from a milestone on a membership they do not manage", async () => {
    const db = fakeDb();
    await expect(
      setMilestoneAchieved(db, otherCoach, { milestoneId: "ms_managed", achieved: true }),
    ).rejects.toBeInstanceOf(AccessError);
  });

  it("rejects an unknown milestone", async () => {
    const db = fakeDb();
    await expect(
      setMilestoneAchieved(db, coach, { milestoneId: "nope", achieved: true }),
    ).rejects.toBeInstanceOf(AccessError);
  });
});
