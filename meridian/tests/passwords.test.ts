import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/modules/auth/passwords";

describe("password hashing", () => {
  it("produces an argon2id hash that is not the plaintext", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(hash).toMatch(/^\$argon2id\$/);
    expect(hash).not.toContain("correct horse");
  });

  it("verifies a matching password and rejects a wrong one", async () => {
    const hash = await hashPassword("s3cret-passphrase");
    expect(await verifyPassword(hash, "s3cret-passphrase")).toBe(true);
    expect(await verifyPassword(hash, "wrong-passphrase")).toBe(false);
  });

  it("salts: identical passwords yield different hashes", async () => {
    const a = await hashPassword("same-input");
    const b = await hashPassword("same-input");
    expect(a).not.toBe(b);
  });

  it("treats a malformed hash as a non-match rather than throwing", async () => {
    expect(await verifyPassword("not-a-real-hash", "anything")).toBe(false);
  });
});
