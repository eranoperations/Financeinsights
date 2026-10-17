import { NextResponse, type NextRequest } from "next/server";
import { market } from "@/lib/market";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 1 || q.length > 50) return NextResponse.json({ results: [] });
  const { data, demo } = await market.search(q);
  return NextResponse.json({ results: data, demo });
}
