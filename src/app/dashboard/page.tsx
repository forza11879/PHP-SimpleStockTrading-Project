import MasterLayout from "@/src/components/MasterLayout";
import { getSessionUser } from "@/src/lib/session";
import { redirect } from "next/navigation";
import { refreshEquity, getSymbols } from "@/src/lib/trading";
import { refreshQuotes } from "@/src/lib/quotes";
import { queryFirstRow } from "@/src/lib/db";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect("/login");

  refreshEquity(sessionUser.id);
  const user = queryFirstRow(
    "SELECT cash, equity FROM users WHERE id = ?",
    sessionUser.id,
  );
  const cash = Number(user?.cash ?? 0);
  const equity = Number(user?.equity ?? 0);
  const gain = equity - 50000;

  await refreshQuotes(getSymbols().map((s) => s.symbol));
  const symbols = getSymbols();

  return (
    <MasterLayout title="Dashboard" user={sessionUser}>
      <div className="panel-heading">
        <h3 className="panel-title">
          <i className="fa fa-fw fa-dashboard"></i> Dashboard
        </h3>
      </div>
      <div className="panel-body">
        <div className="row">
          <div className="col-sm-4">
            <div className="well text-center">
              <h4>Cash</h4>
              <h2>${cash}</h2>
            </div>
          </div>
          <div className="col-sm-4">
            <div className="well text-center">
              <h4>Equity</h4>
              <h2>${equity}</h2>
            </div>
          </div>
          <div className="col-sm-4">
            <div className="well text-center">
              <h4>Gain/Loss</h4>
              <h2>${gain}</h2>
            </div>
          </div>
        </div>

        <h4>Market Overview</h4>
        <div className="table-responsive">
          <table className="table table-striped">
            <thead className="thead-inverse">
              <tr>
                <th>Symbol</th>
                <th>Name</th>
                <th>Price</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {symbols.map((row) => (
                <tr key={row.id}>
                  <td>
                    <strong>
                      <a href={`/chart/${row.symbol}`}>{row.symbol}</a>
                    </strong>
                  </td>
                  <td>{row.name}</td>
                  <td>{row.price > 0 ? row.price : "—"}</td>
                  <td>
                    <a href={`/buysell/${row.id}`}>buy/sell</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p>
          <a href="/portfolio" className="btn btn-default">
            Portfolio
          </a>{" "}
          <a href="/list" className="btn btn-default">
            Watch List
          </a>{" "}
          <a href="/orders" className="btn btn-default">
            Orders
          </a>{" "}
          <a href="/history" className="btn btn-default">
            History
          </a>
        </p>
      </div>
    </MasterLayout>
  );
}