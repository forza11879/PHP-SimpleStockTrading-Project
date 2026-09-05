import { beforeEach, describe, expect, it } from "vitest";
import { count, queryFirstRow } from "@/src/lib/db";
import { freshDb } from "@/src/test/db";
import { verifyPassword } from "@/src/lib/password";
import {
  GOOGLE_AUTHORIZATION_ENDPOINT,
  GOOGLE_LOGIN_GENERIC_ERROR,
  buildAuthorizationUrl,
  codeChallengeS256,
  generateCodeVerifier,
  generateState,
  getGoogleConfig,
  googleErrorMessage,
  isValidState,
  loginErrorUrl,
  packStateCookie,
  publicBaseUrl,
  resolveGoogleUser,
} from "@/src/lib/google-auth";

beforeEach(() => freshDb());

describe("PKCE (RFC 7636 S256)", () => {
  it("matches the RFC 7636 Appendix B test vector", () => {
    expect(
      codeChallengeS256("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"),
    ).toBe("E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM");
  });

  it("generates verifiers of valid length and charset", () => {
    for (let i = 0; i < 5; i++) {
      const verifier = generateCodeVerifier();
      expect(verifier.length).toBeGreaterThanOrEqual(43);
      expect(verifier.length).toBeLessThanOrEqual(128);
      expect(verifier).toMatch(/^[A-Za-z0-9\-_]+$/);
      expect(codeChallengeS256(verifier)).toMatch(/^[A-Za-z0-9\-_]+$/);
    }
  });
});

describe("state (CSRF protection)", () => {
  it("accepts the round-tripped state", () => {
    const state = generateState();
    expect(isValidState(state, packStateCookie(state))).toBe(true);
  });

  it("rejects mismatched, missing, or tampered values", () => {
    const state = generateState();
    const cookie = packStateCookie(state);
    expect(isValidState("something-else", cookie)).toBe(false);
    expect(isValidState(state, packStateCookie(generateState()))).toBe(false);
    expect(isValidState(state, undefined)).toBe(false);
    expect(isValidState(null, cookie)).toBe(false);
    expect(isValidState(state, "no-signature-here")).toBe(false);
    // Flip the signature: must not validate.
    const tampered = `${cookie.slice(0, -1)}${cookie.endsWith("0") ? "1" : "0"}`;
    expect(isValidState(state, tampered)).toBe(false);
  });
});

describe("authorization URL", () => {
  it("targets Google with the code flow, PKCE, and state", () => {
    const url = new URL(
      buildAuthorizationUrl({
        clientId: "test-client-id",
        redirectUri: "http://localhost:3000/api/auth/google/callback",
        state: "test-state",
        codeChallenge: "test-challenge",
      }),
    );
    expect(`${url.origin}${url.pathname}`).toBe(GOOGLE_AUTHORIZATION_ENDPOINT);
    expect(url.searchParams.get("client_id")).toBe("test-client-id");
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("code_challenge")).toBe("test-challenge");
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    expect(url.searchParams.get("state")).toBe("test-state");
    expect(url.searchParams.get("scope")).toContain("openid");
    expect(url.searchParams.get("scope")).toContain("email");
    expect(url.searchParams.get("client_secret")).toBeNull();
  });
});

describe("configuration", () => {
  const saved = { ...process.env };

  function restoreEnv() {
    for (const key of Object.keys(process.env)) {
      if (!(key in saved)) delete process.env[key];
    }
    Object.assign(process.env, saved);
  }

  it("is unconfigured without credentials", () => {
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    try {
      expect(getGoogleConfig()).toBeNull();
    } finally {
      restoreEnv();
    }
  });

  it("builds the default redirect URI from HOST", () => {
    process.env.GOOGLE_CLIENT_ID = "id";
    process.env.GOOGLE_CLIENT_SECRET = "secret";
    process.env.HOST = "http://localhost:3000";
    delete process.env.GOOGLE_REDIRECT_URI;
    try {
      expect(getGoogleConfig()?.redirectUri).toBe(
        "http://localhost:3000/api/auth/google/callback",
      );
    } finally {
      restoreEnv();
    }
  });

  it("honours an explicit redirect URI override", () => {
    process.env.GOOGLE_CLIENT_ID = "id";
    process.env.GOOGLE_CLIENT_SECRET = "secret";
    process.env.GOOGLE_REDIRECT_URI =
      "https://app.example.com/api/auth/google/callback";
    try {
      expect(getGoogleConfig()?.redirectUri).toBe(
        "https://app.example.com/api/auth/google/callback",
      );
    } finally {
      restoreEnv();
    }
  });

  it("normalises the public base URL", () => {
    const previous = process.env.HOST;
    try {
      delete process.env.HOST;
      expect(publicBaseUrl()).toBe("http://localhost:3000");
      process.env.HOST = "http://localhost:3000/";
      expect(publicBaseUrl()).toBe("http://localhost:3000");
      process.env.HOST = "example.com:4000";
      expect(publicBaseUrl()).toBe("http://example.com:4000");
    } finally {
      if (previous === undefined) delete process.env.HOST;
      else process.env.HOST = previous;
    }
  });
});

