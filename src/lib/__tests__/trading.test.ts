import { beforeEach, describe, expect, it } from "vitest";
import { insert } from "@/src/lib/db";
import { dailyPL } from "@/src/lib/trading";
import { freshDb } from "@/src/test/db";

beforeEach(() => freshDb());

describe("dailyPL", () => {
  it("sums qty × (price − previousClose) over a user's positions", () => {
    // Seeded user 1: FAS 5×(44.70−44.86) + F 12×(10.93−10.86)
    // + EBAY 80×(34.90−35.22) + TSLA 5×(325.14−316.83)
    // + GOOG 1×(971.47−969.54) = 17.92
    expect(dailyPL(1)).toBeCloseTo(17.92, 2);
  });

  it("is zero for a user with no positions", () => {
    expect(dailyPL(3)).toBe(0);
  });

  it("follows the current price, not the average cost", () => {
    insert("portfolios", { userId: 3, symbol: "AAPL", qty: 10, avgprice: 1 });
    // AAPL seeded price 153.61, previousClose 153.87
    expect(dailyPL(3)).toBeCloseTo(10 * (153.61 - 153.87), 2);
  });
});
