import { describe, expect, it } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { sendMessage } from "@/modules/messaging/service";
import { AccessError, type Principal } from "@/modules/access/guard";

function fakeDb() {
  const messages: any[] = [];
  const api: any = {
    membership: {
      findUnique: async ({ where }: any) =>
        where.id === "m1" ? { id: "m1", clientId: "client_a", coachId: "coach_1" } : null,
    },
    messageThread: {
      upsert: async ({ where }: any) => ({ id: "t_" + where.membershipId }),
    },
    message: {
      create: async ({ data }: any) => messages.push(data),
    },
    _messages: messages,
  };
  return api as unknown as PrismaClient & { _messages: any[] };
}

const client: Principal = { userId: "client_a", role: "CLIENT" };
const stranger: Principal = { userId: "client_z", role: "CLIENT" };
const coach: Principal = { userId: "u_coach", role: "COACH", coachProfileId: "coach_1" };
const otherCoach: Principal = { userId: "u_coach2", role: "COACH", coachProfileId: "coach_2" };

describe("sendMessage", () => {
  it("lets the owning client post to their thread", async () => {
    const db = fakeDb();
    await sendMessage(db, client, { membershipId: "m1", body: "Hello" });
    expect(db._messages[0]).toMatchObject({ senderId: "client_a", body: "Hello" });
  });

  it("lets the managing coach post", async () => {
    const db = fakeDb();
    await sendMessage(db, coach, { membershipId: "m1", body: "Checking in" });
    expect(db._messages[0]).toMatchObject({ senderId: "u_coach" });
  });

  it("blocks a different client", async () => {
    const db = fakeDb();
    await expect(sendMessage(db, stranger, { membershipId: "m1", body: "hi" })).rejects.toBeInstanceOf(
      AccessError,
    );
  });

  it("blocks a coach who does not manage the membership", async () => {
    const db = fakeDb();
    await expect(
      sendMessage(db, otherCoach, { membershipId: "m1", body: "hi" }),
    ).rejects.toBeInstanceOf(AccessError);
  });

  it("rejects an unknown membership", async () => {
    const db = fakeDb();
    await expect(sendMessage(db, client, { membershipId: "nope", body: "hi" })).rejects.toBeInstanceOf(
      AccessError,
    );
  });
});
