import MasterLayout from "@/src/components/MasterLayout";
import { getSessionUser } from "@/src/lib/session";
import { redirect } from "next/navigation";
import { query } from "@/src/lib/db";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect("/login");

  const transactions = query(
    "SELECT * FROM transactions WHERE userId = ? ORDER BY date DESC",
    sessionUser.id,
  );

  return (
    <MasterLayout title="Order Details" user={sessionUser}>
      <div className="panel-heading">
        <h3 className="panel-title">
          <i className="fa fa-table fa-fw"></i> Order Details
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
                      <th>Price</th>
                      <th>Quantity</th>
                      <th>Buy/Sell</th>
                      <th>Time Placed</th>
                    </tr>
                  </thead>
                  <tfoot className="thead-inverse">
                    <tr>
                      <th>Symbol</th>
                      <th>Price</th>
                      <th>Quantity</th>
                      <th>Buy/Sell</th>
                      <th>Time Placed</th>
                    </tr>
                  </tfoot>
                  <tbody>
                    {transactions.map((t) => (
                      <tr key={t.id as number}>
                        <td>
                          <strong>
                            <a href={`/chart/${t.symbol}`}>{t.symbol as string}</a>
                          </strong>
                        </td>
                        <td>{String(t.price)}</td>
                        <td>{String(t.qty)}</td>
                        <td>{t.type as string}</td>
                        <td>{t.date as string}</td>
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