import MasterLayout from "@/src/components/MasterLayout";
import { getSessionUser } from "@/src/lib/session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function MasterPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect("/login");

  return (
    <MasterLayout user={sessionUser}>
      <p>Welcome to the Trading Simulator master page.</p>
    </MasterLayout>
  );
}