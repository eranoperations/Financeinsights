const LOCALE = "he-IL";

export function currencySymbol(currency: string): string {
  switch (currency) {
    case "USD":
      return "$";
    case "ILS":
      return "₪";
    case "ILA":
      return "אג׳ ";
    case "EUR":
      return "€";
    case "GBP":
      return "£";
    default:
      return currency + " ";
  }
}

export function fmtNumber(n: number | null | undefined, digits = 2): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return n.toLocaleString(LOCALE, { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function fmtPrice(n: number | null | undefined, currency = "USD"): string {
  if (n == null || !Number.isFinite(n)) return "—";
  if (currency === "ILA") return `${fmtNumber(n, 2)} אג׳`;
  return `${currencySymbol(currency)}${fmtNumber(n, 2)}`;
}

/** Fraction -> percent string, e.g. 0.0123 -> "1.23%". */
export function fmtPct(n: number | null | undefined, digits = 2, signed = false): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const v = n * 100;
  const sign = signed && v > 0 ? "+" : "";
  return `${sign}${v.toFixed(digits)}%`;
}

/** Large numbers with Hebrew-friendly suffixes (K / M / B / T). */
export function fmtCompact(n: number | null | undefined, currency?: string): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  const units: [number, string][] = [
    [1e12, "T"],
    [1e9, "B"],
    [1e6, "M"],
    [1e3, "K"],
  ];
  const prefix = currency ? currencySymbol(currency === "ILA" ? "ILS" : currency) : "";
  for (const [v, s] of units) {
    if (abs >= v) return `${n < 0 ? "-" : ""}${prefix}${(abs / v).toFixed(2)}${s}`;
  }
  return `${n < 0 ? "-" : ""}${prefix}${abs.toFixed(0)}`;
}

export function fmtDate(iso: string): string {
  return new Date(iso + "T00:00:00Z").toLocaleDateString(LOCALE, { timeZone: "UTC" });
}

export const TYPE_LABELS: Record<string, string> = {
  EQUITY: "מניה",
  ETF: "תעודת סל",
  INDEX: "מדד",
  MUTUALFUND: "קרן נאמנות",
  CRYPTO: "קריפטו",
  CURRENCY: "מטבע",
  OTHER: "אחר",
};
