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
import { Carousel } from "@/components/Carousel";
import { AssetView, type AssetTab } from "@/components/asset/AssetView";
import { StatGrid, type StatItem } from "@/components/asset/StatGrid";

export async function generateMetadata({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  return { title: `${decodeURIComponent(symbol).toUpperCase()} — FinanceHub` };
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-bold">{title}</h2>
      {children}
    </section>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card h-full p-4">
      <h3 className="mb-3 font-semibold">{title}</h3>
      {children}
    </div>
  );
}

/** Builds stat tiles, dropping the ones with no data. */
function stats(...items: [label: string, raw: unknown, value: string][]): StatItem[] {
  return items.filter(([, raw]) => raw != null && raw !== "").map(([label, , value]) => ({ label, value }));
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
  const canAddToPortfolio = quote.type !== "INDEX";

  const hero = (
    <div className="flex flex-wrap items-start gap-3 md:gap-4">
      <div className="md:hidden">
        <AssetLogo symbol={symbol} size={44} />
      </div>
      <div className="hidden md:block">
        <AssetLogo symbol={symbol} size={64} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="num text-2xl font-extrabold md:text-3xl">{symbol}</h1>
          <span className="rounded-md bg-surface-2 px-2 py-0.5 text-xs text-muted">{TYPE_LABELS[quote.type]}</span>
          {quote.exchange && <span className="text-xs text-muted">{quote.exchange}</span>}
          {demo && <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-xs text-amber-300">נתוני הדגמה</span>}
        </div>
        <div className="truncate text-sm text-muted md:text-lg">
          <bdi>{quote.name}</bdi>
        </div>
        <div className="mt-1 flex items-center gap-3 md:mt-2">
          <span className="num text-2xl font-bold md:text-3xl">{fmtPrice(quote.price, cur)}</span>
          <ChangeBadge pct={quote.changePercent / 100} />
        </div>
      </div>
      <div className="hidden gap-2 md:flex">
        <WatchButton symbol={symbol} initial={watching} loggedIn={!!user} />
        {canAddToPortfolio && <AddToPortfolio symbol={symbol} currency={cur} price={quote.price} loggedIn={!!user} />}
      </div>
    </div>
  );

  const mini = (
    <div className="flex items-center gap-2">
      <span className="num font-bold">{symbol}</span>
      <bdi className="min-w-0 flex-1 truncate text-xs text-muted">{quote.name}</bdi>
      <span className="num font-semibold">{fmtPrice(quote.price, cur)}</span>
      <ChangeBadge pct={quote.changePercent / 100} />
    </div>
  );

  const priceChart = <PriceChart symbol={symbol} currency={cur} initial={history.data.prices} />;
  const tabs: AssetTab[] = [];

  if (stock) {
    const s = stock.stats;
    const has52w = s.fiftyTwoWeekLow != null && s.fiftyTwoWeekHigh != null;
    tabs.push(
      {
        id: "overview",
        label: "סקירה",
        content: (
          <>
            {priceChart}
            <Section title="נתונים עיקריים">
              <StatGrid
                primary={stats(
                  ["שווי שוק", s.marketCap, fmtCompact(s.marketCap, cur)],
                  ["מכפיל רווח (P/E)", s.peRatio, fmtNumber(s.peRatio)],
                  ["תשואת דיבידנד", s.dividendYield, fmtPct(s.dividendYield)],
                  ["טווח 52 שבועות", has52w || null, `${fmtPrice(s.fiftyTwoWeekLow, cur)} – ${fmtPrice(s.fiftyTwoWeekHigh, cur)}`],
                )}
                more={stats(
                  ["מכפיל עתידי", s.forwardPe, fmtNumber(s.forwardPe)],
                  ["רווח למניה (EPS)", s.eps, fmtNumber(s.eps)],
                  ["יחס חלוקה", s.payoutRatio, fmtPct(s.payoutRatio)],
                  ["בטא", s.beta, fmtNumber(s.beta)],
                  ["שולי רווח נקי", s.profitMargin, fmtPct(s.profitMargin)],
                  ["צמיחה בהכנסות", s.revenueGrowth, fmtPct(s.revenueGrowth, 2, true)],
                  ["מחזור ממוצע", s.avgVolume, fmtCompact(s.avgVolume)],
                )}
              />
            </Section>
          </>
        ),
      },
      { id: "financials", label: "דוחות", content: <FinancialsCharts annual={stock.annual} quarterly={stock.quarterly} /> },
    );
  } else if (etf) {
    tabs.push(
      {
        id: "overview",
        label: "סקירה",
        content: (
          <>
            {priceChart}
            <Section title="נתוני הקרן">
              <StatGrid
                primary={stats(
                  ["דמי ניהול", etf.expenseRatio, fmtPct(etf.expenseRatio)],
                  ["תשואת דיבידנד", etf.dividendYield, fmtPct(etf.dividendYield)],
                  ["נכסים מנוהלים", etf.totalAssets, fmtCompact(etf.totalAssets, cur)],
                  ["בית השקעות", etf.fundFamily, etf.fundFamily ?? ""],
                )}
                more={stats(
                  ["קטגוריה", etf.category, etf.category ?? ""],
                  ["תאריך הקמה", etf.inceptionDate, etf.inceptionDate ? fmtDate(etf.inceptionDate) : ""],
                )}
              />
            </Section>
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
        ),
      },
      {
        id: "holdings",
        label: "אחזקות",
        content: (
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
        ),
      },
    );
  } else {
    tabs.push({ id: "overview", label: "סקירה", content: priceChart });
  }

  if (divYears.length > 0) {
    tabs.push({
      id: "dividends",
      label: "דיבידנדים",
      content: (
        <Section title="דיבידנדים">
          <Carousel>
            <ChartCard title="תשואת דיבידנד לאורך השנים">
              <BarSeriesChart
                data={divYears}
                xKey="year"
                valueFormat="pct"
                series={[{ key: "yield", name: "תשואת דיבידנד", color: SERIES[2] }]}
              />
            </ChartCard>
            <ChartCard title="דיבידנד למניה (שנתי)">
              <BarSeriesChart
                data={divYears}
                xKey="year"
                valueFormat="number"
                series={[{ key: "dividends", name: "דיבידנד למניה", color: SERIES[0] }]}
              />
            </ChartCard>
          </Carousel>
        </Section>
      ),
    });
  }

  if (stock?.profile.description || etf?.description) {
    tabs.push({
      id: "about",
      label: "אודות",
      content: (
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
      ),
    });
  }

  return (
    <>
      <AssetView hero={hero} mini={mini} tabs={tabs} />

      {/* Mobile: keep the main actions in reach, just above the bottom nav. */}
      <div className="h-14 md:hidden" />
      <div className="fixed inset-x-3 bottom-[5.75rem] z-30 flex gap-2 md:hidden">
        <WatchButton symbol={symbol} initial={watching} loggedIn={!!user} className="flex-1 py-3 shadow-xl" />
        {canAddToPortfolio && (
          <AddToPortfolio symbol={symbol} currency={cur} price={quote.price} loggedIn={!!user} className="flex-1 py-3 shadow-xl" />
        )}
      </div>
    </>
  );
}
