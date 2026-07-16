import { describe, expect, it } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { setCompletion, submitCheckIn } from "@/modules/plan/service";
import { AccessError } from "@/modules/access/guard";

function fakeDb() {
  const completions: any[] = [];
  const checkIns: any[] = [];
  const api = {
    planItem: {
      findUnique: async ({ where }: any) =>
        where.id === "item_owned"
          ? { id: "item_owned", membership: { clientId: "client_a" } }
          : where.id === "item_other"
            ? { id: "item_other", membership: { clientId: "client_b" } }
            : null,
    },
    completion: {
      upsert: async ({ where, create, update }: any) => {
        const existing = completions.find((c) => c.planItemId === where.planItemId);
        if (existing) Object.assign(existing, update);
        else completions.push({ ...create });
      },
    },
    membership: {
      findUnique: async ({ where }: any) =>
        where.id === "m_a" ? { clientId: "client_a" } : { clientId: "client_b" },
    },
    checkIn: {
      upsert: async ({ create }: any) => checkIns.push({ ...create }),
    },
    _completions: completions,
    _checkIns: checkIns,
  };
  return api as unknown as PrismaClient & { _completions: any[]; _checkIns: any[] };
}

describe("setCompletion", () => {
  it("lets a client complete their own plan item", async () => {
    const db = fakeDb();
    await setCompletion(db, { clientId: "client_a", planItemId: "item_owned", status: "COMPLETED" });
    expect(db._completions[0]).toMatchObject({ planItemId: "item_owned", status: "COMPLETED" });
  });

  it("refuses a plan item that belongs to another client", async () => {
    const db = fakeDb();
    await expect(
      setCompletion(db, { clientId: "client_a", planItemId: "item_other", status: "COMPLETED" }),
    ).rejects.toBeInstanceOf(AccessError);
  });

  it("refuses an unknown plan item", async () => {
    const db = fakeDb();
    await expect(
      setCompletion(db, { clientId: "client_a", planItemId: "nope", status: "SKIPPED" }),
    ).rejects.toBeInstanceOf(AccessError);
  });
});

describe("submitCheckIn", () => {
  it("records a check-in for the owning client", async () => {
    const db = fakeDb();
    await submitCheckIn(db, { clientId: "client_a", membershipId: "m_a", energy: 7, sleepHours: 7.5, mood: 6 });
    expect(db._checkIns[0]).toMatchObject({ energy: 7, sleepHours: 7.5, mood: 6 });
  });

  it("refuses a membership the client does not own", async () => {
    const db = fakeDb();
    await expect(
      submitCheckIn(db, { clientId: "client_a", membershipId: "m_b", energy: 5 }),
    ).rejects.toBeInstanceOf(AccessError);
  });
});
