import { NextResponse, type NextRequest } from "next/server";
import { market } from "@/lib/market";
import { addDays } from "@/lib/dates";

/** Closing price on (or the last trading day before) a date — used to prefill the trade form. */
export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol") ?? "";
  const date = req.nextUrl.searchParams.get("date") ?? "";
  if (!symbol || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ error: "bad request" }, { status: 400 });
  const { data } = await market.history(symbol, { from: addDays(date, -10) });
  const point = data.prices.filter((p) => p.date <= date).at(-1) ?? data.prices[0];
  return NextResponse.json({ date: point?.date ?? null, close: point?.close ?? null });
}