describe("login error mapping", () => {
  it("maps known codes to user-friendly messages", () => {
    expect(googleErrorMessage("access_denied")).toContain("cancelled");
    expect(googleErrorMessage("state_mismatch")).not.toContain("state");
    expect(googleErrorMessage("account_conflict")).toContain("password");
  });

  it("falls back to a generic message for unknown codes", () => {
    expect(googleErrorMessage("no_such_code")).toBe(GOOGLE_LOGIN_GENERIC_ERROR);
    expect(googleErrorMessage(null)).toBe(GOOGLE_LOGIN_GENERIC_ERROR);
  });

  it("builds login error URLs without leaking details", () => {
    expect(loginErrorUrl("state_mismatch")).toBe("/login?error=state_mismatch");
  });
});

describe("resolveGoogleUser (account linking)", () => {
  it("creates a new user with the registration cash grant", () => {
    const before = count("users");
    const result = resolveGoogleUser({
      sub: "google-sub-new",
      email: "newperson@example.com",
      emailVerified: true,
      name: "New Person",
    });
    expect(result).toEqual({ ok: true, userId: expect.any(Number) });
    expect(count("users")).toBe(before + 1);
    const row = queryFirstRow(
      "SELECT * FROM users WHERE email = ?",
      "newperson@example.com",
    )!;
    expect(row.google_sub).toBe("google-sub-new");
    expect(Number(row.cash)).toBe(50000);
    expect(Number(row.equity)).toBe(50000);
    expect(row.name).toBe("New Person");
    // Unusable random password hash: never a plain password, never loggable-in.
    expect((row.password as string).startsWith("$2")).toBe(true);
    expect(verifyPassword("password", row.password as string)).toBe(false);
    expect(verifyPassword("newperson", row.password as string)).toBe(false);
  });

  it("links and signs into an existing password account by verified email", () => {
    const existing = queryFirstRow(
      "SELECT * FROM users WHERE email = ?",
      "grish@gmail.com",
    )!;
    const result = resolveGoogleUser({
      sub: "google-sub-grisha",
      email: "grish@gmail.com",
      emailVerified: true,
      name: "Grisha G",
    });
    expect(result).toEqual({ ok: true, userId: existing.id });
    const row = queryFirstRow("SELECT * FROM users WHERE id = ?", existing.id)!;
    // Linking preserves everything else: no balance or data changes.
    expect(row.google_sub).toBe("google-sub-grisha");
    expect(Number(row.cash)).toBe(Number(existing.cash));
    expect(Number(row.equity)).toBe(Number(existing.equity));
    expect(row.name).toBe(existing.name);
    expect(count("users")).toBe(3);
  });

  it("matches emails case-insensitively so no duplicate account is created", () => {
    const existing = queryFirstRow(
      "SELECT * FROM users WHERE email = ?",
      "Forza11879@gmail.com",
    )!;
    const result = resolveGoogleUser({
      sub: "google-sub-forza",
      email: "forza11879@gmail.com",
      emailVerified: true,
      name: "Forza",
    });
    expect(result).toEqual({ ok: true, userId: existing.id });
    expect(count("users")).toBe(3);
    expect(
      queryFirstRow("SELECT * FROM users WHERE id = ?", existing.id)!
        .google_sub,
    ).toBe("google-sub-forza");
  });

  it("signs straight in on subsequent logins via the linked sub", () => {
    const first = resolveGoogleUser({
      sub: "google-sub-repeat",
      email: "grish@gmail.com",
      emailVerified: true,
      name: "Grisha",
    });
    const second = resolveGoogleUser({
      sub: "google-sub-repeat",
      email: "grish@gmail.com",
      emailVerified: true,
      name: "Grisha",
    });
    expect(first).toEqual(second);
    expect(count("users")).toBe(3);
  });

  it("refuses to overwrite a link to a different Google account", () => {
    resolveGoogleUser({
      sub: "google-sub-victim",
      email: "grish@gmail.com",
      emailVerified: true,
      name: "Grisha",
    });
    const result = resolveGoogleUser({
      sub: "google-sub-attacker",
      email: "grish@gmail.com",
      emailVerified: true,
      name: "Attacker",
    });
    expect(result).toEqual({ ok: false, error: "account_conflict" });
    // The original link is untouched.
    expect(
      queryFirstRow("SELECT * FROM users WHERE email = ?", "grish@gmail.com")!
        .google_sub,
    ).toBe("google-sub-victim");
  });

  it("rejects unverified or missing emails without creating accounts", () => {
    expect(
      resolveGoogleUser({
        sub: "google-sub-unverified",
        email: "unverified@example.com",
        emailVerified: false,
        name: "Unverified",
      }),
    ).toEqual({ ok: false, error: "email_not_verified" });
    expect(
      resolveGoogleUser({
        sub: "google-sub-noemail",
        email: "   ",
        emailVerified: true,
        name: "No Email",
      }),
    ).toEqual({ ok: false, error: "email_missing" });
    expect(
      resolveGoogleUser({
        sub: "",
        email: "nosub@example.com",
        emailVerified: true,
        name: "No Sub",
      }),
    ).toEqual({ ok: false, error: "email_missing" });
    expect(count("users")).toBe(3);
  });

  it("falls back to the email local part when Google supplies no name", () => {
    const result = resolveGoogleUser({
      sub: "google-sub-noname",
      email: "noname@example.com",
      emailVerified: true,
      name: "   ",
    });
    expect(result.ok).toBe(true);
    const row = queryFirstRow(
      "SELECT * FROM users WHERE email = ?",
      "noname@example.com",
    )!;
    expect(row.name).toBe("noname");
  });
});
