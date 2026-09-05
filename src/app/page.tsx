import { getSessionUser } from "@/src/lib/session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  return (
    <div className="bg-canvas font-sans text-ink">
      <div className="mx-auto max-w-2xl px-4 pb-16 pt-24 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">
          Trading Simulator
        </h1>
        <p className="mt-3 text-base text-muted">
          Practise buying and selling US equities with virtual cash and live
          market data.
        </p>
        <p className="mt-8 flex justify-center gap-2">
          <a
            href="/login"
            className="rounded bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink"
          >
            Log In
          </a>
          <a
            href="/register"
            className="rounded border border-line bg-surface px-5 py-2.5 text-sm font-semibold"
          >
            Register
          </a>
          <a
            href="/contact"
            className="rounded border border-line bg-surface px-5 py-2.5 text-sm font-semibold"
          >
            Contact
          </a>
        </p>
      </div>
    </div>
  );
}
