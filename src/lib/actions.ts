"use server";

import { redirect } from "next/navigation";
import { queryFirstRow, insert, update, del, upsert } from "./db";
import {
  createSession,
  destroySession,
  getSessionUser,
} from "./session";
import { hashPassword, verifyPassword, isValidPassword, generateRandomString } from "./password";
import { sendMail } from "./mail";
import { getQuote } from "./quotes";
import { addWatchlistSymbol, getSymbolById, removeWatchlistSymbol, seedWatchlistForUser, validateQuoteRequest } from "./trading";
import { executeOrder, type OrderResult } from "./orders";

export interface FormState {
  errors?: string[];
  values?: Record<string, string>;
}

export async function registerAction(
  prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = (formData.get("email") as string)?.trim() ?? "";
  const name = (formData.get("name") as string) ?? "";
  const pass1 = (formData.get("pass1") as string) ?? "";
  const pass2 = (formData.get("pass2") as string) ?? "";
  const values = { email, name, pass1, pass2 };
  const errorList: string[] = [];

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errorList.push("Email is invlad");
  } else {
    const user = queryFirstRow("SELECT * FROM users WHERE email = ?", email);
    if (user) errorList.push("Email address already in use");
  }

  if (pass1 !== pass2) {
    errorList.push("Password do not match");
  } else {
    const pwCheck = isValidPassword(pass1);
    if (pwCheck !== true) errorList.push(pwCheck);
  }

  if (errorList.length > 0) {
    return { errors: errorList, values };
  }

  const userId = insert("users", {
    email,
    name,
    password: hashPassword(pass1),
    cash: 50000,
    equity: 50000,
  });
  seedWatchlistForUser(userId);
  redirect("/register/success");
}

export async function loginAction(
  prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = (formData.get("email") as string)?.trim() ?? "";
  const pass = (formData.get("password") as string) ?? "";

  let error = true;
  const user = queryFirstRow("SELECT * FROM users WHERE email = ?", email);
  if (user) {
    if (verifyPassword(pass, user.password as string)) {
      error = false;
    }
  }

  if (error) {
    return { errors: ["Login failed try again."] };
  }

  await createSession(user!.id as number);
  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/logout/success");
}

export interface QuoteState {
  status:
    | "idle"
    | "added"
    | "exists"
    | "invalid"
    | "fetch-failed"
    | "unauthenticated";
  symbol: string | null;
  message: string | null;
}

/**
 * Get Quote → Watchlist flow. Validates/normalizes the symbol, fetches the
 * quote (which stores it in `symbols` on success), and only then links it
 * to the session user's watch list. Returns a status for inline display —
 * no redirect, so the page updates without a reload.
 */
export async function requestQuoteAction(
  prevState: QuoteState,
  formData: FormData,
): Promise<QuoteState> {
  const session = await getSessionUser();
  const validated = validateQuoteRequest(
    session ? session.id : null,
    formData.get("symbol"),
  );
  if (!validated.ok) {
    return validated.status === "unauthenticated"
      ? {
          status: "unauthenticated",
          symbol: null,
          message: "You need to log in to edit your watch list.",
        }
      : {
          status: "invalid",
          symbol: null,
          message: "Enter a valid stock symbol, for example AAPL.",
        };
  }

  const quote = await getQuote(validated.key);
  if (!quote) {
    return {
      status: "fetch-failed",
      symbol: validated.key,
      message: `Couldn't find a quote for ${validated.key}. Check the symbol and try again.`,
    };
  }

  const outcome = addWatchlistSymbol(validated.userId, validated.key);
  if (outcome === "exists") {
    return {
      status: "exists",
      symbol: validated.key,
      message: `${validated.key} is already in your watch list.`,
    };
  }
  if (outcome === "invalid") {
    return {
      status: "invalid",
      symbol: validated.key,
      message: `Couldn't add ${validated.key} to your watch list. Please try again.`,
    };
  }
  return {
    status: "added",
    symbol: validated.key,
    message: `Added ${validated.key} to your watch list.`,
  };
}

