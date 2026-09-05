import { db, queryFirstRow, insert, update, del } from "./db";
import { refreshEquity } from "./trading";

export type OrderType = "buy" | "sell";

export interface OrderResult {
  error?: string;
}

/** Max share of cash a single buy may spend. The frontend mirrors this for
 * UX via maxBuyQty; the engine below enforces it. */
export const MAX_SPEND_RATIO = 0.95;

/** Server-side maximum buy quantity: floor(cash × 0.95 / price). */
export function maxBuyQty(cash: number, price: number): number {
  if (
    !Number.isFinite(cash) ||
    !Number.isFinite(price) ||
    cash <= 0 ||
    price <= 0
  ) {
    return 0;
  }
  return Math.floor((cash * MAX_SPEND_RATIO) / price);
}

function now(): string {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}

/**
 * Executes a market Order for a user: buys/sells whole shares of a Symbol at
 * the given price, updating Cash, Position, and Equity. Returns an error when
 * the Order is invalid (unknown Symbol, non-positive integer quantity,
 * non-positive price, unknown type, a buy above 95% of Cash, or a sell above
 * owned shares). Every rule is enforced here, server-side, from authoritative
 * data (session user, stored Cash and holdings, server-fetched price) — never
 * from frontend values. All reads and writes run in one transaction so
 * concurrent orders cannot interleave between the balance check and the fill.
 */
export function executeOrder(
  userId: number,
  symbol: string,
  qty: number,
  type: OrderType,
  price: number,
): OrderResult {
  if (!Number.isInteger(qty) || qty <= 0) {
    return { error: "Quantity must be a whole number greater than zero" };
  }
  if (!Number.isFinite(price) || price <= 0) {
    return { error: "No price available for this symbol" };
  }
  if (type !== "buy" && type !== "sell") {
    return { error: "Unknown order type" };
  }

  db.exec("BEGIN IMMEDIATE");
  try {
    const result = fillOrder(userId, symbol, qty, type, price);
    db.exec("COMMIT");
    return result;
  } catch (err) {
    try {
      db.exec("ROLLBACK");
    } catch {
      // Nothing to roll back.
    }
    throw err;
  }
}

function fillOrder(
  userId: number,
  symbol: string,
  qty: number,
  type: OrderType,
  price: number,
): OrderResult {
  const stock = queryFirstRow("SELECT * FROM symbols WHERE symbol = ?", symbol);
  if (!stock) {
    return { error: "Symbol not found" };
  }
  const user = queryFirstRow("SELECT * FROM users WHERE id = ?", userId);
  if (!user) {
    return { error: "User not found" };
  }
  const owned = queryFirstRow(
    "SELECT * FROM portfolios WHERE userId = ? AND symbol = ?",
    userId,
    symbol,
  );

  let newCash: number;
  if (type === "buy") {
    if (qty > maxBuyQty(user.cash as number, price)) {
      return { error: "Insufficient buying power" };
    }
    const total = qty * price;
    newCash = (user.cash as number) - total;
    if (owned) {
      const newQty = qty + (owned.qty as number);
      const newAvg =
        ((owned.qty as number) * (owned.avgprice as number) + total) / newQty;
      update(
        "portfolios",
        { qty: newQty, avgprice: newAvg },
        "userId = ? AND symbol = ?",
        userId,
        symbol,
      );
    } else {
      insert("portfolios", { userId, symbol, avgprice: price, qty });
    }
  } else {
    if (!owned || (owned.qty as number) < qty) {
      return { error: "Not enough shares to sell" };
    }
    newCash = (user.cash as number) + qty * price;
    update(
      "portfolios",
      { qty: (owned.qty as number) - qty },
      "userId = ? AND symbol = ?",
      userId,
      symbol,
    );
  }

  insert("transactions", { userId, symbol, price, qty, type, date: now() });
  update("users", { cash: newCash }, "id = ?", userId);

  refreshEquity(userId);
  del("portfolios", "userId = ? AND qty = 0", userId);

  return {};
}