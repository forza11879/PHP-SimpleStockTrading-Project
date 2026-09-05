import MasterLayout from "@/src/components/MasterLayout";
import { getSessionUser } from "@/src/lib/session";
import { redirect } from "next/navigation";
import { dailyPL, getPositions, getSymbols, refreshEquity } from "@/src/lib/trading";
import { refreshQuotes } from "@/src/lib/quotes";
import { formatPrice } from "@/src/lib/money";
import { query, queryFirstRow } from "@/src/lib/db";

export const dynamic = "force-dynamic";

function directionClass(value: number): string {
  return value >= 0 ? "text-green-600" : "text-red-600";
}

function signed(value: number): string {
  return `${value >= 0 ? "+" : "−"}${formatPrice(Math.abs(value))}`;
}

export default async function DashboardPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect("/login");

  await refreshQuotes(getSymbols().map((s) => s.symbol));
  refreshEquity(sessionUser.id);
  const user = queryFirstRow(
    "SELECT cash, equity FROM users WHERE id = ?",
    sessionUser.id,
  );
  const cash = Number(user?.cash ?? 0);
  const equity = Number(user?.equity ?? 0);
  const totalGain = equity - 50000;
  const today = dailyPL(sessionUser.id);

  const symbols = getSymbols();
  const positions = getPositions(sessionUser.id);
  const activity = query(
    "SELECT id, symbol, type, qty, price, date FROM transactions WHERE userId = ? ORDER BY date DESC LIMIT 5",
    sessionUser.id,
  );

  const movers = symbols
    .filter((s) => s.price > 0 && s.previousClose > 0)
    .map((s) => ({
      ...s,
      change: ((s.price - s.previousClose) / s.previousClose) * 100,
    }))
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
    .slice(0, 5);

  const metrics = [
    { label: "Total Value", value: `$${formatPrice(equity)}`, className: "" },
    {
      label: "Daily P/L",
      value: `$${signed(today)}`,
      className: directionClass(today),
    },
    {
      label: "Total P/L",
      value: `$${signed(totalGain)}`,
      className: directionClass(totalGain),
    },
    { label: "Available Cash", value: `$${formatPrice(cash)}`, className: "" },
    {
      label: "Buying Power",
      value: `$${formatPrice(cash)}`,
      className: "",
    },
  ];

  return (
    <MasterLayout title="Dashboard" user={sessionUser}>
      <div className="p-4 lg:p-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {metrics.map((m) => (
            <div key={m.label} className="border border-line bg-surface p-4">
              <div className="text-xs text-muted">{m.label}</div>
              <div
                className={`mt-1 text-xl font-semibold tabular-nums ${m.className}`}
              >
                {m.value}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section>
            <div className="mb-2 flex items-baseline justify-between">
              <h2 className="text-sm font-semibold">Positions</h2>
              <a href="/portfolio" className="text-xs text-accent">
                View all →
              </a>
            </div>
            {positions.length === 0 ? (
              <p className="border border-line bg-surface px-3 py-4 text-sm text-muted">
                No open positions.
              </p>
            ) : (
              <div className="overflow-x-auto border border-line bg-surface">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line text-left text-xs text-muted">
                      <th className="px-3 py-2 font-semibold">Symbol</th>
                      <th className="px-3 py-2 text-right font-semibold">Qty</th>
                      <th className="px-3 py-2 text-right font-semibold">
                        Avg Cost
                      </th>
                      <th className="px-3 py-2 text-right font-semibold">
                        Price
                      </th>
                      <th className="px-3 py-2 text-right font-semibold">
                        Gain/Loss
                      </th>
                    </tr>
                  </thead>
                  <tbody className="tabular-nums">
                    {positions.map((p) => {
                      const gain = (p.price - p.avgprice) * p.qty;
                      return (
                        <tr
                          key={p.symbol}
                          className="border-b border-line last:border-0 even:bg-canvas hover:bg-line"
                        >
                          <td className="px-3 py-2 font-semibold">
                            <a href={`/chart/${p.symbol}`}>{p.symbol}</a>
                          </td>
                          <td className="px-3 py-2 text-right">{p.qty}</td>
                          <td className="px-3 py-2 text-right">
                            ${formatPrice(p.avgprice)}
                          </td>
                          <td className="px-3 py-2 text-right">
                            ${formatPrice(p.price)}
                          </td>
                          <td
                            className={`px-3 py-2 text-right ${directionClass(gain)}`}
                          >
                            ${signed(gain)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section>
            <div className="mb-2 flex items-baseline justify-between">
              <h2 className="text-sm font-semibold">Market Movers</h2>
              <a href="/list" className="text-xs text-accent">
                View all →
              </a>
            </div>
            <div className="overflow-x-auto border border-line bg-surface">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs text-muted">
                    <th className="px-3 py-2 font-semibold">Symbol</th>
                    <th className="px-3 py-2 text-right font-semibold">Price</th>
                    <th className="px-3 py-2 text-right font-semibold">
                      Change
                    </th>
                  </tr>
                </thead>
                <tbody className="tabular-nums">
                  {movers.map((s) => (
                    <tr
                      key={s.symbol}
                      className="border-b border-line last:border-0 even:bg-canvas hover:bg-line"
                    >
                      <td className="px-3 py-2 font-semibold">
                        <a href={`/chart/${s.symbol}`}>{s.symbol}</a>
                      </td>
                      <td className="px-3 py-2 text-right">
                        ${formatPrice(s.price)}
                      </td>
                      <td
                        className={`px-3 py-2 text-right ${directionClass(s.change)}`}
                      >
                        {signed(s.change)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <section className="mt-6">
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="text-sm font-semibold">Recent Activity</h2>
            <a href="/orders" className="text-xs text-accent">
              View all →
            </a>
          </div>
          {activity.length === 0 ? (
            <p className="border border-line bg-surface px-3 py-4 text-sm text-muted">
              No orders yet.
            </p>
          ) : (
            <div className="overflow-x-auto border border-line bg-surface">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs text-muted">
                    <th className="px-3 py-2 font-semibold">Symbol</th>
                    <th className="px-3 py-2 font-semibold">Type</th>
                    <th className="px-3 py-2 text-right font-semibold">Qty</th>
                    <th className="px-3 py-2 text-right font-semibold">Price</th>
                    <th className="px-3 py-2 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody className="tabular-nums">
                  {activity.map((t) => (
                    <tr
                      key={t.id as number}
                      className="border-b border-line last:border-0 even:bg-canvas hover:bg-line"
                    >
                      <td className="px-3 py-2 font-semibold">
                        {t.symbol as string}
                      </td>
                      <td className="px-3 py-2 capitalize">
                        {t.type as string}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {t.qty as number}
                      </td>
                      <td className="px-3 py-2 text-right">
                        ${formatPrice(t.price as number)}
                      </td>
                      <td className="px-3 py-2 text-muted">
                        {t.date as string}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </MasterLayout>
  );
}
