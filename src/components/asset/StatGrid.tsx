"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import clsx from "clsx";

export interface StatItem {
  label: string;
  value: string;
}

function Stat({ item, className }: { item: StatItem; className?: string }) {
  return (
    <div className={clsx("rounded-xl bg-surface-2 p-3", className)}>
      <div className="text-xs text-muted">{item.label}</div>
      <div className="num mt-1 text-start font-semibold">{item.value}</div>
    </div>
  );
}

/** Key stats: the primary ones are always shown; on mobile the rest sit behind "more". */
export function StatGrid({ primary, more = [] }: { primary: StatItem[]; more?: StatItem[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {primary.map((s) => (
          <Stat key={s.label} item={s} />
        ))}
        {more.map((s) => (
          <Stat key={s.label} item={s} className={open ? undefined : "hidden md:block"} />
        ))}
      </div>
      {more.length > 0 && (
        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex w-full items-center justify-center gap-1 rounded-xl py-2 text-sm text-muted md:hidden"
        >
          {open ? "פחות נתונים" : `עוד ${more.length} נתונים`}
          <ChevronDown className={clsx("h-4 w-4 transition", open && "rotate-180")} />
        </button>
      )}
    </div>
  );
}
