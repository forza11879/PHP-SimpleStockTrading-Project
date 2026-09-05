import MasterLayout from "@/src/components/MasterLayout";
import { getSessionUser } from "@/src/lib/session";
import { redirect } from "next/navigation";
import { getSymbolById } from "@/src/lib/trading";
import { getQuote } from "@/src/lib/quotes";
import { maxBuyQty } from "@/src/lib/orders";
import { formatPrice } from "@/src/lib/money";
import { queryFirstRow } from "@/src/lib/db";
import BuySellForm from "./BuySellForm";

export const dynamic = "force-dynamic";

export default async function BuySellPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect("/login");

  const symbol = getSymbolById(Number(id));
  if (!symbol) redirect("/list");

  const quote = await getQuote(symbol.symbol);
  const price = quote?.price ?? 0;

  const user = queryFirstRow("SELECT * FROM users WHERE id = ?", sessionUser.id);
  const position = queryFirstRow(
    "SELECT * FROM portfolios WHERE userId = ? AND symbol = ?",
    sessionUser.id,
    symbol.symbol,
  );

  const userCash = Number(user?.cash ?? 0);
  const userEquity = Number(user?.equity ?? 0);
  const owned = position ? Math.floor(position.qty as number) : 0;
  const maxbuy = maxBuyQty(userCash, price);
  const maxsell = owned;

  const stats: Array<[string, string]> = [
    ["High", `$${formatPrice(symbol.high)}`],
    ["Low", `$${formatPrice(symbol.low)}`],
    ["High 52wk", `$${formatPrice(symbol.high52)}`],
    ["Low 52wk", `$${formatPrice(symbol.low52)}`],
    ["Open", `$${formatPrice(symbol.open)}`],
    ["Prev Close", `$${formatPrice(symbol.previousClose)}`],
  ];

  return (
    <MasterLayout title={`${symbol.symbol} — Order Ticket`} user={sessionUser}>
      <div className="grid gap-4 p-4 lg:grid-cols-3 lg:p-6">
        <div className="space-y-4">
          <section className="border border-line bg-surface p-4">
            <h2 className="text-sm font-semibold text-green-700">
              Buy {symbol.symbol}
            </h2>
            <p className="mt-1 text-xs text-muted">
              Buying power: ${formatPrice(userCash)}
            </p>
            <BuySellForm
              id={symbol.id}
              type="buy"
              max={maxbuy}
              price={price}
            />
          </section>
          <section className="border border-line bg-surface p-4">
            <h2 className="text-sm font-semibold text-red-700">
              Sell {symbol.symbol}
            </h2>
            <p className="mt-1 text-xs text-muted">Shares owned: {owned}</p>
            <BuySellForm
              id={symbol.id}
              type="sell"
              max={maxsell}
              price={price}
            />
          </section>
        </div>

        <section className="h-fit border border-line bg-surface p-4">
          <h2 className="text-sm font-semibold">{symbol.name}</h2>
          <dl className="mt-3 space-y-2 text-sm tabular-nums">
            {stats.map(([label, value]) => (
              <div key={label} className="flex justify-between border-b border-line pb-2 last:border-0 last:pb-0">
                <dt className="text-muted">{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <a
            href={`/chart/${symbol.symbol}`}
            className="mt-3 inline-block text-xs text-accent"
          >
            View chart →
          </a>
        </section>

        <section className="h-fit border border-line bg-surface p-4 tabular-nums">
          <h2 className="text-sm font-semibold">Account</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between border-b border-line pb-2">
              <dt className="text-muted">Holder</dt>
              <dd>{(user?.name as string | undefined) ?? ""}</dd>
            </div>
            <div className="flex justify-between border-b border-line pb-2">
              <dt className="text-muted">Cash</dt>
              <dd>${formatPrice(userCash)}</dd>
            </div>
            <div className="flex justify-between border-b border-line pb-2">
              <dt className="text-muted">Equity</dt>
              <dd>${formatPrice(userEquity)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Gain/Loss</dt>
              <dd>${formatPrice(userEquity - 50000)}</dd>
            </div>
          </dl>
          <a
            href="/portfolio"
            className="mt-3 inline-block rounded border border-line px-3 py-1.5 text-sm"
          >
            Portfolio
          </a>
        </section>
      </div>
    </MasterLayout>
  );
}
