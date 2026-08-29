import { getSessionUser } from "@/src/lib/session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  return (
    <div className="container text-center" style={{ paddingTop: 100 }}>
      <h1>Trading Simulator</h1>
      <p className="lead">
        Practise buying and selling US equities with virtual cash and live
        market data.
      </p>
      <div className="btn-group btn-group-lg" role="group">
        <a href="/login" className="btn btn-primary">
          Log In
        </a>
        <a href="/register" className="btn btn-success">
          Register
        </a>
        <a href="/contact" className="btn btn-default">
          Contact
        </a>
      </div>
    </div>
  );
}