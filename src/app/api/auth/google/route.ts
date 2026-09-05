import { NextRequest, NextResponse } from "next/server";
import {
  GOOGLE_FLOW_TTL_SECONDS,
  GOOGLE_STATE_COOKIE,
  GOOGLE_VERIFIER_COOKIE,
  buildAuthorizationUrl,
  generateCodeVerifier,
  generateState,
  getGoogleConfig,
  codeChallengeS256,
  loginErrorUrl,
  packStateCookie,
  publicBaseUrl,
} from "@/src/lib/google-auth";

export const dynamic = "force-dynamic";

/**
 * Starts the Google sign-in flow: mints a `state` (CSRF) value and a PKCE
 * code verifier, stores both in short-lived httpOnly cookies, and redirects
 * the browser to Google's authorization endpoint. The client secret is never
 * involved here and never reaches the browser.
 */
export async function GET(request: NextRequest) {
  const config = getGoogleConfig();
  if (!config) {
    return NextResponse.redirect(
      new URL(loginErrorUrl("not_configured"), request.url),
    );
  }

  const state = generateState();
  const verifier = generateCodeVerifier();
  const authUrl = buildAuthorizationUrl({
    clientId: config.clientId,
    redirectUri: config.redirectUri,
    state,
    codeChallenge: codeChallengeS256(verifier),
  });

  const secure = publicBaseUrl().startsWith("https://");
  const res = NextResponse.redirect(authUrl);
  const cookieOpts = {
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: GOOGLE_FLOW_TTL_SECONDS,
  };
  res.cookies.set(GOOGLE_STATE_COOKIE, packStateCookie(state), cookieOpts);
  res.cookies.set(GOOGLE_VERIFIER_COOKIE, verifier, cookieOpts);
  return res;
}
