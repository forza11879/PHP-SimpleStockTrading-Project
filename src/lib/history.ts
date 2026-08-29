/**
 * Fetches historical OHLC data for a symbol and returns it in the shape the
 * candlestick chart expects: an array of [timestampMs, open, high, low, close].
 *
 * The original PHP app pulled CSV from Google Finance; that endpoint no longer
 * exists, so this uses a Yahoo Finance JSON chart endpoint instead.
 */
export async function fetchHistory(symbol: string): Promise<Array<[number, number, number, number, number]>> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1y`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const json = (await res.json()) as {
      chart?: {
        result?: Array<{
          timestamp?: number[];
          indicators?: {
            quote?: Array<{
              open?: (number | null)[];
              high?: (number | null)[];
              low?: (number | null)[];
              close?: (number | null)[];
            }>;
          };
        }>;
      };
    };
    const result = json.chart?.result?.[0];
    const ts = result?.timestamp ?? [];
    const q = result?.indicators?.quote?.[0];
    if (!q) return [];
    const out: Array<[number, number, number, number, number]> = [];
    for (let i = 0; i < ts.length; i++) {
      const open = q.open?.[i];
      const high = q.high?.[i];
      const low = q.low?.[i];
      const close = q.close?.[i];
      if (open === null || open === undefined || high === null || high === undefined ||
          low === null || low === undefined || close === null || close === undefined) {
        continue;
      }
      out.push([ts[i] * 1000, open, high, low, close]);
    }
    return out;
  } catch {
    return [];
  }
}