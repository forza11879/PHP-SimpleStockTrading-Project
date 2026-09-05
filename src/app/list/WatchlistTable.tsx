"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { removeWatchlistAction } from "@/src/lib/actions";
import { formatPrice } from "@/src/lib/money";
import type { SymbolRow } from "@/src/lib/trading";

const GENERIC_ERROR = "Couldn't remove this symbol. Please try again.";

export default function WatchlistTable({
  initial,
}: {
  initial: SymbolRow[];
}) {
  const router = useRouter();
  const [symbols, setSymbols] = useState(initial);
  const [pendingSymbol, setPendingSymbol] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Re-sync with the server list (e.g. after Get Quote adds a symbol)
  // whenever fresh props arrive. Keyed on `initial` only: syncing on the
  // pending flag too would briefly restore a just-removed row with stale
  // props before the post-removal refresh lands.
  useEffect(() => {
    setSymbols(initial);
  }, [initial]);

  async function remove(symbol: string) {
    if (pendingSymbol) return;
    const snapshot = symbols;
    setError(null);
    setPendingSymbol(symbol);
    // Optimistic removal: the row disappears immediately.
    setSymbols((rows) => rows.filter((row) => row.symbol !== symbol));
    try {
      const result = await removeWatchlistAction(symbol);
      if (!result.ok) {
        setSymbols(snapshot);
        setError(result.error ?? GENERIC_ERROR);
      } else {
        router.refresh();
      }
    } catch {
      setSymbols(snapshot);
      setError(GENERIC_ERROR);
    } finally {
      setPendingSymbol(null);
    }
  }

  return (
    <>
      {error && (
        <p role="alert" className="mb-3 text-sm text-red-600">
          {error}
        </p>
      )}
      {pendingSymbol && (
        <p role="status" className="mb-3 text-sm text-muted">
          Removing {pendingSymbol}…
        </p>
      )}
      {symbols.length === 0 && !pendingSymbol ? (
        <p className="border border-line bg-surface px-3 py-4 text-sm text-muted">
          Your watch list is empty.
        </p>
      ) : (
        <div className="overflow-x-auto border border-line bg-surface">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-surface">
              <tr className="border-b border-line text-left text-xs text-muted">
                <th className="px-3 py-2 font-semibold">Symbol</th>
                <th className="px-3 py-2 font-semibold">Name</th>
                <th className="px-3 py-2 text-right font-semibold">Price</th>
                <th className="px-3 py-2 text-right font-semibold">Open</th>
                <th className="px-3 py-2 text-right font-semibold">
                  Prev Close
                </th>
                <th className="px-3 py-2 text-right font-semibold">High</th>
                <th className="px-3 py-2 text-right font-semibold">Low</th>
                <th className="px-3 py-2 text-right font-semibold">Volume</th>
                <th className="px-3 py-2 text-right font-semibold">High 52</th>
                <th className="px-3 py-2 text-right font-semibold">Low 52</th>
                <th className="px-3 py-2 font-semibold">
                  <span className="sr-only">Action</span>
                </th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {symbols.map((row) => {
                const up = row.price >= row.previousClose;
                return (
                  <tr
                    key={row.id}
                    className="border-b border-line last:border-0 even:bg-canvas hover:bg-line"
                  >
                    <td className="px-3 py-2 font-semibold">
                      <a href={`/chart/${row.symbol}`}>{row.symbol}</a>
                    </td>
                    <td className="px-3 py-2 text-muted">{row.name}</td>
                    <td
                      className={`px-3 py-2 text-right font-semibold ${
                        row.price > 0
                          ? up
                            ? "text-green-600"
                            : "text-red-600"
                          : ""
                      }`}
                    >
                      {row.price > 0 ? `$${formatPrice(row.price)}` : "—"}
                    </td>
                    <td className="px-3 py-2 text-right">
                      ${formatPrice(row.open)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      ${formatPrice(row.previousClose)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      ${formatPrice(row.high)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      ${formatPrice(row.low)}
                    </td>
                    <td className="px-3 py-2 text-right">{row.volume}</td>
                    <td className="px-3 py-2 text-right">
                      ${formatPrice(row.high52)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      ${formatPrice(row.low52)}
                    </td>
                    <td className="px-3 py-2">
                      <span className="flex items-center gap-3">
                        <a
                          href={`/buysell/${row.id}`}
                          className="text-xs text-accent"
                        >
                          buy/sell
                        </a>
                        <button
                          type="button"
                          onClick={() => remove(row.symbol)}
                          disabled={pendingSymbol !== null}
                          title="Remove from watchlist"
                          aria-label={`Remove ${row.symbol} from watchlist`}
                          className="text-muted hover:text-red-600 disabled:opacity-40"
                        >
                          <i
                            className="fa fa-trash-o"
                            aria-hidden="true"
                          ></i>
                        </button>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
