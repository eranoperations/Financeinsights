"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import type { SearchResult } from "@/lib/market/types";
import { TYPE_LABELS } from "@/lib/format";

export function SearchBox({ onSelect, placeholder = "חיפוש חברות, תעודות סל או סימולים" }: {
  onSelect?: (r: SearchResult) => void;
  placeholder?: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const term = q.trim();
    if (!term) {
      setResults([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: ctrl.signal });
        const json = await res.json();
        setResults(json.results ?? []);
        setActive(0);
        setOpen(true);
      } catch {
        /* aborted */
      }
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  function choose(r: SearchResult) {
    setOpen(false);
    setQ(onSelect ? r.symbol : "");
    if (onSelect) onSelect(r);
    else router.push(`/asset/${encodeURIComponent(r.symbol)}`);
  }

  return (
    <div ref={box} className="relative">
      <Search className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => results.length && setOpen(true)}
        onKeyDown={(e) => {
          if (!open || !results.length) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => Math.min(a + 1, results.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
          } else if (e.key === "Enter") {
            e.preventDefault();
            choose(results[active]);
          } else if (e.key === "Escape") setOpen(false);
        }}
        placeholder={placeholder}
        className="input h-14 rounded-2xl ps-12 text-base"
        aria-label="חיפוש"
      />
      {open && results.length > 0 && (
        <ul className="card absolute inset-x-0 top-full z-20 mt-2 max-h-96 overflow-auto p-1 shadow-2xl">
          {results.map((r, i) => (
            <li key={r.symbol}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(r)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-start ${i === active ? "bg-surface-2" : ""}`}
              >
                <span className="num w-20 shrink-0 font-bold">{r.symbol}</span>
                <bdi className="block min-w-0 flex-1 truncate text-sm text-muted">{r.name}</bdi>
                <span className="shrink-0 rounded-md bg-surface-2 px-2 py-0.5 text-xs text-muted">
                  {TYPE_LABELS[r.type] ?? r.type}
                  {r.exchange ? ` · ${r.exchange}` : ""}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
