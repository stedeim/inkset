import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Session token primitives. The raw token lives only in the client cookie; the
 * database stores its SHA-256 hash. SHA-256 (not argon2) is correct here because
 * the token is already 256 bits of cryptographic randomness — there is nothing
 * to brute-force, so a fast hash is fine and keeps request latency low.
 */

/** Generate a fresh, URL-safe session token (256 bits of entropy). */
export function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Deterministically hash a token for storage / lookup. */
export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Constant-time comparison of two hex-encoded hashes. */
export function tokensMatch(aHex: string, bHex: string): boolean {
  const a = Buffer.from(aHex, "hex");
  const b = Buffer.from(bHex, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
