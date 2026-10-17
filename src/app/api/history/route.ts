import { NextResponse, type NextRequest } from "next/server";
import { market, type HistoryRange } from "@/lib/market";

const RANGES: HistoryRange[] = ["1mo", "6mo", "1y", "5y", "max"];

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol") ?? "";
  const range = req.nextUrl.searchParams.get("range") as HistoryRange;
  if (!symbol || !RANGES.includes(range)) return NextResponse.json({ error: "bad request" }, { status: 400 });
  const { data, demo } = await market.history(symbol, range);
  return NextResponse.json({ prices: data.prices, demo });
}
