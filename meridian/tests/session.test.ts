import { describe, expect, it } from "vitest";
import type { PrismaClient } from "@prisma/client";
import {
  createSession,
  invalidateAllSessions,
  invalidateSession,
  SESSION_TTL_MS,
  validateSession,
} from "@/modules/auth/session";
import { hashSessionToken, generateSessionToken, tokensMatch } from "@/modules/auth/tokens";

// Minimal in-memory stand-in for the subset of PrismaClient the session layer uses.
function fakeDb() {
  type Row = {
    id: string;
    tokenHash: string;
    userId: string;
    expiresAt: Date;
    createdAt: Date;
    lastSeenAt: Date;
    ipAddress: string | null;
    userAgent: string | null;
  };
  const rows: Row[] = [];
  const users: Record<string, { id: string; email: string; fullName: string; role: string }> = {
    u1: { id: "u1", email: "a@b.com", fullName: "Ada", role: "CLIENT" },
  };
  let seq = 0;
  const db = {
    session: {
      create: async ({ data }: any) => {
        const row: Row = { id: `s${++seq}`, createdAt: new Date(), ...data };
        rows.push(row);
        return row;
      },
      findUnique: async ({ where, include }: any) => {
        const row = rows.find((r) => r.tokenHash === where.tokenHash);
        if (!row) return null;
        return include?.user ? { ...row, user: users[row.userId] } : row;
      },
      update: async ({ where, data }: any) => {
        const row = rows.find((r) => r.id === where.id)!;
        Object.assign(row, data);
        return row;
      },
      delete: async ({ where }: any) => {
        const i = rows.findIndex((r) => r.id === where.id);
        if (i >= 0) rows.splice(i, 1);
      },
      deleteMany: async ({ where }: any) => {
        for (let i = rows.length - 1; i >= 0; i--) {
          if (where.tokenHash ? rows[i].tokenHash === where.tokenHash : rows[i].userId === where.userId) {
            rows.splice(i, 1);
          }
        }
      },
    },
    _rows: rows,
  };
  return db as unknown as PrismaClient & { _rows: Row[] };
}

describe("session tokens", () => {
  it("stores only the hash, never the raw token", () => {
    const token = generateSessionToken();
    const hash = hashSessionToken(token);
    expect(hash).not.toBe(token);
    expect(hashSessionToken(token)).toBe(hash); // deterministic
    expect(tokensMatch(hash, hashSessionToken(token))).toBe(true);
  });
});

describe("session lifecycle", () => {
  it("creates a session and validates its token", async () => {
    const db = fakeDb();
    const { token } = await createSession(db, "u1");
    expect(db._rows).toHaveLength(1);
    expect(db._rows[0].tokenHash).not.toBe(token); // hash stored, not raw

    const session = await validateSession(db, token);
    expect(session?.user.id).toBe("u1");
    expect(session?.user.role).toBe("CLIENT");
  });

  it("rejects unknown and expired tokens, deleting the expired row", async () => {
    const db = fakeDb();
    expect(await validateSession(db, "bogus")).toBeNull();

    const past = new Date(Date.now() - SESSION_TTL_MS - 1000);
    const { token } = await createSession(db, "u1", {}, past);
    expect(await validateSession(db, token)).toBeNull();
    expect(db._rows).toHaveLength(0); // expired session pruned on read
  });

  it("renews a session past the sliding-window threshold", async () => {
    const db = fakeDb();
    const twoDaysAgo = new Date(Date.now() - 1000 * 60 * 60 * 48);
    const { token } = await createSession(db, "u1", {}, twoDaysAgo);
    const session = await validateSession(db, token);
    expect(session?.freshExpiresAt).toBeInstanceOf(Date);
  });

  it("revokes a single session and all sessions for a user", async () => {
    const db = fakeDb();
    const a = await createSession(db, "u1");
    await createSession(db, "u1");
    expect(db._rows).toHaveLength(2);

    await invalidateSession(db, a.token);
    expect(db._rows).toHaveLength(1);

    await invalidateAllSessions(db, "u1");
    expect(db._rows).toHaveLength(0);
  });
});
