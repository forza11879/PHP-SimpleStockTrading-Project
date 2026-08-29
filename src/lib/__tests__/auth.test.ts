import { beforeEach, describe, expect, it, vi } from "vitest";
import { insert, queryFirstRow } from "@/src/lib/db";
import { initDb } from "@/src/lib/schema";
import { verifyPassword } from "@/src/lib/password";
import {
  loginAction,
  passResetFormAction,
  registerAction,
} from "@/src/lib/actions";
import { freshDb } from "@/src/test/db";

const h = vi.hoisted(() => ({ setCookie: "" }));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: () => undefined,
    set: (_name: string, value: string) => {
      h.setCookie = value;
    },
  }),
}));

beforeEach(() => {
  freshDb();
  h.setCookie = "";
});

function form(entries: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(entries)) fd.set(key, value);
  return fd;
}

describe("auth flows (bcrypt-only seeds)", () => {
  it("logs in a seed account with the correct password and sets a session cookie", async () => {
    await expect(
      loginAction({}, form({ email: "grish@gmail.com", password: "gG560526" })),
    ).rejects.toThrow("REDIRECT:/dashboard");
    // Session cookie payload is "<userId>.<hmac>".
    expect(h.setCookie).toContain("1.");
  });

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

  it("rejects a wrong password and sets no cookie", async () => {
    const res = await loginAction(
      {},
      form({ email: "grish@gmail.com", password: "wrongpass1" }),
    );
    expect(res.errors).toBeDefined();
    expect(h.setCookie).toBe("");
  });

  it("registers a new user and stores a bcrypt hash", async () => {
    await expect(
      registerAction(
        {},
        form({
          email: "new@example.com",
          name: "New",
          pass1: "Passw0rd",
          pass2: "Passw0rd",
        }),
      ),
    ).rejects.toThrow("REDIRECT:/register/success");
    const user = queryFirstRow(
      "SELECT * FROM users WHERE email = 'new@example.com'",
    )!;
    expect((user.password as string).startsWith("$2")).toBe(true);
  });

  it("resets a password via a valid token and stores a bcrypt hash", async () => {
    const token = "tok123";
    const expiry = new Date(Date.now() + 60000)
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");
    insert("passresets", { userID: 3, secretToken: token, expiryDateTime: expiry });

    await expect(
      passResetFormAction(
        token,
        {},
        form({ pass1: "NewPass1", pass2: "NewPass1" }),
      ),
    ).rejects.toThrow("REDIRECT:/passreset/form-success");

    const user = queryFirstRow("SELECT * FROM users WHERE id = 3")!;
    expect((user.password as string).startsWith("$2")).toBe(true);
    expect(
      queryFirstRow("SELECT * FROM passresets WHERE secretToken = ?", token),
    ).toBeNull();
  });
});