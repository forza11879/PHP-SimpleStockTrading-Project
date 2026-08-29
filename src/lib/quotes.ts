import { upsert, type Row } from "./db";
import { getSymbolBySymbol, type SymbolRow } from "./trading";

export interface Quote {
  symbol: string;
  name: string;
  price: number;
  open: number;
  previousClose: number;
  high: number;
  low: number;
  volume: number;
  high52: number;
  low52: number;
}

/** How long a Quote (fetched or last-known) is served before the network is hit again. */
const QUOTE_FRESHNESS_MS = 60_000;

interface CachedQuote {
  quote: Quote;
  at: number;
}

const cache = new Map<string, CachedQuote>();

export function clearQuoteCache(): void {
  cache.clear();
}

/**
 * Fetches a live Quote from the keyless Yahoo Finance v8 chart endpoint
 * (the legacy CSV feed died in 2017). Returns null when the response is not
 * usable.
 */
export async function fetchQuote(symbol: string): Promise<Quote | null> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=5d`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      chart?: {
        result?: Array<{
          meta?: {
            symbol?: string;
            longName?: string;
            chartPreviousClose?: number;
            fiftyTwoWeekHigh?: number;
            fiftyTwoWeekLow?: number;
          };
          timestamp?: number[];
          indicators?: {
            quote?: Array<{
              open?: (number | null)[];
              high?: (number | null)[];
              low?: (number | null)[];
              close?: (number | null)[];
              volume?: (number | null)[];
            }>;
          };
        }>;
      };
    };
    const result = json.chart?.result?.[0];
    if (!result) return null;
    const meta = result.meta;
    const q = result.indicators?.quote?.[0];
    const timestamps = result.timestamp ?? [];

    let price = 0;
    let open = 0;
    let high = 0;
    let low = 0;
    let volume = 0;
    for (let i = timestamps.length - 1; i >= 0; i--) {
      const close = q?.close?.[i];
      if (close !== null && close !== undefined && close > 0) {
        price = Number(close);
        open = Number(q?.open?.[i]) || 0;
        high = Number(q?.high?.[i]) || 0;
        low = Number(q?.low?.[i]) || 0;
        volume = Number(q?.volume?.[i]) || 0;
        break;
      }
    }

    if (price <= 0) return null;
    return {
      symbol: meta?.symbol ?? symbol.toUpperCase(),
      name: meta?.longName ?? symbol.toUpperCase(),
      price,
      open,
      previousClose: Number(meta?.chartPreviousClose) || 0,
      high,
      low,
      volume,
      high52: Number(meta?.fiftyTwoWeekHigh) || 0,
      low52: Number(meta?.fiftyTwoWeekLow) || 0,
    };
  } catch {
    return null;
  }
}

function quoteFromRow(row: SymbolRow): Quote {
  return {
    symbol: row.symbol,
    name: row.name,
    price: row.price,
    open: row.open,
    previousClose: row.previousClose,
    high: row.high,
    low: row.low,
    volume: row.volume,
    high52: row.high52,
    low52: row.low52,
  };
}

function storeQuote(quote: Quote): void {
  upsert(
    "symbols",
    {
      symbol: quote.symbol,
      name: quote.name,
      open: quote.open,
      previousClose: quote.previousClose,
      price: quote.price,
      high: quote.high,
      low: quote.low,
      volume: quote.volume,
      high52: quote.high52,
      low52: quote.low52,
    } as unknown as Row,
    ["symbol"],
  );
}

/**
 * Returns the current Quote for a symbol: from cache while fresh, else a live
 * fetch (stored on success), else the last known price, else null. A fallback
 * is cached too, so a failing or rate-limited source is not re-hit within the
 * freshness window.
 */
export async function getQuote(symbol: string): Promise<Quote | null> {
  const key = symbol.toUpperCase();
  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < QUOTE_FRESHNESS_MS) {
    return cached.quote;
  }

  const fresh = await fetchQuote(key);
  if (fresh) {
    cache.set(key, { quote: fresh, at: Date.now() });
    storeQuote(fresh);
    return fresh;
  }

  const known = getSymbolBySymbol(key);
  if (known && known.price > 0) {
    const quote = quoteFromRow(known);
    cache.set(key, { quote, at: Date.now() });
    return quote;
  }
  return null;
}

/** Fetches and stores a Quote for each symbol, returning how many were stored. */
export async function refreshQuotes(symbols: string[]): Promise<number> {
  const results = await Promise.all(symbols.map((symbol) => getQuote(symbol)));
  return results.filter((quote) => quote !== null).length;
}