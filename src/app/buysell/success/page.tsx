import MasterLayout from "@/src/components/MasterLayout";
import { getSessionUser } from "@/src/lib/session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function BuySellSuccessPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect("/login");

  return (
    <MasterLayout title="Order Confirmation" user={sessionUser}>
      <div className="panel-heading">
        <h3 className="panel-title">
          <i className="fa fa-fw fa-check-circle"></i> Order Confirmation
        </h3>
      </div>
      <div className="panel-body">
        <p>Your order was placed successfully.</p>
        <p>
          <a href="/portfolio" className="btn btn-primary">
            View Portfolio
          </a>{" "}
          <a href="/orders" className="btn btn-default">
            View Orders
          </a>{" "}
          <a href="/dashboard" className="btn btn-default">
            Dashboard
          </a>
        </p>
      </div>
    </MasterLayout>
  );
}