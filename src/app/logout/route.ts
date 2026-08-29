import { NextResponse } from "next/server";
import { destroySession } from "@/src/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  await destroySession();
  return NextResponse.redirect(new URL("/logout/success", process.env.HOST ?? "http://localhost:3000"));
}