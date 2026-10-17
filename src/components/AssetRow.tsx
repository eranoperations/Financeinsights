import Link from "next/link";
import type { Quote } from "@/lib/market";
import { fmtCompact, fmtPrice, TYPE_LABELS } from "@/lib/format";
import { AssetLogo } from "./AssetLogo";
import { ChangeBadge } from "./ChangeBadge";

export function AssetRow({ quote, extra }: { quote: Quote; extra?: React.ReactNode }) {
  return (
    <Link
      href={`/asset/${encodeURIComponent(quote.symbol)}`}
      className="card flex items-center gap-4 p-4 transition hover:border-muted"
    >
      <AssetLogo symbol={quote.symbol} />
      <div className="min-w-0 flex-1">
        <div className="num text-start text-lg font-bold">{quote.symbol}</div>
        <div className="truncate text-muted">
          <bdi>{quote.name}</bdi>
        </div>
        <div className="text-xs text-muted/80">
          {quote.marketCap ? (
            <>
              שווי שוק: <span className="num">{fmtCompact(quote.marketCap, quote.currency)}</span>
            </>
          ) : (
            TYPE_LABELS[quote.type]
          )}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <div className="num text-lg font-bold">{fmtPrice(quote.price, quote.currency)}</div>
        <ChangeBadge pct={quote.changePercent / 100} />
        {extra}
      </div>
    </Link>
  );
}
