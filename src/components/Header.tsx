import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { currentUser } from "@/lib/auth";
import { BENCHMARKS } from "@/lib/market/catalog";
import { market } from "@/lib/market";
import { fmtPct } from "@/lib/format";
import { NavLinks } from "./NavLinks";

export async function Header() {
  const [user, quotes] = await Promise.all([currentUser(), market.quotes(BENCHMARKS.map((b) => b.symbol))]);
  const bySymbol = new Map(quotes.data.map((q) => [q.symbol, q]));

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link href="/insights" className="flex shrink-0 items-center gap-2 text-lg font-extrabold tracking-tight">
          <BarChart3 className="h-6 w-6 text-accent" />
          <span className="num">FinanceHub</span>
        </Link>
        <NavLinks className="hidden md:flex" />
        <div className="scrollbar-none ms-auto flex gap-4 overflow-x-auto">
          {BENCHMARKS.map((b) => {
            const q = bySymbol.get(b.symbol);
            const pct = q ? q.changePercent / 100 : null;
            return (
              <Link key={b.symbol} href={`/asset/${encodeURIComponent(b.symbol)}`} className="shrink-0 text-center">
                <div className="text-[11px] font-semibold text-muted">{b.label}</div>
                <div className={`num text-sm font-semibold ${pct == null ? "" : pct >= 0 ? "text-up" : "text-down"}`}>
                  {fmtPct(pct, 2, true)}
                </div>
              </Link>
            );
          })}
        </div>
        <div className="hidden shrink-0 md:block">
          {user ? (
            <Link href="/account" className="btn-ghost">
              {user.name || user.email}
            </Link>
          ) : (
            <Link href="/login" className="btn-primary">
              התחברות
            </Link>
          )}
        </div>
      </div>
      {quotes.demo && (
        <div className="bg-amber-500/10 px-4 py-1 text-center text-xs text-amber-300">
          מוצגים נתוני הדגמה — מקור הנתונים החי אינו זמין כרגע
        </div>
      )}
    </header>
  );
}
