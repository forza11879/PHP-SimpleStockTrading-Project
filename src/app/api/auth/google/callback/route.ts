import { NextRequest, NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { createSession } from "@/src/lib/session";
import {
  GOOGLE_STATE_COOKIE,
  GOOGLE_VERIFIER_COOKIE,
  getGoogleConfig,
  isValidState,
  loginErrorUrl,
  resolveGoogleUser,
} from "@/src/lib/google-auth";

export const dynamic = "force-dynamic";

function fail(request: NextRequest, code: string): NextResponse {
  const res = NextResponse.redirect(new URL(loginErrorUrl(code), request.url));
  // Flow cookies are single-use: clear them on every outcome.
  res.cookies.set(GOOGLE_STATE_COOKIE, "", { path: "/", maxAge: 0 });
  res.cookies.set(GOOGLE_VERIFIER_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}

/**
 * Google OAuth callback. Exchanges the authorization code for tokens
 * server-side, verifies the ID token (signature, audience, issuer, expiry)
 * with Google's official library, then signs the user into the app's normal
 * session. Only the verified ID token is trusted — never callback params.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  // Google reports cancellations and provider-side failures via `error`.
  const providerError = params.get("error");
  if (providerError) {
    return fail(
      request,
      providerError === "access_denied" ? "access_denied" : "provider_error",
    );
  }

  const code = params.get("code");
  const stateParam = params.get("state");
  const stateCookie = request.cookies.get(GOOGLE_STATE_COOKIE)?.value;
  const verifier = request.cookies.get(GOOGLE_VERIFIER_COOKIE)?.value;

  if (!code) return fail(request, "invalid_callback");
  if (!isValidState(stateParam, stateCookie) || !verifier) {
    return fail(request, "state_mismatch");
  }

  const config = getGoogleConfig();
  if (!config) return fail(request, "not_configured");

  const client = new OAuth2Client({
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    redirectUri: config.redirectUri,
  });

  let idToken: string | undefined;
  try {
    const { tokens } = await client.getToken({
      code,
      codeVerifier: verifier,
    });
    idToken = tokens.id_token ?? undefined;
  } catch {
    return fail(request, "token_exchange_failed");
  }
  if (!idToken) return fail(request, "invalid_token");

  let identity: {
    sub: string;
    email: string;
    emailVerified: boolean;
    name: string;
  };
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: config.clientId,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.sub) return fail(request, "invalid_token");
    identity = {
      sub: payload.sub,
      email: payload.email ?? "",
      emailVerified: payload.email_verified === true,
      name: payload.name ?? "",
    };
  } catch {
    return fail(request, "invalid_token");
  }

  const result = resolveGoogleUser(identity);
  if (!result.ok) return fail(request, result.error);

  try {
    await createSession(result.userId);
  } catch {
    return fail(request, "session_failed");
  }

  const res = NextResponse.redirect(new URL("/dashboard", request.url));
  res.cookies.set(GOOGLE_STATE_COOKIE, "", { path: "/", maxAge: 0 });
  res.cookies.set(GOOGLE_VERIFIER_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
