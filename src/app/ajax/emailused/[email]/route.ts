import { NextResponse } from "next/server";
import { queryFirstRow } from "@/src/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ email: string }> },
) {
  const { email } = await params;
  const user = queryFirstRow("SELECT * FROM users WHERE email = ?", email);
  return NextResponse.json(user != null);
}