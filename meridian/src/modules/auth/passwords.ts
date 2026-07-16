import argon2 from "argon2";

/**
 * Password hashing using argon2id — the current OWASP-recommended algorithm.
 * Hashes are irreversible; verification recomputes and compares in constant time.
 * The tuning parameters below balance resistance against cost on server hardware.
 */
const OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 19_456, // 19 MiB
  timeCost: 2,
  parallelism: 1,
};

export function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, OPTIONS);
}

export async function verifyPassword(hash: string, plain: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain);
  } catch {
    // A malformed hash should read as "does not match", never as an error the
    // caller might treat as a successful login.
    return false;
  }
}
