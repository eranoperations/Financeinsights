import Link from "next/link";
import clsx from "clsx";
import { CATEGORIES } from "@/lib/market/catalog";
import { market } from "@/lib/market";
import { AssetRow } from "@/components/AssetRow";
import { SearchBox } from "@/components/SearchBox";

export default async function InsightsPage({ searchParams }: { searchParams: Promise<{ cat?: string }> }) {
  const { cat } = await searchParams;
  const category = CATEGORIES.find((c) => c.id === cat) ?? CATEGORIES[0];
  const { data: quotes } = await market.quotes(category.symbols);

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-extrabold">תובנות</h1>
      <SearchBox />
      <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4">
        {CATEGORIES.map((c) => (
          <Link
            key={c.id}
            href={`/insights?cat=${c.id}`}
            className={clsx(
              "shrink-0 rounded-full px-5 py-2.5 font-semibold transition",
              c.id === category.id ? "bg-surface-2 text-fg" : "text-muted hover:text-fg",
            )}
          >
            {c.label}
          </Link>
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {quotes.map((q) => (
          <AssetRow key={q.symbol} quote={q} />
        ))}
      </div>
    </div>
  );
}
