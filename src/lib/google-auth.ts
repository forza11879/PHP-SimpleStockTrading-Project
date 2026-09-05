import crypto from "node:crypto";
import { insert, queryFirstRow, update } from "./db";
import { hashPassword } from "./password";
import { seedWatchlistForUser } from "./trading";

/**
 * Google social login (OAuth 2.0 / OpenID Connect) helpers.
 *
 * The app's own authentication is unchanged: a successful Google sign-in
 * always ends in the same HMAC-signed `trade_session` cookie created by
 * `createSession()` in `./session`. This module only handles the Google
 * OAuth mechanics (PKCE, `state`, authorization URL) plus the
 * find-or-link-or-create account logic against the existing `users` table.
 *
 * Security notes:
 * - The ID token is verified server-side with Google's official
 *   `google-auth-library` (`OAuth2Client.verifyIdToken`), which checks the
 *   token signature (Google certs), `aud` (our client ID), `iss`, and `exp`.
 * - Nothing supplied by the browser (query params, frontend-provided user
 *   IDs) is ever trusted as proof of identity — only the verified ID token.
 * - The client secret never leaves the server (authorization-code exchange
 *   happens in the callback route handler).
 */

export const GOOGLE_AUTHORIZATION_ENDPOINT =
  "https://accounts.google.com/o/oauth2/v2/auth";
export const GOOGLE_SCOPES = "openid email profile";
export const GOOGLE_CALLBACK_PATH = "/api/auth/google/callback";
export const GOOGLE_START_PATH = "/api/auth/google";

export const GOOGLE_STATE_COOKIE = "g_oauth_state";
export const GOOGLE_VERIFIER_COOKIE = "g_pkce_verifier";
/** How long a login attempt stays valid (seconds). */
export const GOOGLE_FLOW_TTL_SECONDS = 10 * 60;

function sessionSecret(): string {
  return process.env.SESSION_SECRET ?? "dev-only-insecure-secret-change-me";
}

export interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export function getGoogleConfig(): GoogleOAuthConfig | null {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim() ?? "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim() ?? "";
  if (!clientId || !clientSecret) return null;
  const override = process.env.GOOGLE_REDIRECT_URI?.trim() ?? "";
  return {
    clientId,
    clientSecret,
    redirectUri: override || `${publicBaseUrl()}${GOOGLE_CALLBACK_PATH}`,
  };
}

export function isGoogleConfigured(): boolean {
  return getGoogleConfig() !== null;
}

/**
 * Public base URL of this app. `HOST` is documented (see `.env.example`) as
 * a full URL such as `http://localhost:3000`; tolerate a bare `host:port`
 * value by assuming `http://`.
 */
