import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { market } from "@/lib/market";
import { AssetRow } from "@/components/AssetRow";
import { SearchBox } from "@/components/SearchBox";

export default async function WatchlistPage() {
  const user = await requireUser("/watchlist");
  const items = await db.watchlistItem.findMany({ where: { userId: user.id }, orderBy: { addedAt: "desc" } });
  const { data: quotes } = await market.quotes(items.map((i) => i.symbol));

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-extrabold">רשימת מעקב</h1>
      <SearchBox />
      {quotes.length ? (
        <div className="grid gap-3 md:grid-cols-2">
          {quotes.map((q) => (
            <AssetRow key={q.symbol} quote={q} />
          ))}
        </div>
      ) : (
        <div className="card p-8 text-center text-muted">
          רשימת המעקב ריקה. חפשו מניה או תעודת סל ולחצו על &quot;הוסף למעקב&quot;, או{" "}
          <Link href="/insights" className="text-accent">
            עברו לעמוד התובנות
          </Link>
          .
        </div>
      )}
    </div>
  );
}
