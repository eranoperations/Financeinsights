"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { toggleWatchlist } from "@/app/actions";

export function WatchButton({ symbol, initial, loggedIn }: { symbol: string; initial: boolean; loggedIn: boolean }) {
  const [watching, setWatching] = useState(initial);
  const [pending, start] = useTransition();
  const router = useRouter();

  return (
    <button
      className="btn-ghost"
      disabled={pending}
      onClick={() => {
        if (!loggedIn) {
          router.push(`/login?next=${encodeURIComponent(`/asset/${symbol}`)}`);
          return;
        }
        start(async () => {
          const res = await toggleWatchlist(symbol);
          if ("watching" in res) setWatching(res.watching);
        });
      }}
    >
      <Star className={watching ? "h-4 w-4 fill-amber-400 text-amber-400" : "h-4 w-4"} />
      {watching ? "ברשימת המעקב" : "הוסף למעקב"}
    </button>
  );
}
