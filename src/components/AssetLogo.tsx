const COLORS = ["#4f8cff", "#22c55e", "#f59e0b", "#ec4899", "#8b5cf6", "#14b8a6", "#ef4444", "#06b6d4"];

/** Lightweight ticker avatar (no external logo service needed). */
export function AssetLogo({ symbol, size = 48 }: { symbol: string; size?: number }) {
  let h = 0;
  for (const c of symbol) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const color = COLORS[h % COLORS.length];
  const text = symbol.replace(/^\^/, "").replace(/\..*$/, "").slice(0, 4);
  return (
    <div
      className="num flex shrink-0 items-center justify-center rounded-xl font-bold"
      style={{ width: size, height: size, background: color + "22", color, fontSize: size / (text.length > 3 ? 4 : 3.2) }}
    >
      {text}
    </div>
  );
}
