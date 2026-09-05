import type { ReactNode } from "react";
import { getSessionUser, type SessionUser } from "@/src/lib/session";
import { refreshEquity } from "@/src/lib/trading";
import { queryFirstRow } from "@/src/lib/db";
import Shell from "./Shell";

interface MasterLayoutProps {
  title?: string;
  user?: SessionUser | null;
  children: ReactNode;
}

export default async function MasterLayout({
  title = "Trading Simulator",
  user,
  children,
}: MasterLayoutProps) {
  const sessionUser = (await getSessionUser()) ?? user ?? null;
  // Read the account fresh so the shell never shows a stale login-time
  // snapshot alongside freshly computed values on the pages.
  const account = sessionUser
    ? queryFirstRow(
        "SELECT cash, equity, name FROM users WHERE id = ?",
        sessionUser.id,
      )
    : null;
  if (sessionUser && account) refreshEquity(sessionUser.id);
  const cash = account ? Number(account.cash ?? 0) : 0;
  const equity = account ? Number(account.equity ?? 0) : 0;
  const userName = sessionUser
    ? ((account?.name as string | undefined) ?? sessionUser.name)
    : null;

  return (
    <Shell title={title} userName={userName} cash={cash} equity={equity}>
      {children}
    </Shell>
  );
}
