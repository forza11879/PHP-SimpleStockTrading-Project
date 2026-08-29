import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchHistory } from "@/src/lib/history";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchHistory", () => {
  it("parses a stubbed Yahoo response into chart candles", async () => {
    const fixture = {
      chart: {
        result: [
          {
            timestamp: [1704067200, 1704153600],
            indicators: {
              quote: [
                {
                  open: [100, 101],
                  high: [102, 103],
                  low: [99, 100],
                  close: [101, 102],
                },
              ],
            },
          },
        ],
      },
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => fixture }),
    );

    const candles = await fetchHistory("AAPL");

    expect(candles).toEqual([
      [1704067200000, 100, 102, 99, 101],
      [1704153600000, 101, 103, 100, 102],
    ]);
  });

  it("returns an empty list when the response is not ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) }),
    );

    const candles = await fetchHistory("AAPL");

    expect(candles).toEqual([]);
  });
});