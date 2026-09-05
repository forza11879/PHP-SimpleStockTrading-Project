import MasterLayout from "@/src/components/MasterLayout";
import { getSessionUser } from "@/src/lib/session";
import { redirect } from "next/navigation";
import { query } from "@/src/lib/db";
import { refreshQuotes } from "@/src/lib/quotes";
import { formatPrice } from "@/src/lib/money";
import { getPositions } from "@/src/lib/trading";

export const dynamic = "force-dynamic";

function directionClass(value: number): string {
  return value >= 0 ? "text-green-600" : "text-red-600";
}

export default async function PortfolioPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect("/login");

  // Pull fresh quotes for held symbols so the portfolio is priced live.
  const held = query(
    "SELECT DISTINCT symbol FROM portfolios WHERE userId = ?",
    sessionUser.id,
  );
  await refreshQuotes(held.map((r) => r.symbol as string));

  const portfolios = getPositions(sessionUser.id);

  return (
    <MasterLayout title="Portfolio" user={sessionUser}>
      <div className="p-4 lg:p-6">
        {portfolios.length === 0 ? (
          <p className="border border-line bg-surface px-3 py-4 text-sm text-muted">
            No open positions.
          </p>
        ) : (
          <div className="overflow-x-auto border border-line bg-surface">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-surface">
                <tr className="border-b border-line text-left text-xs text-muted">
                  <th className="px-3 py-2 font-semibold">Symbol</th>
                  <th className="px-3 py-2 text-right font-semibold">
                    Average Price
                  </th>
                  <th className="px-3 py-2 text-right font-semibold">Price</th>
                  <th className="px-3 py-2 text-right font-semibold">
                    Quantity
                  </th>
                  <th className="px-3 py-2 text-right font-semibold">
                    Gain/Loss
                  </th>
                  <th className="px-3 py-2 font-semibold">
                    <span className="sr-only">Action</span>
                  </th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {portfolios.map((p) => {
                  const gain =
                    p.price > 0 ? (p.price - p.avgprice) * p.qty : null;
                  return (
                    <tr
                      key={p.id}
                      className="border-b border-line last:border-0 even:bg-canvas hover:bg-line"
                    >
                      <td className="px-3 py-2 font-semibold">
                        <a href={`/chart/${p.symbol}`}>{p.symbol}</a>
                      </td>
                      <td className="px-3 py-2 text-right">
                        ${formatPrice(p.avgprice)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {p.price > 0 ? `$${formatPrice(p.price)}` : "—"}
                      </td>
                      <td className="px-3 py-2 text-right">{p.qty}</td>
                      <td
                        className={`px-3 py-2 text-right ${
                          gain === null ? "" : directionClass(gain)
                        }`}
                      >
                        {gain === null ? "—" : `$${formatPrice(gain)}`}
                      </td>
                      <td className="px-3 py-2">
                        <a
                          href={`/buysell/${p.id}`}
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
        )}
      </div>
    </MasterLayout>
  );
}
