"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteTransaction } from "@/app/actions";

export function DeleteTxnButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      aria-label="מחיקת עסקה"
      disabled={pending}
      className="text-muted hover:text-down disabled:opacity-40"
      onClick={() => {
        if (confirm("למחוק את העסקה?")) start(() => deleteTransaction(id));
      }}
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
