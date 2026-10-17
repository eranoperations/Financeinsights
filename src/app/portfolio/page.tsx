import Link from "next/link";
import clsx from "clsx";
import { requireUser } from "@/lib/auth";
import { loadPortfolio, type BaseCurrency } from "@/lib/portfolio/service";
import { currencySymbol, fmtDate, fmtNumber, fmtPct, fmtPrice } from "@/lib/format";
import { PerformanceChart } from "@/components/charts/PerformanceChart";
import { TransactionForm } from "@/components/TransactionForm";
import { DeleteTxnButton } from "@/components/DeleteTxnButton";
import { AssetLogo } from "@/components/AssetLogo";
import { SERIES } from "@/components/charts/palette";

function Kpi({ label, value, tone, hint }: { label: string; value: string; tone?: "up" | "down"; hint?: string }) {
  return (
    <div className="card p-4">
      <div className="text-xs leading-snug text-muted">{label}</div>
      <div className={clsx("num mt-1 text-start text-2xl font-bold", tone === "up" && "text-up", tone === "down" && "text-down")}>
        {value}
      </div>
      {hint && <div className="mt-1 text-xs text-muted">{hint}</div>}
    </div>
  );
}

const tone = (v: number | null | undefined) => (v == null ? undefined : v >= 0 ? "up" : "down");

