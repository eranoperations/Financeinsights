import { fmtPct } from "@/lib/format";

export function ChangeBadge({ pct, className = "" }: { pct: number | null | undefined; className?: string }) {
  if (pct == null) return <span className="text-muted">—</span>;
  const up = pct >= 0;
  return (
    <span
      className={`num inline-block rounded-lg px-2 py-0.5 text-sm font-semibold ${up ? "bg-up/15 text-up" : "bg-down/15 text-down"} ${className}`}
    >
      {fmtPct(pct, 2, true)}
    </span>
  );
}
