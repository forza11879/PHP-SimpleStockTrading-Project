import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { queryFirstRow } from "@/src/lib/db";
import {
  clearQuoteCache,
  getQuote,
  refreshQuotes,
} from "@/src/lib/quotes";
import { freshDb } from "@/src/test/db";

const v8Fixture = {
  chart: {
    result: [
      {
        meta: {
          symbol: "AAPL",
          longName: "Apple Inc.",
          chartPreviousClose: 153.87,
          fiftyTwoWeekHigh: 156.65,
          fiftyTwoWeekLow: 91.5,
        },
        timestamp: [1704067200, 1704153600],
        indicators: {
          quote: [
            {
              open: [154.0, 155.0],
              high: [154.24, 156.0],
              low: [153.31, 153.0],
              close: [153.61, 155.5],
              volume: [21927637, 22000000],
            },
          ],
        },
      },
    ],
  },
};

function stubYahoo(ok = true): ReturnType<typeof vi.fn> {
  const fn = vi.fn().mockImplementation(async (url: string) => {
    if (!ok) return { ok: false, json: async () => ({}) };
    const symbol = /chart\/([A-Z]+)/.exec(url)?.[1] ?? "AAPL";
    const longName =
      symbol === "AAPL"
        ? v8Fixture.chart.result[0].meta.longName
        : `${symbol} Inc.`;
    return {
      ok: true,
      json: async () => ({
        chart: {
          result: [
            {
              ...v8Fixture.chart.result[0],
              meta: {
                ...v8Fixture.chart.result[0].meta,
                symbol,
                longName,
              },
            },
          ],
        },
      }),
    };
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}

beforeEach(() => {
  freshDb();
  clearQuoteCache();
  vi.useRealTimers();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getQuote", () => {
  it("fetches from the v8 endpoint, parses a Quote, and stores it", async () => {
    const fetchMock = stubYahoo();
    const quote = await getQuote("AAPL");

    expect(quote).toEqual({
      symbol: "AAPL",
      name: "Apple Inc.",
      price: 155.5,
      open: 155.0,
      previousClose: 153.87,
      high: 156.0,
      low: 153.0,
      volume: 22000000,
      high52: 156.65,
      low52: 91.5,
    });

    const url = String(fetchMock.mock.calls[0][0]);
    expect(url).toContain("query1.finance.yahoo.com/v8/finance/chart/AAPL");
    expect(url).not.toContain("d/quotes.csv");

    const row = queryFirstRow("SELECT * FROM symbols WHERE symbol = 'AAPL'")!;
    expect(row.lastTrade).toBe(155.5);
    expect(row.name).toBe("Apple Inc.");
    expect(row.previousClose).toBe(153.87);
  });

  it("serves repeated requests from cache within the freshness window", async () => {
    const fetchMock = stubYahoo();
    vi.useFakeTimers();

    await getQuote("AAPL");
    await getQuote("AAPL");

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("refetches once the freshness window has passed", async () => {
    const fetchMock = stubYahoo();
    vi.useFakeTimers();

    await getQuote("AAPL");
    vi.advanceTimersByTime(60_001);
    await getQuote("AAPL");

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("falls back to the last known price when the fetch fails", async () => {
    stubYahoo(false);
    const quote = await getQuote("AAPL");
    expect(quote?.symbol).toBe("AAPL");
    expect(quote?.price).toBe(153.61); // seeded lastTrade
  });

  it("caches a fallback so a failing source is not re-fetched within the window", async () => {
    const fetchMock = stubYahoo(false);
    vi.useFakeTimers();

    await getQuote("AAPL");
    await getQuote("AAPL");

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("returns null when no price is known and the fetch fails", async () => {
    stubYahoo(false);
    expect(await getQuote("ZZZZ")).toBeNull();
  });
});

describe("refreshQuotes", () => {
  it("fetches and stores a list of symbols", async () => {
    stubYahoo();
    const stored = await refreshQuotes(["AAPL", "TSLA"]);

    expect(stored).toBe(2);
    expect(queryFirstRow("SELECT * FROM symbols WHERE symbol = 'AAPL'")!.lastTrade).toBe(155.5);
    expect(queryFirstRow("SELECT * FROM symbols WHERE symbol = 'TSLA'")!.lastTrade).toBe(155.5);
  });
});