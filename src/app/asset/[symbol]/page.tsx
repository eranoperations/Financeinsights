import { notFound } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { market, type EtfDetails, type StockDetails } from "@/lib/market";
import { dividendsByYear } from "@/lib/market/derived";
import { fmtCompact, fmtDate, fmtNumber, fmtPct, fmtPrice, TYPE_LABELS } from "@/lib/format";
import { AssetLogo } from "@/components/AssetLogo";
import { ChangeBadge } from "@/components/ChangeBadge";
import { WatchButton } from "@/components/WatchButton";
import { AddToPortfolio } from "@/components/AddToPortfolio";
import { PriceChart } from "@/components/charts/PriceChart";
import { FinancialsCharts } from "@/components/charts/FinancialsCharts";
import { BarSeriesChart } from "@/components/charts/BarSeriesChart";
import { SERIES } from "@/components/charts/palette";

export async function generateMetadata({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  return { title: `${decodeURIComponent(symbol).toUpperCase()} — FinanceHub` };
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-surface-2 p-3">
      <div className="text-xs text-muted">{label}</div>
      <div className="num mt-1 text-start font-semibold">{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-bold">{title}</h2>
      {children}
    </section>
  );
}

/** Horizontal weight bars (holdings, sectors) — easier to read than a pie. */
function WeightList({ rows }: { rows: { label: React.ReactNode; weight: number }[] }) {
  const max = Math.max(...rows.map((r) => r.weight), 0.0001);
  return (
    <ul className="card divide-y divide-line">
      {rows.map((r, i) => (
        <li key={i} className="flex items-center gap-3 px-4 py-2.5">
          <div className="min-w-0 flex-1 truncate text-sm">{r.label}</div>
          <div className="hidden h-2 w-32 overflow-hidden rounded-full bg-surface-2 sm:block">
            <div className="h-full rounded-full" style={{ width: `${(r.weight / max) * 100}%`, background: SERIES[0] }} />
          </div>
          <div className="num w-16 text-end text-sm font-semibold">{fmtPct(r.weight)}</div>
        </li>
      ))}
    </ul>
  );
}

const SECTOR_HE: Record<string, string> = {
  technology: "טכנולוגיה",
  "Technology": "טכנולוגיה",
  financial_services: "שירותים פיננסיים",
  "Financial Services": "שירותים פיננסיים",
  healthcare: "בריאות",
  Healthcare: "בריאות",
  consumer_cyclical: "צריכה מחזורית",
  "Consumer Cyclical": "צריכה מחזורית",
  communication_services: "תקשורת",
  "Communication Services": "תקשורת",
  industrials: "תעשייה",
  Industrials: "תעשייה",
  consumer_defensive: "צריכה בסיסית",
  "Consumer Defensive": "צריכה בסיסית",
  energy: "אנרגיה",
  Energy: "אנרגיה",
  realestate: "נדל״ן",
  "Real Estate": "נדל״ן",
  basic_materials: "חומרי גלם",
  "Basic Materials": "חומרי גלם",
  utilities: "תשתיות",
  Utilities: "תשתיות",
};

export default async function AssetPage({ params }: { params: Promise<{ symbol: string }> }) {
  const symbol = decodeURIComponent((await params).symbol).toUpperCase();
  if (!/^[A-Z0-9.^=\-]{1,20}$/.test(symbol)) notFound();

  const [user, quotes, history] = await Promise.all([currentUser(), market.quotes([symbol]), market.history(symbol, "1y")]);
  const quote = quotes.data[0];
  if (!quote) notFound();

  const watching = user
    ? !!(await db.watchlistItem.findUnique({ where: { userId_symbol: { userId: user.id, symbol } } }))
    : false;

  const isFund = quote.type === "ETF" || quote.type === "MUTUALFUND";
  const isStock = quote.type === "EQUITY";

  let stock: StockDetails | null = null;
  let etf: EtfDetails | null = null;
  let divYears: ReturnType<typeof dividendsByYear> = [];
  if (isStock || isFund) {
    const [details, longHistory] = await Promise.all([
      isStock ? market.stockDetails(symbol) : market.etfDetails(symbol),
      market.history(symbol, "max"),
    ]);
    if (isStock) stock = details.data as StockDetails;
    else etf = details.data as EtfDetails;
    divYears = dividendsByYear(longHistory.data);
  }

  const cur = quote.currency;
  const demo = quotes.demo || history.demo;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start gap-4">
        <AssetLogo symbol={symbol} size={64} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="num text-3xl font-extrabold">{symbol}</h1>
            <span className="rounded-md bg-surface-2 px-2 py-0.5 text-xs text-muted">{TYPE_LABELS[quote.type]}</span>
            {quote.exchange && <span className="text-xs text-muted">{quote.exchange}</span>}
          </div>
          <div className="text-lg text-muted">
            <bdi>{quote.name}</bdi>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <span className="num text-3xl font-bold">{fmtPrice(quote.price, cur)}</span>
            <ChangeBadge pct={quote.changePercent / 100} />
          </div>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <WatchButton symbol={symbol} initial={watching} loggedIn={!!user} />
          {quote.type !== "INDEX" && <AddToPortfolio symbol={symbol} currency={cur} price={quote.price} loggedIn={!!user} />}
        </div>
      </div>

      {demo && (
        <p className="rounded-xl bg-amber-500/10 px-4 py-2 text-sm text-amber-300">שימו לב: הנתונים בעמוד זה הם נתוני הדגמה.</p>
      )}

      <PriceChart symbol={symbol} currency={cur} initial={history.data.prices} />

      {stock && (
        <>
          <Section title="נתונים עיקריים">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              <Stat label="שווי שוק" value={fmtCompact(stock.stats.marketCap, cur)} />
              <Stat label="מכפיל רווח (P/E)" value={fmtNumber(stock.stats.peRatio)} />
              <Stat label="מכפיל עתידי" value={fmtNumber(stock.stats.forwardPe)} />
              <Stat label="רווח למניה (EPS)" value={fmtNumber(stock.stats.eps)} />
              <Stat label="תשואת דיבידנד" value={fmtPct(stock.stats.dividendYield)} />
              <Stat label="יחס חלוקה" value={fmtPct(stock.stats.payoutRatio)} />
              <Stat label="בטא" value={fmtNumber(stock.stats.beta)} />
              <Stat label="שיא 52 שבועות" value={fmtPrice(stock.stats.fiftyTwoWeekHigh, cur)} />
              <Stat label="שפל 52 שבועות" value={fmtPrice(stock.stats.fiftyTwoWeekLow, cur)} />
              <Stat label="שולי רווח נקי" value={fmtPct(stock.stats.profitMargin)} />
              <Stat label="צמיחה בהכנסות" value={fmtPct(stock.stats.revenueGrowth, 2, true)} />
              <Stat label="מחזור ממוצע" value={fmtCompact(stock.stats.avgVolume)} />
            </div>
          </Section>

          <FinancialsCharts annual={stock.annual} quarterly={stock.quarterly} />
        </>
      )}

      {etf && (
        <>
          <Section title="נתוני הקרן">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              <Stat label="דמי ניהול" value={fmtPct(etf.expenseRatio)} />
              <Stat label="תשואת דיבידנד" value={fmtPct(etf.dividendYield)} />
              <Stat label="נכסים מנוהלים" value={fmtCompact(etf.totalAssets, cur)} />
              <Stat label="בית השקעות" value={etf.fundFamily ?? "—"} />
              <Stat label="קטגוריה" value={etf.category ?? "—"} />
              <Stat label="תאריך הקמה" value={etf.inceptionDate ? fmtDate(etf.inceptionDate) : "—"} />
            </div>
          </Section>

          <div className="grid gap-6 lg:grid-cols-2">
            <Section title="אחזקות עיקריות">
              {etf.holdings.length ? (
                <WeightList
                  rows={etf.holdings.map((h) => ({
                    label: (
                      <span className="flex min-w-0 gap-2">
                        {h.symbol && <span className="num shrink-0 font-semibold">{h.symbol}</span>}
                        <bdi className="block truncate text-muted">{h.name}</bdi>
                      </span>
                    ),
                    weight: h.weight,
                  }))}
                />
              ) : (
                <div className="card p-6 text-center text-muted">אין מידע על אחזקות</div>
              )}
            </Section>
            <Section title="חלוקה לסקטורים">
              {etf.sectors.length ? (
                <WeightList rows={etf.sectors.map((s) => ({ label: SECTOR_HE[s.sector] ?? s.sector, weight: s.weight }))} />
              ) : (
                <div className="card p-6 text-center text-muted">אין מידע על סקטורים</div>
              )}
            </Section>
          </div>

          {etf.annualReturns.length > 0 && (
            <Section title="תשואה שנתית">
              <div className="card p-4">
                <BarSeriesChart
                  data={etf.annualReturns.map((r) => ({ year: String(r.year), value: r.value }))}
                  xKey="year"
                  valueFormat="pct"
                  signColors
                  series={[{ key: "value", name: "תשואה", color: SERIES[0] }]}
                />
              </div>
            </Section>
          )}
        </>
      )}

      {divYears.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Section title="תשואת דיבידנד לאורך השנים">
            <div className="card p-4">
              <BarSeriesChart
                data={divYears}
                xKey="year"
                valueFormat="pct"
                series={[{ key: "yield", name: "תשואת דיבידנד", color: SERIES[2] }]}
              />
            </div>
          </Section>
          <Section title="דיבידנד למניה (שנתי)">
            <div className="card p-4">
              <BarSeriesChart
                data={divYears}
                xKey="year"
                valueFormat="number"
                series={[{ key: "dividends", name: "דיבידנד למניה", color: SERIES[0] }]}
              />
            </div>
          </Section>
        </div>
      )}

      {(stock?.profile.description || etf?.description) && (
        <Section title="אודות">
          <div className="card space-y-3 p-4 text-sm leading-relaxed text-muted">
            {stock && (
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-fg">
                {stock.profile.sector && <span>סקטור: {SECTOR_HE[stock.profile.sector] ?? stock.profile.sector}</span>}
                {stock.profile.industry && <span>ענף: {stock.profile.industry}</span>}
                {stock.profile.employees && (
                  <span>
                    עובדים: <span className="num">{stock.profile.employees.toLocaleString("he-IL")}</span>
                  </span>
                )}
                {stock.profile.website && (
                  <a href={stock.profile.website} target="_blank" rel="noopener noreferrer" className="text-accent">
                    אתר החברה
                  </a>
                )}
              </div>
            )}
            <p dir="auto">{stock?.profile.description ?? etf?.description}</p>
          </div>
        </Section>
      )}
    </div>
  );
}
