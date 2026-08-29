import MasterLayout from "@/src/components/MasterLayout";
import { getSessionUser } from "@/src/lib/session";
import { redirect } from "next/navigation";
import { historyAction } from "@/src/lib/actions";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect("/login");

  return (
    <MasterLayout title="History" user={sessionUser}>
      <div className="panel-heading">
        <h3 className="panel-title">
          <i className="fa fa-bar-chart-o fa-fw"></i> History
        </h3>
      </div>
      <div className="panel-body">
        <form action={historyAction} className="form-inline">
          Symbol:{" "}
          <input type="text" name="symbol" placeholder="Symbol" />
          <input type="submit" value="Get Quote" className="btn btn-primary" />
        </form>
      </div>
    </MasterLayout>
  );
}