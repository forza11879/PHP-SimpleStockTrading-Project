import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import crypto from "node:crypto";
import { queryFirstRow } from "@/src/lib/db";
import { buySellAction } from "@/src/lib/actions";
import { clearQuoteCache } from "@/src/lib/quotes";
import { freshDb } from "@/src/test/db";

const SESSION_SECRET =
  process.env.SESSION_SECRET ?? "dev-only-insecure-secret-change-me";

const h = vi.hoisted(() => ({ token: "" }));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === "trade_session" ? { value: h.token } : undefined,
  }),
}));

const liveQuoteFixture = {
  chart: {
    result: [
      {
        meta: {
          symbol: "AAPL",
          longName: "Apple Inc.",
          chartPreviousClose: 153.87,
        },
        timestamp: [1704153600],
        indicators: {
          quote: [
            {
              open: [155.0],
              high: [156.0],
              low: [154.0],
              close: [155.5],
              volume: [1000],
            },
          ],
        },
      },
    ],
  },
};

beforeEach(() => {
  freshDb();
  clearQuoteCache();
  h.token = `${1}.${crypto
    .createHmac("sha256", SESSION_SECRET)
    .update("1")
    .digest("hex")}`;
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: true, json: async () => liveQuoteFixture }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function orderForm(qty: string, type: string): FormData {
  const fd = new FormData();
  fd.set("qty", qty);
  fd.set("type", type);
  return fd;
}

describe("buySellAction delegation to the order engine", () => {
  it("returns the engine's error for an unaffordable buy, without redirecting", async () => {
    const res = await buySellAction(1, {}, orderForm("400", "buy"));
    expect(res.error).toBeDefined();
    const user = queryFirstRow("SELECT * FROM users WHERE id = 1")!;
    expect(user.cash).toBe(49831);
  });

  it("returns the engine's error for a sell above owned shares", async () => {
    const res = await buySellAction(8, {}, orderForm("81", "sell"));
    expect(res.error).toBeDefined();
  });

  it("fills a buy at the live quote, redirects to success, and persists the fill", async () => {
    await expect(buySellAction(1, {}, orderForm("1", "buy"))).rejects.toThrow(
      "REDIRECT:/buysell/success",
    );
    const pos = queryFirstRow(
      "SELECT * FROM portfolios WHERE userId = 1 AND symbol = 'AAPL'",
    )!;
    expect(pos.qty).toBe(1);
    expect(pos.avgprice as number).toBeCloseTo(155.5, 2);
    const user = queryFirstRow("SELECT * FROM users WHERE id = 1")!;
    expect(user.cash as number).toBeCloseTo(49831 - 155.5, 2);
  });
});