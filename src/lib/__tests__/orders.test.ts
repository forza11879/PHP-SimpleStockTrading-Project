import { beforeEach, describe, expect, it } from "vitest";
import { count, insert, queryFirstRow } from "@/src/lib/db";
import { executeOrder } from "@/src/lib/orders";
import { freshDb } from "@/src/test/db";

beforeEach(() => freshDb());

const position = (userId: number, symbol: string) =>
  queryFirstRow(
    "SELECT * FROM portfolios WHERE userId = ? AND symbol = ?",
    userId,
    symbol,
  );

const user1 = {
  cash: 49831,
  ebayPrice: 34.9,
  seededEquity: 55574.83,
};

describe("executeOrder validation", () => {
  it("rejects an order for an unknown symbol", () => {
    const res = executeOrder(3, "ZZZZ", 1, "buy", 100);
    expect(res.error).toBeDefined();
  });

  it("rejects a quantity that is not a positive integer", () => {
    expect(executeOrder(3, "AAPL", 0, "buy", 153.5).error).toBeDefined();
    expect(executeOrder(3, "AAPL", -1, "buy", 153.5).error).toBeDefined();
    expect(executeOrder(3, "AAPL", 1.5, "buy", 153.5).error).toBeDefined();
    expect(executeOrder(3, "AAPL", Number.NaN, "buy", 153.5).error).toBeDefined();
  });

  it("rejects a fill at a non-positive price", () => {
    expect(executeOrder(3, "AAPL", 1, "buy", 0).error).toBeDefined();
    expect(executeOrder(3, "AAPL", 1, "sell", -5).error).toBeDefined();
  });

  it("rejects an unknown order type", () => {
    const res = executeOrder(3, "AAPL", 1, "bought" as "buy", 153.5);
    expect(res.error).toBeDefined();
  });

  it("leaves no trace when a buy is rejected for insufficient cash", () => {
    const txBefore = count("transactions");
    const res = executeOrder(3, "AAPL", 400, "buy", 153.5);
    expect(res.error).toBeDefined();
    const user = queryFirstRow("SELECT * FROM users WHERE id = 3")!;
    expect(user.cash).toBe(50000);
    expect(count("transactions")).toBe(txBefore);
  });
});

describe("executeOrder buys", () => {
  it("fills an affordable buy and updates cash, position, transaction, and equity", () => {
    const txBefore = count("transactions");
    const res = executeOrder(3, "AAPL", 10, "buy", 153.61);
    expect(res.error).toBeUndefined();

    const user = queryFirstRow("SELECT * FROM users WHERE id = 3")!;
    // Buying at the current price keeps equity at the $50,000 starting cash
    // (single-price model has no spread).
    expect(user.cash as number).toBeCloseTo(50000 - 10 * 153.61, 2);
    expect(user.equity as number).toBeCloseTo(50000, 2);

    const pos = position(3, "AAPL")!;
    expect(pos.qty).toBe(10);
    expect(pos.avgprice as number).toBeCloseTo(153.61, 2);

    expect(count("transactions")).toBe(txBefore + 1);
    const tx = queryFirstRow("SELECT * FROM transactions WHERE userId = 3")!;
    expect(tx.symbol).toBe("AAPL");
    expect(tx.price as number).toBeCloseTo(153.61, 2);
    expect(tx.qty).toBe(10);
    expect(tx.type).toBe("buy");
  });

  it("averages cost across buys, quantity-weighted", () => {
    expect(executeOrder(3, "AAPL", 10, "buy", 100).error).toBeUndefined();
    expect(executeOrder(3, "AAPL", 10, "buy", 200).error).toBeUndefined();

    const pos = position(3, "AAPL")!;
    expect(pos.qty).toBe(20);
    expect(pos.avgprice as number).toBeCloseTo((10 * 100 + 10 * 200) / 20, 6);

    const user = queryFirstRow("SELECT * FROM users WHERE id = 3")!;
    expect(user.cash as number).toBeCloseTo(50000 - 1000 - 2000, 2);
  });
});

describe("executeOrder sells", () => {
  it("rejects a sell of more shares than owned", () => {
    expect(executeOrder(1, "EBAY", 81, "sell", user1.ebayPrice).error).toBeDefined();
    const pos = position(1, "EBAY")!;
    expect(pos.qty).toBe(80);
  });

  it("rejects a sell when nothing is owned", () => {
    expect(executeOrder(3, "AAPL", 1, "sell", 153.61).error).toBeDefined();
  });

  it("fills a sell, adds cash, decrements quantity, leaves average cost untouched, and refreshes equity", () => {
    const res = executeOrder(1, "EBAY", 30, "sell", user1.ebayPrice);
    expect(res.error).toBeUndefined();

    const user = queryFirstRow("SELECT * FROM users WHERE id = 1")!;
    expect(user.cash as number).toBeCloseTo(49831 + 30 * 34.9, 2);
    // Selling at the current price revalues EBAY at that same price, so
    // total equity is unchanged from the seeded (price-valued) 55574.83.
    expect(user.equity as number).toBeCloseTo(user1.seededEquity, 2);

    const pos = position(1, "EBAY")!;
    expect(pos.qty).toBe(50);
    expect(pos.avgprice as number).toBeCloseTo(33.83, 2);

    const tx = queryFirstRow(
      "SELECT * FROM transactions WHERE userId = 1 AND type = 'sell'",
    )!;
    expect(tx.price as number).toBeCloseTo(34.9, 2);
    expect(tx.qty).toBe(30);
  });

  it("removes a position that is sold down to zero", () => {
    expect(executeOrder(1, "EBAY", 80, "sell", user1.ebayPrice).error).toBeUndefined();
    expect(position(1, "EBAY")).toBeNull();
    const user = queryFirstRow("SELECT * FROM users WHERE id = 1")!;
    expect(user.cash as number).toBeCloseTo(49831 + 80 * 34.9, 2);
  });

  it("only removes the acting user's zeroed position", () => {
    insert("portfolios", { userId: 2, symbol: "TSLA", qty: 0, avgprice: 100 });
    expect(executeOrder(1, "EBAY", 80, "sell", user1.ebayPrice).error).toBeUndefined();

    expect(position(1, "EBAY")).toBeNull();
    expect(position(2, "TSLA")).not.toBeNull();
  });
});