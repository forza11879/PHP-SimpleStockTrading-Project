import MasterLayout from "@/src/components/MasterLayout";
import { getSessionUser } from "@/src/lib/session";
import { redirect } from "next/navigation";
import { query } from "@/src/lib/db";
import { formatPrice } from "@/src/lib/money";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect("/login");

  const transactions = query(
    "SELECT * FROM transactions WHERE userId = ? ORDER BY date DESC",
    sessionUser.id,
  );

  return (
    <MasterLayout title="Orders" user={sessionUser}>
      <div className="p-4 lg:p-6">
        {transactions.length === 0 ? (
          <p className="border border-line bg-surface px-3 py-4 text-sm text-muted">
            No orders yet.
          </p>
        ) : (
          <div className="overflow-x-auto border border-line bg-surface">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-surface">
                <tr className="border-b border-line text-left text-xs text-muted">
                  <th className="px-3 py-2 font-semibold">Symbol</th>
                  <th className="px-3 py-2 text-right font-semibold">Price</th>
                  <th className="px-3 py-2 text-right font-semibold">
                    Quantity
                  </th>
                  <th className="px-3 py-2 font-semibold">Buy/Sell</th>
                  <th className="px-3 py-2 font-semibold">Time Placed</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {transactions.map((t) => (
                  <tr
                    key={t.id as number}
                    className="border-b border-line last:border-0 hover:bg-canvas"
                  >
                    <td className="px-3 py-2 font-semibold">
                      <a href={`/chart/${t.symbol}`}>{t.symbol as string}</a>
                    </td>
                    <td className="px-3 py-2 text-right">
                      ${formatPrice(t.price as number)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {t.qty as number}
                    </td>
                    <td className="px-3 py-2 capitalize">
                      {t.type as string}
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
      </div>
    </MasterLayout>
  );
}
