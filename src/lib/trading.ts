import { query, queryFirstRow, update, type Row } from "./db";

/** Total value of the user's held stocks (qty * current price). */
export function stockValue(userId: number): number {
  const rows = query(
    `SELECT s.symbol, p.qty, s.price
     FROM portfolios p, symbols s
     WHERE p.symbol = s.symbol AND p.userId = ?`,
    userId,
  );
  return rows.reduce((total, r) => total + (r.qty as number) * (r.price as number), 0);
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