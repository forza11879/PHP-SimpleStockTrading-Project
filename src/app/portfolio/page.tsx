import MasterLayout from "@/src/components/MasterLayout";
import { getSessionUser } from "@/src/lib/session";
import { redirect } from "next/navigation";
import { query } from "@/src/lib/db";
import { refreshQuotes } from "@/src/lib/quotes";

export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect("/login");

  // Pull fresh quotes for held symbols so the portfolio is priced live.
  const held = query(
    "SELECT DISTINCT symbol FROM portfolios WHERE userId = ?",
    sessionUser.id,
  );
  await refreshQuotes(held.map((r) => r.symbol as string));

  const portfolios = query(
    `SELECT s.id, s.symbol, p.avgprice, s.price, p.qty
     FROM portfolios p, symbols s
     WHERE p.symbol = s.symbol AND p.userId = ?`,
    sessionUser.id,
  );

  return (
    <MasterLayout title="Portfolio" user={sessionUser}>
      <div className="panel-heading">
        <h3 className="panel-title">
          <i className="fa fa-fw fa-briefcase"></i> Portfolio
        </h3>
      </div>
      <div className="panel-body">
        <div className="card mb-3">
          <div className="list-task">
            <div className="card-block">
              <div className="table-responsive">
                <table
                  className="table table-striped"
                  width="100%"
                  id="dataTable"
                  cellSpacing="0"
                >
                  <thead className="thead-inverse">
                    <tr>
                      <th>Symbol</th>
                      <th>Average Price</th>
                      <th>Price</th>
                      <th>Quantity</th>
                      <th>Gain/Loss</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tfoot className="thead-inverse">
                    <tr>
                      <th>Symbol</th>
                      <th>Average Price</th>
                      <th>Price</th>
                      <th>Quantity</th>
                      <th>Gain/Loss</th>
                      <th>Action</th>
                    </tr>
                  </tfoot>
                  <tbody>
                    {portfolios.map((p) => {
                      const price = p.price as number;
                      const gain = price > 0
                        ? (price - (p.avgprice as number)) * (p.qty as number)
                        : null;
                      return (
                        <tr key={p.id as number}>
                          <td>
                            <strong>
                              <a href={`/chart/${p.symbol}`}>{p.symbol as string}</a>
                            </strong>
                          </td>
                          <td>{String(p.avgprice)}</td>
                          <td>{price > 0 ? price : "—"}</td>
                          <td>{String(p.qty)}</td>
                          <td>{gain === null ? "—" : `$ ${gain}`}</td>
                          <td>
                            <a href={`/buysell/${p.id}`}>buy/sell </a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MasterLayout>
  );
}