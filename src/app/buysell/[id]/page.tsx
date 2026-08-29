import MasterLayout from "@/src/components/MasterLayout";
import { getSessionUser } from "@/src/lib/session";
import { redirect } from "next/navigation";
import { getSymbolById } from "@/src/lib/trading";
import { getQuote } from "@/src/lib/quotes";
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

  const userName = user?.name as string | undefined;
  const userCash = Number(user?.cash ?? 0);
  const userEquity = Number(user?.equity ?? 0);
  const maxbuy = price > 0 ? Math.floor(userCash / price) : 0;
  const maxsell = position ? Math.floor(position.qty as number) : 0;

  return (
    <MasterLayout title="Buy/Sell Ticket" user={sessionUser}>
      <div className="panel-heading">
        <h3 className="panel-title">
          <i className="fa fa-table fa-fw"></i> Buy/Sell Ticket
        </h3>
      </div>
      <div className="panel-body">
        <div className="row">
          <div className="col-sm-6 col-md-4">
            <div className="thumbnail">
              <div className="caption">
                <h3>
                  <strong>Buy</strong>
                </h3>
                <br />
                <BuySellForm id={symbol.id} type="buy" max={maxbuy} price={price} />
              </div>
            </div>

            <div className="thumbnail">
              <div className="caption">
                <h3>
                  <strong>Sell</strong>
                </h3>
                <br />
                <BuySellForm id={symbol.id} type="sell" max={maxsell} price={price} />
              </div>
            </div>
          </div>

          <div className="col-sm-6 col-md-4">
            <div className="thumbnail">
              <div className="caption">
                <h3>
                  <strong>{symbol.name}</strong>
                </h3>
                <h3>High: {symbol.high}</h3>
                <h3>Low: {symbol.low}</h3>
                <h3>High52wk: {symbol.high52}</h3>
                <h3>Low52wk: {symbol.low52}</h3>
                <h3>Open: {symbol.open}</h3>
                <h3>Close: {symbol.previousClose}</h3>
              </div>
            </div>
          </div>

          <div className="col-sm-6 col-md-4">
            <div className="thumbnail">
              <div className="caption">
                <h3>
                  <strong>Account Holder:</strong> {userName}
                </h3>
                <br />
                <h3>Cash: ${userCash}</h3>
                <br />
                <h3>Equity: ${userEquity}</h3>
                <br />
                <h3>Gain/Loss: ${userEquity - 50000}</h3>
                <br />
                <a href="/portfolio">
                  <button type="button" className="btn btn-primary btn-md">
                    Portfolio
                  </button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MasterLayout>
  );
}