import { NextResponse } from "next/server";
import { fetchHistory } from "@/src/lib/history";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ symbol: string }> },
) {
  const { symbol } = await params;
  const data = await fetchHistory(symbol);
  return NextResponse.json(data);
}