export interface WatchlistResult {
  ok: boolean;
  error?: string;
}

/**
 * Removes a symbol from the calling user's watch list. Ownership comes
 * solely from the session — the frontend supplies only the symbol, never a
 * user id, and the delete is scoped to the session user id.
 */
export async function removeWatchlistAction(
  symbol: string,
): Promise<WatchlistResult> {
  const session = await getSessionUser();
  if (!session) {
    return { ok: false, error: "You need to log in to edit your watch list." };
  }
  const removed = removeWatchlistSymbol(session.id, symbol);
  if (!removed) {
    return {
      ok: false,
      error: "Couldn't remove this symbol. Please try again.",
    };
  }
  return { ok: true };
}

export async function buySellAction(
  id: number,
  prevState: OrderResult,
  formData: FormData,
): Promise<OrderResult> {
  const session = await getSessionUser();
  if (!session) redirect("/login");

  const qty = Number(formData.get("qty"));
  const type = formData.get("type") as "buy" | "sell";

  const stock = getSymbolById(id);
  if (!stock) return { error: "Symbol not found" };

  const quote = await getQuote(stock.symbol);
  if (!quote) return { error: "No price available for this symbol" };

  const result = executeOrder(session.id, stock.symbol, qty, type, quote.price);
  if (result.error) return { error: result.error };

  redirect("/buysell/success");
}

export interface PassResetState {
  errors?: string[];
}

export async function passResetRequestAction(
  prevState: PassResetState,
  formData: FormData,
): Promise<PassResetState> {
  const email = (formData.get("email") as string)?.trim() ?? "";
  const user = queryFirstRow("SELECT * FROM users WHERE email = ?", email);
  if (!user) {
    return { errors: ["We couldn't find email you provided in our system."] };
  }
  const secretToken = generateRandomString(50);
  const expiryDateTime = new Date(Date.now() + 5 * 60 * 1000)
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");
  upsert(
    "passresets",
    { userID: user.id as number, secretToken, expiryDateTime },
    ["userID"],
  );

  const url = `http://${process.env.HOST ?? "localhost:3000"}/passreset/${secretToken}`;
  const html = `<html><body><h1>Password reset request</h1>
    <p>Hi ${user.name as string},</p><br>
    <p>You have requested a password reset.</p>
    <p>Click on <a href="${url}">this link</a> to reset your password
       or paste the following URL into a web browser.</p>
    <p>${url}</p></body></html>`;

  await sendMail({
    to: email,
    toName: user.name as string,
    subject: "Password reset from Trading Simulator",
    html,
  });

  redirect("/passreset/success");
}

export async function passResetFormAction(
  token: string,
  prevState: PassResetState,
  formData: FormData,
): Promise<PassResetState> {
  const row = queryFirstRow(
    "SELECT * FROM passresets WHERE secretToken = ?",
    token,
  );
  if (!row) redirect("/passreset/notfound");
  if (new Date(row.expiryDateTime as string).getTime() < Date.now()) {
    redirect("/passreset/notfound");
  }

  const pass1 = (formData.get("pass1") as string) ?? "";
  const pass2 = (formData.get("pass2") as string) ?? "";
  const errors: string[] = [];
  const pwCheck = isValidPassword(pass1);
  if (pwCheck !== true) errors.push(pwCheck);
  else if (pass1 !== pass2) errors.push("Passwords don't match");

  if (errors.length > 0) return { errors };

  update("users", { password: hashPassword(pass1) }, "id = ?", row.userID);
  del("passresets", "secretToken = ?", token);
  redirect("/passreset/form-success");
}

export async function dailySchedulerAction(): Promise<void> {
  del("passresets", "expiryDateTime < datetime('now')");
  redirect("/");
}