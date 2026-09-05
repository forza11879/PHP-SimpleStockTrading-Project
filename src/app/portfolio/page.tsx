import MasterLayout from "@/src/components/MasterLayout";
import { getSessionUser } from "@/src/lib/session";
import { redirect } from "next/navigation";
import { query } from "@/src/lib/db";
import { refreshQuotes } from "@/src/lib/quotes";
import { getPositions } from "@/src/lib/trading";

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

  const portfolios = getPositions(sessionUser.id);

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
                      const gain =
                        p.price > 0 ? (p.price - p.avgprice) * p.qty : null;
                      return (
                        <tr key={p.id}>
                          <td>
                            <strong>
                              <a href={`/chart/${p.symbol}`}>{p.symbol}</a>
                            </strong>
                          </td>
                          <td>{String(p.avgprice)}</td>
                          <td>{p.price > 0 ? p.price : "—"}</td>
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