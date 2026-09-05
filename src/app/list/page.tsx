import MasterLayout from "@/src/components/MasterLayout";
import { getSessionUser } from "@/src/lib/session";
import { redirect } from "next/navigation";
import { getSymbols } from "@/src/lib/trading";
import { refreshQuotes } from "@/src/lib/quotes";
import { getQuoteAction } from "@/src/lib/actions";
import { formatPrice } from "@/src/lib/money";

export const dynamic = "force-dynamic";

export default async function ListPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect("/login");

  // Pull fresh quotes so the watchlist shows live prices. (The shell keeps
  // equity fresh; this page reads no equity itself.)
  await refreshQuotes(getSymbols().map((s) => s.symbol));
  const symbols = getSymbols();

  return (
    <MasterLayout title="Watch List" user={sessionUser}>
      <div className="p-4 lg:p-6">
        <form action={getQuoteAction} className="mb-4 flex gap-2">
          <label htmlFor="symbol-input" className="sr-only">
            Symbol
          </label>
          <input
            type="text"
            id="symbol-input"
            name="symbol"
            placeholder="Symbol"
            className="border border-line bg-surface px-3 py-1.5 text-sm uppercase placeholder:normal-case placeholder:text-muted"
          />
          <button
            type="submit"
            className="rounded bg-accent px-3 py-1.5 text-sm font-semibold text-accent-ink"
          >
            Get Quote
          </button>
        </form>

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
                    className="border-b border-line last:border-0 hover:bg-canvas"
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
                      <a
                        href={`/buysell/${row.id}`}
                        className="text-xs text-accent"
                      >
                        buy/sell
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </MasterLayout>
  );
}
