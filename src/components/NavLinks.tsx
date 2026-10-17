"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Briefcase, Star, User } from "lucide-react";
import clsx from "clsx";
import { NAV_ITEMS } from "./nav";

const ICONS = { insights: BarChart3, watchlist: Star, portfolio: Briefcase, account: User };

function useActive() {
  const path = usePathname();
  return (href: string) => path === href || path.startsWith(href + "/") || (href === "/insights" && path.startsWith("/asset"));
}

export function NavLinks({ className }: { className?: string }) {
  const isActive = useActive();
  return (
    <nav className={clsx("gap-1", className)}>
      {NAV_ITEMS.filter((i) => i.href !== "/account").map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={clsx(
            "rounded-full px-3 py-1.5 text-sm font-medium transition",
            isActive(item.href) ? "bg-surface-2 text-fg" : "text-muted hover:text-fg",
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export function BottomNavLinks() {
  const isActive = useActive();
  return (
    <>
      {NAV_ITEMS.map((item) => {
        const Icon = ICONS[item.icon];
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              "flex flex-1 flex-col items-center gap-1 rounded-full py-2 text-xs font-medium",
              active ? "bg-accent/15 text-fg" : "text-muted",
            )}
          >
            <Icon className={clsx("h-5 w-5", active && "text-accent")} />
            {item.label}
          </Link>
        );
      })}
    </>
  );
}
