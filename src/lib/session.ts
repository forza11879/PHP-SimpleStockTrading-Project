import { cookies } from "next/headers";
import crypto from "node:crypto";
import { queryFirstRow, type Row } from "./db";

const COOKIE_NAME = "trade_session";
const SECRET =
  process.env.SESSION_SECRET ?? "dev-only-insecure-secret-change-me";

export interface SessionUser {
  id: number;
  email: string;
  name: string;
  cash: number;
  equity: number | null;
}

function sign(value: string): string {
  return crypto.createHmac("sha256", SECRET).update(value).digest("hex");
}

function unsign(token: string): number | null {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = sign(payload);
  const a = Buffer.from(expected);
  const b = Buffer.from(sig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return Number(payload);
}

/** Creates the login cookie for a user id. */
export async function createSession(userId: number): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, `${userId}.${sign(String(userId))}`, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

/** Returns the currently logged-in user (without password) or null. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const userId = unsign(token);
  if (userId === null) return null;
  const user = queryFirstRow("SELECT * FROM users WHERE id = ?", userId);
  if (!user) return null;
  return {
    id: user.id as number,
    email: user.email as string,
    name: user.name as string,
    cash: Number(user.cash),
    equity: user.equity === null ? null : Number(user.equity),
  };
}

/** Convenience: current user with password column stripped, or null. */
export async function currentUser(): Promise<Row | null> {
  const session = await getSessionUser();
  if (!session) return null;
  const user = queryFirstRow("SELECT * FROM users WHERE id = ?", session.id);
  return user ?? null;
}

export function requireUser(user: Row | null): user is Row {
  return !!user;
}