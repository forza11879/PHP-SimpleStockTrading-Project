import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/src/lib/password";

describe("verifyPassword (bcrypt-only)", () => {
  it("accepts the correct password against a bcrypt hash", () => {
    const stored = hashPassword("gG560526");
    expect(verifyPassword("gG560526", stored)).toBe(true);
  });

  it("rejects a wrong password", () => {
    const stored = hashPassword("gG560526");
    expect(verifyPassword("wrongpass1", stored)).toBe(false);
  });

  it("rejects a stored plain-text password (no legacy fallback)", () => {
    expect(verifyPassword("gG560526", "gG560526")).toBe(false);
  });
});