"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { formatPrice } from "@/src/lib/money";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "fa fa-fw fa-dashboard" },
  { href: "/portfolio", label: "Portfolio", icon: "fa fa-fw fa-briefcase" },
  { href: "/list", label: "Watch List", icon: "fa fa-fw fa-binoculars" },
  { href: "/orders", label: "Orders", icon: "fa fa-fw fa-table" },
];

interface ShellProps {
  title: string;
  userName: string | null;
  cash: number;
  equity: number;
  children: ReactNode;
}

function isActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function navLinkClass(active: boolean): string {
  return active
    ? "bg-canvas font-semibold text-ink"
    : "text-muted hover:bg-canvas hover:text-ink";
}

export default function Shell({
  title,
  userName,
  cash,
  equity,
  children,
}: ShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const gain = equity - 50000;
  const gainClass = gain >= 0 ? "text-green-600" : "text-red-600";

  return (
    <div className="min-h-screen bg-canvas font-sans text-sm text-ink">
      <div className="flex min-h-screen">
        <aside
          className={`hidden border-r border-line bg-surface lg:flex lg:flex-col ${
            collapsed ? "lg:w-16" : "lg:w-60"
          }`}
        >
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            {!collapsed && (
              <span className="text-sm font-semibold tracking-tight">
                Trading Simulator
              </span>
            )}
            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="rounded border border-line px-2 py-1 text-xs text-muted hover:text-ink"
            >
              {collapsed ? "»" : "«"}
            </button>
          </div>
          <nav className="flex-1 px-2 py-3">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                title={item.label}
                className={`mb-1 flex items-center gap-3 rounded px-3 py-2 ${navLinkClass(isActive(pathname, item.href))} ${
                  collapsed ? "justify-center px-0" : ""
                }`}
              >
                <i className={item.icon} aria-hidden="true"></i>
                {!collapsed && <span>{item.label}</span>}
              </a>
            ))}
          </nav>
          {!collapsed && (
            <div className="border-t border-line px-4 py-3 tabular-nums">
              <div className="flex justify-between py-0.5">
                <span className="text-muted">Cash</span>
                <span>${formatPrice(cash)}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-muted">Equity</span>
                <span>${formatPrice(equity)}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-muted">Gain/Loss</span>
                <span className={gainClass}>${formatPrice(gain)}</span>
              </div>
            </div>
          )}
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="border-b border-line bg-surface">
            <div className="flex items-center gap-3 px-4 py-2.5">
              <h1 className="text-base font-semibold tracking-tight">{title}</h1>
              <span className="rounded border border-line px-2 py-0.5 text-xs text-muted">
                Delayed ~15 min
              </span>
              <span className="flex-1"></span>
              <a
                href="/list"
                className="rounded bg-accent px-3 py-1.5 text-sm font-semibold text-accent-ink"
              >
                Trade
              </a>
              {userName ? (
                <>
                  <span className="hidden text-muted sm:inline">{userName}</span>
                  <a href="/logout" className="text-muted hover:text-ink">
                    Log Out
                  </a>
                </>
              ) : (
                <a href="/login" className="text-muted hover:text-ink">
                  Log In
                </a>
              )}
            </div>
            <nav className="flex gap-1 overflow-x-auto border-t border-line px-3 py-1.5 lg:hidden">
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className={`whitespace-nowrap rounded px-3 py-1.5 ${navLinkClass(isActive(pathname, item.href))}`}
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </header>
          <main className="flex-1 p-3 lg:p-5">
            <div className="border border-line bg-surface">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
