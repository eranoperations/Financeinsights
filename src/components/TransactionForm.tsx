"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { addTransaction, type FormState } from "@/app/actions";
import { SearchBox } from "./SearchBox";

export function TransactionForm({
  symbol: fixedSymbol,
  currency,
  defaultPrice,
  onDone,
}: {
  symbol?: string;
  currency?: string;
  defaultPrice?: number;
  onDone?: () => void;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(addTransaction, {});
  const [symbol, setSymbol] = useState(fixedSymbol ?? "");
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [price, setPrice] = useState(defaultPrice?.toFixed(2) ?? "");
  const [priceEdited, setPriceEdited] = useState(false);
  const form = useRef<HTMLFormElement>(null);

  // Prefill the price with the closing price on the chosen date (until the user types their own).
  useEffect(() => {
    if (!symbol || priceEdited) return;
    const ctrl = new AbortController();
    fetch(`/api/price?symbol=${encodeURIComponent(symbol)}&date=${date}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((j) => typeof j.close === "number" && setPrice(j.close.toFixed(2)))
      .catch(() => {});
    return () => ctrl.abort();
  }, [symbol, date, priceEdited]);

  useEffect(() => {
    if (state.ok) {
      form.current?.reset();
      setPriceEdited(false);
      if (!fixedSymbol) setSymbol("");
      onDone?.();
    }
  }, [state, fixedSymbol, onDone]);

  return (
    <form ref={form} action={action} className="space-y-3">
      {fixedSymbol ? (
        <input type="hidden" name="symbol" value={fixedSymbol} />
      ) : (
        <div>
          <span className="label">נייר ערך</span>
          <SearchBox placeholder="חיפוש סימול" onSelect={(r) => setSymbol(r.symbol)} />
          <input type="hidden" name="symbol" value={symbol} />
          {symbol && (
            <div className="mt-1 text-xs text-muted">
              נבחר: <span className="num font-semibold text-fg">{symbol}</span>
            </div>
          )}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <label>
          <span className="label">סוג פעולה</span>
          <select name="type" className="input" defaultValue="BUY">
            <option value="BUY">קנייה</option>
            <option value="SELL">מכירה</option>
          </select>
        </label>
        <label>
          <span className="label">תאריך</span>
          <input
            name="date"
            type="date"
            max={today}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input"
            required
          />
        </label>
        <label>
          <span className="label">כמות</span>
          <input name="quantity" type="number" step="any" min="0" className="input" required />
        </label>
        <label>
          <span className="label">מחיר ליחידה {(currency ?? (symbol.endsWith(".TA") ? "ILA" : "")) === "ILA" ? "(באגורות)" : currency ? `(${currency})` : ""}</span>
          <input
            name="price"
            type="number"
            step="any"
            min="0"
            value={price}
            onChange={(e) => {
              setPrice(e.target.value);
              setPriceEdited(true);
            }}
            className="input"
            required
          />
        </label>
        <label className="col-span-2">
          <span className="label">עמלה (אופציונלי)</span>
          <input name="fee" type="number" step="any" min="0" defaultValue={0} className="input" />
        </label>
      </div>
      {state.error && <p className="text-sm text-down">{state.error}</p>}
      {state.ok && <p className="text-sm text-up">העסקה נוספה לתיק</p>}
      <button className="btn-primary w-full" disabled={pending || (!fixedSymbol && !symbol)}>
        {pending ? "שומר..." : "הוסף לתיק"}
      </button>
    </form>
  );
}
