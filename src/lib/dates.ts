export function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function addDays(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return toISODate(d);
}

export function daysBetween(a: string, b: string): number {
  return (Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 86_400_000;
}

export function isWeekend(iso: string): boolean {
  const day = new Date(iso + "T00:00:00Z").getUTCDay();
  return day === 0 || day === 6;
}

/** Start date (ISO) for a named history range, relative to today. */
export function rangeStart(range: "1mo" | "6mo" | "1y" | "5y" | "max"): string {
  const d = new Date();
  switch (range) {
    case "1mo":
      d.setUTCMonth(d.getUTCMonth() - 1);
      break;
    case "6mo":
      d.setUTCMonth(d.getUTCMonth() - 6);
      break;
    case "1y":
      d.setUTCFullYear(d.getUTCFullYear() - 1);
      break;
    case "5y":
      d.setUTCFullYear(d.getUTCFullYear() - 5);
      break;
    case "max":
      return "1990-01-01";
  }
  return toISODate(d);
}
