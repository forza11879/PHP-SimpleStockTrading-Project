import MasterLayout from "@/src/components/MasterLayout";
import { getSessionUser } from "@/src/lib/session";
import { redirect } from "next/navigation";
import { getWatchlist } from "@/src/lib/trading";
import { refreshQuotes } from "@/src/lib/quotes";
import GetQuoteForm from "./GetQuoteForm";
import WatchlistTable from "./WatchlistTable";

export const dynamic = "force-dynamic";

export default async function ListPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect("/login");

  // Pull fresh quotes so the watchlist shows live prices. (The shell keeps
  // equity fresh; this page reads no equity itself.)
  const symbols = getWatchlist(sessionUser.id);
  await refreshQuotes(symbols.map((s) => s.symbol));

  return (
    <MasterLayout title="Watch List" user={sessionUser}>
      <div className="p-4 lg:p-6">
        <GetQuoteForm />
        <WatchlistTable initial={getWatchlist(sessionUser.id)} />
      </div>
    </MasterLayout>
  );
}
