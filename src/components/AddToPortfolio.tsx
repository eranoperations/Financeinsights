"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, X } from "lucide-react";
import { TransactionForm } from "./TransactionForm";

export function AddToPortfolio({ symbol, currency, price, loggedIn }: { symbol: string; currency: string; price: number; loggedIn: boolean }) {
  const [open, setOpen] = useState(false);
  if (!loggedIn) {
    return (
      <Link href={`/login?next=${encodeURIComponent(`/asset/${symbol}`)}`} className="btn-primary">
        <Plus className="h-4 w-4" /> הוסף לתיק
      </Link>
    );
  }
  return (
    <>
      <button className="btn-primary" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> הוסף לתיק
      </button>
      {open && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 p-4 sm:items-center" onClick={() => setOpen(false)}>
          <div className="card w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">
                הוספת עסקה — <span className="num">{symbol}</span>
              </h2>
              <button onClick={() => setOpen(false)} aria-label="סגור" className="text-muted hover:text-fg">
                <X className="h-5 w-5" />
              </button>
            </div>
            <TransactionForm symbol={symbol} currency={currency} defaultPrice={price} />
            <Link href="/portfolio" className="mt-3 block text-center text-sm text-accent">
              מעבר לתיק שלי ←
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
