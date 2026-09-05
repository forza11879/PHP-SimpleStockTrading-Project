import { query, queryFirstRow, update, type Row } from "./db";

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