export default async function PortfolioPage({ searchParams }: { searchParams: Promise<{ base?: string }> }) {
  const user = await requireUser("/portfolio");
  const base: BaseCurrency = (await searchParams).base === "ILS" ? "ILS" : "USD";
  const view = await loadPortfolio(user.id, base);
  const { result: r } = view;
  const sym = currencySymbol(base);
  const money = (v: number) => `${v < 0 ? "-" : ""}${sym}${fmtNumber(Math.abs(v))}`;
  const annual = r.periodDays >= 365;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-4xl font-extrabold">התיק שלי</h1>
        <div className="flex gap-1 rounded-xl bg-surface p-1 text-sm">
          {(["USD", "ILS"] as const).map((c) => (
            <Link
              key={c}
              href={`/portfolio?base=${c}`}
              className={clsx("rounded-lg px-3 py-1", base === c ? "bg-surface-2 text-fg" : "text-muted")}
            >
              {c === "USD" ? "דולר $" : "שקל ₪"}
            </Link>
          ))}
        </div>
      </div>

      {view.demo && (
        <p className="rounded-xl bg-amber-500/10 px-4 py-2 text-sm text-amber-300">
          החישובים מבוססים על נתוני הדגמה כי מקור הנתונים החי אינו זמין כרגע.
        </p>
      )}

      {r.series.length === 0 ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="card p-8 text-center text-muted">
            <p className="mb-2 text-lg text-fg">התיק עדיין ריק</p>
            הוסיפו עסקאות קנייה ומכירה כדי לראות את שווי התיק, תשואה משוקללת זמן (TWR), תשואה משוקללת כסף (MWR) והשוואה למדדים.
          </div>
          <div className="card p-5">
            <h2 className="mb-4 text-lg font-bold">הוספת עסקה</h2>
            <TransactionForm />
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi label="שווי התיק" value={money(r.totalValue)} />
            <Kpi label="סכום מושקע נטו" value={money(r.netInvested)} hint={`מאז ${fmtDate(r.startDate!)}`} />
            <Kpi label="רווח / הפסד כולל" value={money(r.totalPnl)} tone={tone(r.totalPnl)} />
            <Kpi label="דיבידנדים שהתקבלו" value={money(r.dividendsReceived)} />
            <Kpi
              label="TWR — תשואה משוקללת זמן"
              value={fmtPct(r.twr, 2, true)}
              tone={tone(r.twr)}
              hint={r.twrAnnualized != null ? `שנתי: ${fmtPct(r.twrAnnualized, 2, true)}` : "לתקופה"}
            />
            <Kpi
              label="MWR — תשואה משוקללת כסף"
              value={fmtPct(r.mwr, 2, true)}
              tone={tone(r.mwr)}
              hint={annual ? "שנתי (IRR)" : "לתקופה (IRR)"}
            />
            <Kpi label="רווח ממומש" value={money(r.realizedPnl)} tone={tone(r.realizedPnl)} />
            <Kpi label="מספר אחזקות" value={String(r.holdings.length)} />
          </div>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">ביצועים מול מדדים</h2>
            <PerformanceChart
              portfolio={r.series.map(({ date, twr, value, invested }) => ({ date, twr, value, invested }))}
              benchmarks={view.benchmarks.map((b) => ({ symbol: b.symbol, label: b.label, series: b.series.map(({ date, twr }) => ({ date, twr })) }))}
              currencySymbol={sym}
            />
            <div className="card overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-muted">
                  <tr className="border-b border-line">
                    <th className="p-3 text-start font-medium">השוואה</th>
                    <th className="p-3 text-start font-medium">TWR {annual ? "(שנתי)" : "(לתקופה)"}</th>
                    <th className="p-3 text-start font-medium">MWR {annual ? "(שנתי)" : "(לתקופה)"}</th>
                    <th className="p-3 text-start font-medium">שווי אילו הושקע במדד</th>
                    <th className="p-3 text-start font-medium">פער מול התיק</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-line font-semibold">
                    <td className="p-3">התיק שלי</td>
                    <td className="num p-3 text-start">{fmtPct(annual ? r.twrAnnualized : r.twr, 2, true)}</td>
                    <td className="num p-3 text-start">{fmtPct(r.mwr, 2, true)}</td>
                    <td className="num p-3 text-start">{money(r.totalValue)}</td>
                    <td className="p-3">—</td>
                  </tr>
                  {view.benchmarks.map((b) => {
                    const diff = r.totalValue - b.value;
                    return (
                      <tr key={b.symbol} className="border-b border-line last:border-0">
                        <td className="p-3">{b.label}</td>
                        <td className="num p-3 text-start">{fmtPct(annual ? b.twrAnnualized : b.twr, 2, true)}</td>
                        <td className="num p-3 text-start">{fmtPct(b.mwr, 2, true)}</td>
                        <td className="num p-3 text-start">{money(b.value)}</td>
                        <td className={clsx("num p-3 text-start", diff >= 0 ? "text-up" : "text-down")}>
                          {diff >= 0 ? "+" : ""}
                          {money(diff)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="border-t border-line p-3 text-xs leading-relaxed text-muted">
                TWR מנטרל את השפעת העיתוי והגודל של ההפקדות ומודד את איכות ההחלטות. MWR (IRR) משקלל את תזמון הכסף שהשקעתם בפועל.
                בעמודת &quot;שווי אילו הושקע במדד&quot; כל קנייה ומכירה שלכם שוחזרה כאילו בוצעה במדד באותו יום. תשואת המדדים היא
                תשואת מחיר ללא דיבידנדים.
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold">אחזקות</h2>
            <div className="card overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="text-muted">
                  <tr className="border-b border-line">
                    <th className="p-3 text-start font-medium">נייר</th>
                    <th className="p-3 text-start font-medium">כמות</th>
                    <th className="p-3 text-start font-medium">עלות ממוצעת</th>
                    <th className="p-3 text-start font-medium">מחיר</th>
                    <th className="p-3 text-start font-medium">שווי</th>
                    <th className="p-3 text-start font-medium">רווח לא ממומש</th>
                    <th className="p-3 text-start font-medium">משקל</th>
                  </tr>
                </thead>
                <tbody>
                  {r.holdings.map((h, i) => (
                    <tr key={h.symbol} className="border-b border-line last:border-0">
                      <td className="p-3">
                        <Link href={`/asset/${encodeURIComponent(h.symbol)}`} className="flex items-center gap-3">
                          <AssetLogo symbol={h.symbol} size={32} />
                          <div className="min-w-0">
                            <div className="num text-start font-semibold">{h.symbol}</div>
                            <div className="max-w-40 truncate text-xs text-muted"><bdi>{view.names[h.symbol]}</bdi>
                            </div>
                          </div>
                        </Link>
                      </td>
                      <td className="num p-3 text-start">{fmtNumber(h.quantity, h.quantity % 1 ? 4 : 0)}</td>
                      <td className="num p-3 text-start">{fmtPrice(h.avgCost, h.currency)}</td>
                      <td className="num p-3 text-start">{fmtPrice(h.price, h.currency)}</td>
                      <td className="num p-3 text-start">{money(h.marketValue)}</td>
                      <td className={clsx("num p-3 text-start", h.unrealizedPnl >= 0 ? "text-up" : "text-down")}>
                        {money(h.unrealizedPnl)}
                        <span className="ms-1 text-xs opacity-80">({fmtPct(h.costBasis ? h.unrealizedPnl / h.costBasis : null, 1, true)})</span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-16 overflow-hidden rounded-full bg-surface-2">
                            <div className="h-full rounded-full" style={{ width: `${h.weight * 100}%`, background: SERIES[i % SERIES.length] }} />
                          </div>
                          <span className="num text-xs">{fmtPct(h.weight, 1)}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
            <section className="min-w-0 space-y-3">
              <h2 className="text-xl font-bold">עסקאות</h2>
              <div className="card overflow-x-auto">
                <table className="w-full min-w-[520px] text-sm">
                  <thead className="text-muted">
                    <tr className="border-b border-line">
                      <th className="p-3 text-start font-medium">תאריך</th>
                      <th className="p-3 text-start font-medium">פעולה</th>
                      <th className="p-3 text-start font-medium">נייר</th>
                      <th className="p-3 text-start font-medium">כמות</th>
                      <th className="p-3 text-start font-medium">מחיר</th>
                      <th className="p-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {view.transactions.map((t) => (
                      <tr key={t.id} className="border-b border-line last:border-0">
                        <td className="num p-3 text-start">{fmtDate(t.date)}</td>
                        <td className={clsx("p-3", t.type === "BUY" ? "text-up" : "text-down")}>{t.type === "BUY" ? "קנייה" : "מכירה"}</td>
                        <td className="num p-3 text-start font-semibold">{t.symbol}</td>
                        <td className="num p-3 text-start">{fmtNumber(t.quantity, t.quantity % 1 ? 4 : 0)}</td>
                        <td className="num p-3 text-start">{fmtPrice(t.price, t.currency)}</td>
                        <td className="p-3 text-end">
                          <DeleteTxnButton id={t.id} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
            <section className="min-w-0 space-y-3">
              <h2 className="text-xl font-bold">הוספת עסקה</h2>
              <div className="card p-5">
                <TransactionForm />
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
