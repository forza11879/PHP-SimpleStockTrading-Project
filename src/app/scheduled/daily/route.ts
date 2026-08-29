import { NextResponse } from "next/server";
import { del } from "@/src/lib/db";

export const dynamic = "force-dynamic";

/** Mirrors /scheduled/daily: cleans up expired password reset requests. */
export async function GET() {
  const removed = del("passresets", "expiryDateTime < datetime('now')");
  return NextResponse.json({ completed: true, removedPasswordResets: removed });
}