export function publicBaseUrl(): string {
  const raw = (process.env.HOST ?? "localhost:3000").trim().replace(/\/+$/, "");
  if (/^https?:\/\//i.test(raw)) return raw;
  return `http://${raw}`;
}

// ---------------------------------------------------------------------------
// PKCE (RFC 7636, S256) for the authorization-code flow.
// ---------------------------------------------------------------------------

/** A high-entropy code verifier (43–128 chars from the unreserved set). */
export function generateCodeVerifier(): string {
  return base64UrlEncode(crypto.randomBytes(64));
}

/** `BASE64URL-ENCODE(SHA256(verifier))`. */
export function codeChallengeS256(verifier: string): string {
  return base64UrlEncode(crypto.createHash("sha256").update(verifier).digest());
}

function base64UrlEncode(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// ---------------------------------------------------------------------------
// `state` (CSRF protection). The random value is stored in a short-lived
// httpOnly cookie, HMAC-signed with the session secret, and compared against
// the `state` query parameter on callback.
// ---------------------------------------------------------------------------

export function generateState(): string {
  return base64UrlEncode(crypto.randomBytes(32));
}

function signState(state: string): string {
  return crypto
    .createHmac("sha256", sessionSecret())
    .update(state)
    .digest("hex");
}

/** Packs a fresh `state` for the cookie: `<state>.<signature>`. */
export function packStateCookie(state: string): string {
  return `${state}.${signState(state)}`;
}

/**
 * Validates the callback: the cookie must carry a correctly signed `state`
 * and it must equal the `state` query parameter (constant-time comparison).
 */
export function isValidState(
  stateParam: string | null,
  stateCookie: string | undefined,
): boolean {
  if (!stateParam || !stateCookie) return false;
  const dot = stateCookie.lastIndexOf(".");
  if (dot <= 0) return false;
  const state = stateCookie.slice(0, dot);
  const sig = stateCookie.slice(dot + 1);
  const expected = signState(state);
  const a = Buffer.from(expected);
  const b = Buffer.from(sig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  const c = Buffer.from(state);
  const d = Buffer.from(stateParam);
  return c.length === d.length && crypto.timingSafeEqual(c, d);
}

// ---------------------------------------------------------------------------
// Authorization URL.
// ---------------------------------------------------------------------------

export function buildAuthorizationUrl(args: {
  clientId: string;
  redirectUri: string;
  state: string;
  codeChallenge: string;
}): string {
  const params = new URLSearchParams({
    client_id: args.clientId,
    redirect_uri: args.redirectUri,
    response_type: "code",
    scope: GOOGLE_SCOPES,
    state: args.state,
    code_challenge: args.codeChallenge,
    code_challenge_method: "S256",
    access_type: "online",
    prompt: "select_account",
  });
  return `${GOOGLE_AUTHORIZATION_ENDPOINT}?${params.toString()}`;
}

// ---------------------------------------------------------------------------
// User-friendly error handling. The login page shows these messages; internal
// details are never exposed to the browser.
// ---------------------------------------------------------------------------

export const GOOGLE_LOGIN_ERRORS: Record<string, string> = {
  access_denied: "Google sign-in was cancelled. Try again when you're ready.",
  invalid_callback:
    "Google sign-in didn't complete correctly. Please try again.",
  state_mismatch:
    "Google sign-in didn't complete correctly. Please try again.",
  token_exchange_failed:
    "Couldn't reach Google to finish signing you in. Please try again.",
  invalid_token:
    "Couldn't verify your Google sign-in. Please try again.",
  email_missing:
    "Your Google account didn't share an email address, so we couldn't sign you in.",
  email_not_verified:
    "Your Google email address isn't verified. Verify it with Google, then try again.",
  account_conflict:
    "This Google account is already linked to a different sign-in. Log in with your password instead.",
  session_failed: "Couldn't start your session. Please try again.",
  not_configured: "Google sign-in isn't available right now.",
  provider_error: "Google sign-in failed. Please try again.",
};

export const GOOGLE_LOGIN_GENERIC_ERROR =
  "Google sign-in failed. Please try again.";

export function googleErrorMessage(code: string | null): string {
  if (!code) return GOOGLE_LOGIN_GENERIC_ERROR;
  return GOOGLE_LOGIN_ERRORS[code] ?? GOOGLE_LOGIN_GENERIC_ERROR;
}

export function loginErrorUrl(code: string): string {
  return `/login?error=${encodeURIComponent(code)}`;
}

// ---------------------------------------------------------------------------
// Account linking against the existing `users` table.
// ---------------------------------------------------------------------------

export interface VerifiedGoogleIdentity {
  /** Stable Google user ID (`sub` claim of the verified ID token). */
  sub: string;
  email: string;
  emailVerified: boolean;
  /** Display name from Google; may be empty. */
  name: string;
}

export type GoogleLinkResult =
  | { ok: true; userId: number }
  | { ok: false; error: string };

/**
 * Finds the local account for a verified Google identity, linking or
 * creating it as needed. Mirrors the registration defaults (virtual-cash
 * grant) for new accounts.
 *
 * Rules:
 * 1. The identity must carry a usable, Google-verified email address.
 * 2. A row already linked to this `sub` signs straight in.
 * 3. Otherwise, an existing row with the same (case-insensitive) verified
 *    email is linked to this `sub` and signed in — safe because Google has
 *    verified ownership of that address.
 * 4. Otherwise a new user row is created (with an unusable random password
 *    hash so the account can never be password-logged-into) and signed in.
 * 5. An existing row whose email matches but whose `google_sub` belongs to
 *    a *different* Google account is never overwritten or taken over — the
 *    attempt fails with `account_conflict`.
 */
export function resolveGoogleUser(
  identity: VerifiedGoogleIdentity,
): GoogleLinkResult {
  const email = identity.email.trim();
  if (!identity.sub || !email) return { ok: false, error: "email_missing" };
  if (!identity.emailVerified)
    return { ok: false, error: "email_not_verified" };

  const bySub = queryFirstRow("SELECT * FROM users WHERE google_sub = ?", identity.sub);
  if (bySub) return { ok: true, userId: bySub.id as number };

  const byEmail = queryFirstRow(
    "SELECT * FROM users WHERE LOWER(email) = LOWER(?)",
    email,
  );
  if (byEmail) {
    const linkedSub = byEmail.google_sub as string | null;
    if (linkedSub && linkedSub !== identity.sub) {
      return { ok: false, error: "account_conflict" };
    }
    if (!linkedSub) {
      update("users", { google_sub: identity.sub }, "id = ?", byEmail.id);
    }
    return { ok: true, userId: byEmail.id as number };
  }

  const name = identity.name.trim() || email.split("@")[0]!;
  const unusablePassword = hashPassword(`!${base64UrlEncode(crypto.randomBytes(32))}`);
  const userId = insert("users", {
    email,
    name,
    password: unusablePassword,
    cash: 50000,
    equity: 50000,
    google_sub: identity.sub,
  });
  seedWatchlistForUser(userId);
  return { ok: true, userId };
}
