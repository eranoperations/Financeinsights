"use client";

import { Children, useEffect, useRef, useState } from "react";
import clsx from "clsx";

/**
 * Swipeable row of cards with position dots on mobile; a two-column grid from `lg` up.
 */
export function Carousel({ children }: { children: React.ReactNode }) {
  const items = Children.toArray(children);
  const ref = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    // Intersection, not scrollLeft, so it works the same in RTL.
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setCurrent(Number((e.target as HTMLElement).dataset.index));
        }
      },
      { root, threshold: 0.6 },
    );
    for (const child of Array.from(root.children)) io.observe(child);
    return () => io.disconnect();
  }, [items.length]);

  function go(i: number) {
    const el = ref.current?.children[i] as HTMLElement | undefined;
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }

  return (
    <div>
      <div
        ref={ref}
        className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 lg:mx-0 lg:grid lg:grid-cols-2 lg:overflow-visible lg:px-0"
      >
        {items.map((child, i) => (
          <div key={i} data-index={i} className="w-[88%] shrink-0 snap-center lg:w-auto">
            {child}
          </div>
        ))}
      </div>
      {items.length > 1 && (
        <div className="mt-2 flex justify-center lg:hidden">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              aria-label={`גרף ${i + 1} מתוך ${items.length}`}
              className="p-1"
            >
              <span className={clsx("block h-1.5 rounded-full transition-all", i === current ? "w-5 bg-accent" : "w-1.5 bg-line")} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
