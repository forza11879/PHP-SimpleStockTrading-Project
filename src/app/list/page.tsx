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
      <div className="panel-heading">
        <h3 className="panel-title">
          <i className="fa fa-fw fa-binoculars"></i> Watch List
        </h3>
      </div>
      <div className="panel-body">
        <form method="post" id="searchBox" className="form-inline">
          <div className="form-group mx-sm-3">
            <label className="sr-only" htmlFor="ex1">
              Symbol:
            </label>
            <input
              type="text"
              className="form-control"
              id="ex1"
              name="symbol"
              placeholder="Symbol"
            />
          </div>
          <button type="submit" className="btn btn-primary" formAction={getQuoteAction}>
            Get Quote
          </button>
        </form>

        <div className="card mb-3">
          <div className="list-task">
            <div className="card-block">
              <div className="table-responsive">
                <table
                  className="table table-striped"
                  width="100%"
                  id="myTable"
                  cellSpacing="0"
                >
                  <thead className="thead-inverse">
                    <tr>
                      <th>Symbol</th>
                      <th>Name</th>
                      <th>Price</th>
                      <th>Open</th>
                      <th>Prev Close</th>
                      <th>High</th>
                      <th>Low</th>
                      <th>Volume</th>
                      <th>High 52</th>
                      <th>Low 52</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tfoot className="thead-inverse">
                    <tr>
                      <th>Symbol</th>
                      <th>Name</th>
                      <th>Price</th>
                      <th>Open</th>
                      <th>Prev Close</th>
                      <th>High</th>
                      <th>Low</th>
                      <th>Volume</th>
                      <th>High 52</th>
                      <th>Low 52</th>
                      <th>Action</th>
                    </tr>
                  </tfoot>
                  <tbody>
                    {symbols.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <strong>
                            <a href={`/chart/${row.symbol}`}>{row.symbol}</a>
                          </strong>
                        </td>
                        <td>{row.name}</td>
                        <td>{row.price > 0 ? formatPrice(row.price) : "—"}</td>
                        <td>{formatPrice(row.open)}</td>
                        <td>{formatPrice(row.previousClose)}</td>
                        <td>{formatPrice(row.high)}</td>
                        <td>{formatPrice(row.low)}</td>
                        <td>{row.volume}</td>
                        <td>{formatPrice(row.high52)}</td>
                        <td>{formatPrice(row.low52)}</td>
                        <td>
                          <a href={`/buysell/${row.id}`}>buy/sell </a>
                        </td>
                      </tr>
                    ))}
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