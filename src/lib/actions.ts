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
import { getQuote, refreshQuotes } from "./quotes";
import { refreshEquity, getSymbolById, getSymbols } from "./trading";
import { executeOrder } from "./orders";

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

  insert("users", {
    email,
    name,
    password: hashPassword(pass1),
    cash: 50000,
    equity: 50000,
  });
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

export async function getQuoteAction(formData: FormData): Promise<void> {
  const symbol = (formData.get("symbol") as string)?.trim() ?? "";
  if (!symbol) redirect("/list");
  await refreshQuotes([symbol]);
  redirect("/list");
}

export async function refreshListQuotesAction(): Promise<void> {
  await refreshQuotes(getSymbols().map((s) => s.symbol));
  redirect("/list");
}

export async function historyAction(formData: FormData): Promise<void> {
  const symbol = (formData.get("symbol") as string)?.trim() ?? "";
  if (!symbol) redirect("/history");
  // Original fetched from Google Finance; quote history is now fetched live
  // by the chart client instead of being persisted here.
  redirect("/chart/" + encodeURIComponent(symbol));
}

export interface BuySellState {
  error?: string;
}

export async function buySellAction(
  id: number,
  prevState: BuySellState,
  formData: FormData,
): Promise<BuySellState> {
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

export { refreshEquity };