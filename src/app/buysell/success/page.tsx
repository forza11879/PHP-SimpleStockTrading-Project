import MasterLayout from "@/src/components/MasterLayout";
import { getSessionUser } from "@/src/lib/session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function BuySellSuccessPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect("/login");

  return (
    <MasterLayout title="Order Confirmation" user={sessionUser}>
      <div className="p-4 lg:p-6">
        <div className="border border-line bg-surface p-6 text-center">
          <h2 className="text-base font-semibold text-green-700">
            Order filled
          </h2>
          <p className="mt-2 text-sm text-muted">
            Your order was placed successfully.
          </p>
          <p className="mt-4 flex justify-center gap-2">
            <a
              href="/portfolio"
              className="rounded bg-accent px-3 py-1.5 text-sm font-semibold text-accent-ink"
            >
              View Portfolio
            </a>
            <a
              href="/orders"
              className="rounded border border-line px-3 py-1.5 text-sm"
            >
              View Orders
            </a>
            <a
              href="/dashboard"
              className="rounded border border-line px-3 py-1.5 text-sm"
            >
              Dashboard
            </a>
          </p>
        </div>
      </div>
    </MasterLayout>
  );
}
