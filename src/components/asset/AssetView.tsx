"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";

export interface AssetTab {
  id: string;
  label: string;
  content: React.ReactNode;
}

/** Height of the site's sticky header, so our own sticky bar can sit right under it. */
function useHeaderHeight() {
  const [height, setHeight] = useState(0);
  useEffect(() => {
    const header = document.querySelector("body > header");
    if (!header) return;
    const update = () => setHeight(header.getBoundingClientRect().height);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(header);
    return () => ro.disconnect();
  }, []);
  return height;
}

/**
 * Asset page shell. On mobile the sections become tabs under a sticky bar, which also shows a
 * compact quote once the hero has scrolled away. On desktop every section is laid out in order.
 */
export function AssetView({ hero, mini, tabs }: { hero: React.ReactNode; mini: React.ReactNode; tabs: AssetTab[] }) {
  const [active, setActive] = useState(tabs[0]?.id);
  const [heroHidden, setHeroHidden] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const headerHeight = useHeaderHeight();

  // Open the tab named in the URL hash (e.g. /asset/AAPL#financials).
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (tabs.some((t) => t.id === id)) setActive(id);
  }, []);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setHeroHidden(!entry.isIntersecting), {
      rootMargin: `-${Math.round(headerHeight)}px 0px 0px 0px`,
    });
    io.observe(el);
    return () => io.disconnect();
  }, [headerHeight]);

  function select(id: string) {
    setActive(id);
    history.replaceState(null, "", id === tabs[0]?.id ? window.location.pathname : `#${id}`);
    // If we're scrolled past the tab bar, bring the start of the new tab into view.
    const bar = barRef.current;
    if (bar) {
      const anchor = bar.parentElement!.getBoundingClientRect().top + window.scrollY - headerHeight;
      if (window.scrollY > anchor) window.scrollTo({ top: anchor });
    }
  }

  const showTabs = tabs.length > 1;

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <div ref={heroRef}>{hero}</div>

      <div className="flex flex-col gap-6 md:gap-8">
        <div
          ref={barRef}
          style={{ top: headerHeight }}
          className={clsx(
            "sticky z-20 -mx-4 -mb-2 border-b border-line bg-bg/95 px-4 backdrop-blur md:hidden",
            !showTabs && !heroHidden && "hidden",
          )}
        >
          {heroHidden && <div className="pt-2">{mini}</div>}
          {showTabs && (
            <div role="tablist" className="scrollbar-none -mx-1 flex gap-1 overflow-x-auto py-2">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={active === t.id}
                  onClick={() => select(t.id)}
                  className={clsx(
                    "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition",
                    active === t.id ? "bg-accent/15 text-fg" : "text-muted",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {tabs.map((t) => (
          <div key={t.id} role="tabpanel" className={clsx("flex-col gap-6 md:flex md:gap-8", active === t.id ? "flex" : "hidden")}>
            {t.content}
          </div>
        ))}
      </div>
    </div>
  );
}
