import { beforeEach, describe, expect, it } from "vitest";
import { queryFirstRow, insert } from "@/src/lib/db";
import { initDb } from "@/src/lib/schema";
import { freshDb } from "@/src/test/db";
import { hashPassword, verifyPassword } from "@/src/lib/password";

beforeEach(() => freshDb());

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

describe("seeded accounts", () => {
  it("supports every documented demo account password", () => {
    const accounts: Array<[string, string]> = [
      ["grish@gmail.com", "gG560526"],
      ["Forza11879@gmail.com", "Forzaforza77"],
      ["ipd9@gmail.com", "gG560526"],
    ];
    for (const [email, password] of accounts) {
      const user = queryFirstRow("SELECT * FROM users WHERE email = ?", email)!;
      expect(verifyPassword(password, user.password as string)).toBe(true);
    }
  });

  it("migrates a legacy plain-text password row to a bcrypt hash on init", () => {
    insert("users", {
      email: "legacy@example.com",
      name: "Legacy",
      password: "PlainPass1",
      cash: 50000,
      equity: 50000,
    });
    initDb();
    const user = queryFirstRow(
      "SELECT * FROM users WHERE email = 'legacy@example.com'",
    )!;
    expect((user.password as string).startsWith("$2")).toBe(true);
    expect(verifyPassword("PlainPass1", user.password as string)).toBe(true);
  });
});