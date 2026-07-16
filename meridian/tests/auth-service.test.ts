import { describe, expect, it } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { authenticate, registerClient } from "@/modules/auth/service";
import { hashPassword } from "@/modules/auth/passwords";

function fakeDb() {
  const users: any[] = [];
  const audits: any[] = [];
  let seq = 0;
  const api = {
    user: {
      findUnique: async ({ where }: any) => users.find((u) => u.email === where.email) ?? null,
      create: async ({ data }: any) => {
        const user = { id: `u${++seq}`, ...data };
        users.push(user);
        if (data.membership?.create) {
          user.membership = { id: `m${seq}`, ...data.membership.create };
        }
        return user;
      },
    },
    auditLog: { create: async ({ data }: any) => audits.push(data) },
    $transaction: async (fn: any) => fn(api),
    _users: users,
    _audits: audits,
  };
  return api as unknown as PrismaClient & { _users: any[]; _audits: any[] };
}

describe("registerClient", () => {
  it("creates a CLIENT with a tiered membership and an audit entry", async () => {
    const db = fakeDb();
    const res = await registerClient(db, {
      fullName: "Ada Lovelace",
      email: "ada@example.com",
      password: "a-strong-passphrase",
      tier: "TIER_2",
    });
    expect(res.ok).toBe(true);
    expect(db._users[0].role).toBe("CLIENT");
    expect(db._users[0].membership.tier).toBe("TIER_2");
    expect(db._users[0].membership.status).toBe("PENDING");
    expect(db._audits[0].action).toBe("user.register");
    expect(db._users[0].passwordHash).not.toBe("a-strong-passphrase");
  });

  it("rejects a duplicate email", async () => {
    const db = fakeDb();
    const input = {
      fullName: "Ada",
      email: "ada@example.com",
      password: "a-strong-passphrase",
      tier: "TIER_1" as const,
    };
    await registerClient(db, input);
    const res = await registerClient(db, input);
    expect(res).toEqual({ ok: false, error: "EMAIL_TAKEN" });
  });
});

describe("authenticate", () => {
  it("accepts correct credentials and rejects wrong ones", async () => {
    const db = fakeDb();
    db._users.push({
      id: "u1",
      email: "ada@example.com",
      passwordHash: await hashPassword("right-passphrase"),
    });

    expect(await authenticate(db, { email: "ada@example.com", password: "right-passphrase" })).toEqual(
      { ok: true, userId: "u1" },
    );
    expect(
      await authenticate(db, { email: "ada@example.com", password: "wrong-passphrase" }),
    ).toEqual({ ok: false, error: "INVALID_CREDENTIALS" });
  });

  it("rejects an unknown email without leaking that it is unknown", async () => {
    const db = fakeDb();
    const res = await authenticate(db, { email: "nobody@example.com", password: "whatever" });
    expect(res).toEqual({ ok: false, error: "INVALID_CREDENTIALS" });
  });
});
