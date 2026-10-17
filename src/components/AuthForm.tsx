"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login, register, type FormState } from "@/app/actions";

export function AuthForm({ mode, next }: { mode: "login" | "register"; next?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(mode === "login" ? login : register, {});
  const isLogin = mode === "login";
  const query = next ? `?next=${encodeURIComponent(next)}` : "";
  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-2 text-3xl font-extrabold">{isLogin ? "התחברות" : "הרשמה"}</h1>
      <p className="mb-6 text-muted">
        {isLogin ? "התחברו כדי לנהל רשימת מעקב ותיק השקעות" : "צרו חשבון חינמי לניהול רשימת מעקב ותיק השקעות"}
      </p>
      <form action={action} className="card space-y-4 p-5">
        <input type="hidden" name="next" value={next ?? ""} />
        {!isLogin && (
          <label className="block">
            <span className="label">שם (אופציונלי)</span>
            <input name="name" className="input" autoComplete="name" />
          </label>
        )}
        <label className="block">
          <span className="label">אימייל</span>
          <input name="email" type="email" dir="ltr" className="input" autoComplete="email" required />
        </label>
        <label className="block">
          <span className="label">סיסמה</span>
          <input
            name="password"
            type="password"
            dir="ltr"
            className="input"
            autoComplete={isLogin ? "current-password" : "new-password"}
            minLength={8}
            required
          />
        </label>
        {state.error && <p className="text-sm text-down">{state.error}</p>}
        <button className="btn-primary w-full" disabled={pending}>
          {pending ? "רגע..." : isLogin ? "התחברות" : "יצירת חשבון"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-muted">
        {isLogin ? (
          <>
            אין לכם חשבון?{" "}
            <Link href={`/register${query}`} className="text-accent">
              הרשמה
            </Link>
          </>
        ) : (
          <>
            כבר רשומים?{" "}
            <Link href={`/login${query}`} className="text-accent">
              התחברות
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
