import { db, del, query, queryFirstRow, update, type Row } from "./db";

/** Total value of the user's held stocks (qty * current price). */
export function stockValue(userId: number): number {
  const positions = getPositions(userId);
  return positions.reduce((total, p) => total + p.qty * p.price, 0);
}

/** Recompute and persist the user's equity based on current prices. */
export function refreshEquity(userId: number): number {
  const user = queryFirstRow("SELECT * FROM users WHERE id = ?", userId);
  if (!user) return 0;
  const equity = stockValue(userId) + (user.cash as number);
  update("users", { equity }, "id = ?", userId);
  return equity;
}

export interface SymbolRow extends Row {
  id: number;
  symbol: string;
  name: string;
  open: number;
  previousClose: number;
  price: number;
  high: number;
  low: number;
  volume: number;
  high52: number;
  low52: number;
}

export function getSymbols(): SymbolRow[] {
  return query("SELECT * FROM symbols ORDER BY symbol") as SymbolRow[];
}

export function getSymbolBySymbol(sym: string): SymbolRow | null {
  return queryFirstRow("SELECT * FROM symbols WHERE symbol = ?", sym) as
    | SymbolRow
    | null;
}

export function getSymbolById(id: number): SymbolRow | null {
  return queryFirstRow("SELECT * FROM symbols WHERE id = ?", id) as
    | SymbolRow
    | null;
}

/** The user's watch list: their tracked symbols with current prices. */
export function getWatchlist(userId: number): SymbolRow[] {
  // Spread into plain objects: node:sqlite rows use a null prototype,
  // which cannot be passed to Client Components.
  return (
    query(
      `SELECT s.* FROM symbols s
       JOIN watchlist w ON w.symbol = s.symbol
       WHERE w.userId = ? ORDER BY s.symbol`,
      userId,
    ) as SymbolRow[]
  ).map((row) => ({ ...row }));
}

/** Seeds a user's watch list with every tracked symbol (idempotent). */
export function seedWatchlistForUser(userId: number): void {
  const stmt = db.prepare(
    "INSERT OR IGNORE INTO watchlist (userId, symbol) VALUES (?, ?)",
  );
  for (const row of query("SELECT symbol FROM symbols")) {
    stmt.run(userId, row.symbol as string);
  }
}

/**
 * Removes a symbol from a user's watch list. The delete is scoped to the
 * given user id, so one user can never remove another user's entry — a
 * missing or foreign entry simply reports false. Returns true when an
 * entry was actually removed.
 */
export function removeWatchlistSymbol(
  userId: number,
  symbol: string,
): boolean {
  const key = symbol.trim().toUpperCase();
  if (!key) return false;
  return del("watchlist", "userId = ? AND symbol = ?", userId, key) > 0;
}

/**
 * Normalizes a user-supplied symbol for the watch list (trimmed,
 * uppercased). Returns null when the input is not a plausible ticker —
 * letters, digits, dots, and hyphens (e.g. `BRK.B`, `BF-B`), max 12 chars.
 */
export function normalizeSymbol(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const key = raw.trim().toUpperCase();
  if (!/^[A-Z0-9.\-]{1,12}$/.test(key)) return null;
  return key;
}

export type QuoteRequestValidation =
  | { ok: true; userId: number; key: string }
  | { ok: false; status: "unauthenticated" | "invalid" };

/**
 * Pure validation seam for the Get Quote flow, kept network-free for tests.
 * The user id always comes from the server-side session (null when logged
 * out) — never from the frontend.
 */
export function validateQuoteRequest(
  userId: number | null,
  raw: unknown,
): QuoteRequestValidation {
  if (userId === null || userId === undefined) {
    return { ok: false, status: "unauthenticated" };
  }
  const key = normalizeSymbol(raw);
  if (!key) return { ok: false, status: "invalid" };
  return { ok: true, userId, key };
}

export type AddWatchlistOutcome = "added" | "exists" | "invalid";

/**
 * Links an already-validated symbol to a user's watch list. The symbol must
 * exist in the `symbols` table — i.e. a quote lookup must have succeeded and
 * stored it first — otherwise nothing is created. Idempotent per user via
 * `INSERT OR IGNORE` on top of the `UNIQUE(userId, symbol)` constraint, and
 * scoped to the given (session) user id throughout.
 */
export function addWatchlistSymbol(
  userId: number,
  raw: unknown,
): AddWatchlistOutcome {
  const key = normalizeSymbol(raw);
  if (!key) return "invalid";
  if (!getSymbolBySymbol(key)) return "invalid";
  // Guard the foreign key explicitly: INSERT OR IGNORE does not suppress
  // FK violations in SQLite, and the function must never throw on bad input.
  if (!queryFirstRow("SELECT id FROM users WHERE id = ?", userId)) {
    return "invalid";
  }
  const inserted = db
    .prepare("INSERT OR IGNORE INTO watchlist (userId, symbol) VALUES (?, ?)")
    .run(userId, key).changes;
  if (Number(inserted) > 0) return "added";
  // No row written: either the entry already exists (duplicate request) or
  // the insert was refused (e.g. unknown user tripping the foreign key).
  return queryFirstRow(
    "SELECT id FROM watchlist WHERE userId = ? AND symbol = ?",
    userId,
    key,
  )
    ? "exists"
    : "invalid";
}

export interface PositionRow extends Row {
  id: number;
  symbol: string;
  avgprice: number;
  price: number;
  previousClose: number;
  qty: number;
}

/** A user's holdings with the current price attached, for display and valuation. */
export function getPositions(userId: number): PositionRow[] {
  return query(
    `SELECT s.id, s.symbol, p.avgprice, s.price, s.previousClose, p.qty
     FROM portfolios p, symbols s
     WHERE p.symbol = s.symbol AND p.userId = ?`,
    userId,
  ) as PositionRow[];
}

/** Today's profit/loss: sum of qty × (price − previousClose) over positions. */
export function dailyPL(userId: number): number {
  const positions = getPositions(userId);
  return positions.reduce(
    (total, p) => total + p.qty * (p.price - p.previousClose),
    0,
  );
}