import type { PrismaClient, Role } from "@prisma/client";
import { generateSessionToken, hashSessionToken } from "./tokens";
import { SESSION_TTL_MS } from "./constants";

export { SESSION_COOKIE, SESSION_TTL_MS } from "./constants";
/** Refresh the cookie/expiry when a session is more than a day old. */
const SESSION_RENEW_THRESHOLD_MS = 1000 * 60 * 60 * 24;

export type SessionUser = {
  id: string;
  email: string;
  fullName: string;
  role: Role;
};

export type ValidatedSession = {
  sessionId: string;
  user: SessionUser;
  freshExpiresAt?: Date; // set when the session was renewed and the cookie should be re-issued
};

type Ctx = { ipAddress?: string | null; userAgent?: string | null };

/**
 * Create a session for a user and return the raw token to be placed in a cookie.
 * Only the token's hash is persisted.
 */
export async function createSession(
  db: PrismaClient,
  userId: string,
  ctx: Ctx = {},
  now: Date = new Date(),
): Promise<{ token: string; expiresAt: Date }> {
  const token = generateSessionToken();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);
  await db.session.create({
    data: {
      tokenHash: hashSessionToken(token),
      userId,
      expiresAt,
      lastSeenAt: now,
      ipAddress: ctx.ipAddress ?? null,
      userAgent: ctx.userAgent ?? null,
    },
  });
  return { token, expiresAt };
}

/**
 * Validate a raw session token. Returns the associated user, or null if the
 * token is unknown or expired. Expired sessions are deleted on read. Sessions
 * past the renew threshold get their expiry extended (sliding window).
 */
export async function validateSession(
  db: PrismaClient,
  token: string | undefined,
  now: Date = new Date(),
): Promise<ValidatedSession | null> {
  if (!token) return null;

  const record = await db.session.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    include: { user: { select: { id: true, email: true, fullName: true, role: true } } },
  });
  if (!record) return null;

  if (record.expiresAt.getTime() <= now.getTime()) {
    await db.session.delete({ where: { id: record.id } }).catch(() => {});
    return null;
  }

  const result: ValidatedSession = {
    sessionId: record.id,
    user: record.user,
  };

  if (now.getTime() - record.lastSeenAt.getTime() > SESSION_RENEW_THRESHOLD_MS) {
    const freshExpiresAt = new Date(now.getTime() + SESSION_TTL_MS);
    await db.session.update({
      where: { id: record.id },
      data: { lastSeenAt: now, expiresAt: freshExpiresAt },
    });
    result.freshExpiresAt = freshExpiresAt;
  }

  return result;
}

/** Revoke a single session by its raw token (used on logout). */
export async function invalidateSession(db: PrismaClient, token: string): Promise<void> {
  await db.session.deleteMany({ where: { tokenHash: hashSessionToken(token) } });
}

/** Revoke every session for a user (used on password change / lost device). */
export async function invalidateAllSessions(db: PrismaClient, userId: string): Promise<void> {
  await db.session.deleteMany({ where: { userId } });
}
