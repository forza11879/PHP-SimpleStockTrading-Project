import type { ReactNode } from "react";
import { cookies } from "next/headers";
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
  // Sidebar preference cookie (written by the Shell toggle). Read here so
  // the server renders the correct state on first paint — no flash, no
  // hydration mismatch. Must match Shell's cookie name.
  const initialCollapsed =
    (await cookies()).get("sidebar-collapsed")?.value === "1";

  return (
    <Shell
      title={title}
      userName={userName}
      cash={cash}
      equity={equity}
      initialCollapsed={initialCollapsed}
    >
      {children}
    </Shell>
  );
}
