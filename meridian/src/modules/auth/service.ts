import type { PrismaClient } from "@prisma/client";
import { recordAudit } from "@/lib/audit";
import { hashPassword, verifyPassword } from "./passwords";
import type { SignupInput, LoginInput } from "./schemas";

export type RegisterResult =
  | { ok: true; userId: string }
  | { ok: false; error: "EMAIL_TAKEN" };

/**
 * Register a new client. Self-serve signup always creates a CLIENT with a
 * membership at the chosen tier in PENDING status (activated once onboarding and
 * billing complete). Coaches and admins are provisioned separately, never here.
 */
export async function registerClient(
  db: PrismaClient,
  input: SignupInput,
): Promise<RegisterResult> {
  const existing = await db.user.findUnique({ where: { email: input.email } });
  if (existing) return { ok: false, error: "EMAIL_TAKEN" };

  const passwordHash = await hashPassword(input.password);

  const user = await db.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        email: input.email,
        fullName: input.fullName,
        passwordHash,
        role: "CLIENT",
        membership: {
          create: {
            tier: input.tier,
            status: "PENDING",
            messageThread: { create: {} },
          },
        },
      },
    });
    await recordAudit(tx, {
      actorId: created.id,
      action: "user.register",
      entityType: "User",
      entityId: created.id,
      metadata: { tier: input.tier },
    });
    return created;
  });

  return { ok: true, userId: user.id };
}

export type AuthenticateResult =
  | { ok: true; userId: string }
  | { ok: false; error: "INVALID_CREDENTIALS" };

/**
 * Verify an email/password pair. Runs a hash verification even when the user is
 * not found, so response timing does not reveal whether an email is registered.
 */
export async function authenticate(
  db: PrismaClient,
  input: LoginInput,
): Promise<AuthenticateResult> {
  const user = await db.user.findUnique({ where: { email: input.email } });

  // Dummy hash to equalize timing for unknown emails. Cost matches a real hash.
  const hash =
    user?.passwordHash ??
    "$argon2id$v=19$m=19456,t=2,p=1$c29tZXNhbHR2YWx1ZQ$3s5f0nQ0m8m2Q0zJ8xq7Yw0m1n2b3v4c5x6z7a8b9c0";

  const valid = await verifyPassword(hash, input.password);
  if (!user || !valid) return { ok: false, error: "INVALID_CREDENTIALS" };

  return { ok: true, userId: user.id };
}
