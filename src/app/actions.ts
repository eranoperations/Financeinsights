"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { authConfigured, createSession, currentUser, destroySession } from "@/lib/auth";
import { db } from "@/lib/db";

export interface FormState {
  error?: string;
  ok?: boolean;
}

function safeNext(next: FormDataEntryValue | null): string {
  const s = typeof next === "string" ? next : "";
  return s.startsWith("/") && !s.startsWith("//") ? s : "/portfolio";
}

const AUTH_UNAVAILABLE: FormState = { error: "ההרשמה וההתחברות אינן זמינות כרגע בגלל תקלת הגדרות בשרת" };

function authUnavailable() {
  if (authConfigured()) return false;
  console.error("AUTH_SECRET is not set: sign-up and login are disabled");
  return true;
}

const credentials = z.object({
  email: z.string().trim().toLowerCase().email("כתובת אימייל לא תקינה"),
  password: z.string().min(8, "הסיסמה חייבת להכיל לפחות 8 תווים"),
});

export async function register(_: FormState, form: FormData): Promise<FormState> {
  const parsed = credentials.extend({ name: z.string().trim().max(60).optional() }).safeParse({
    email: form.get("email"),
    password: form.get("password"),
    name: form.get("name") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (authUnavailable()) return AUTH_UNAVAILABLE;
  const { email, password, name } = parsed.data;
  if (await db.user.findUnique({ where: { email } })) return { error: "כבר קיים משתמש עם האימייל הזה" };
  const user = await db.user.create({ data: { email, name, passwordHash: await bcrypt.hash(password, 10) } });
  await createSession(user.id);
  redirect(safeNext(form.get("next")));
}

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const parsed = credentials.safeParse({ email: form.get("email"), password: form.get("password") });
  if (!parsed.success) return { error: "אימייל או סיסמה שגויים" };
  if (authUnavailable()) return AUTH_UNAVAILABLE;
  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    return { error: "אימייל או סיסמה שגויים" };
  }
  await createSession(user.id);
  redirect(safeNext(form.get("next")));
}

export async function logout() {
  await destroySession();
  redirect("/");
}

const symbolSchema = z.string().trim().toUpperCase().min(1).max(20).regex(/^[A-Z0-9.^=\-]+$/);

export async function toggleWatchlist(symbol: string): Promise<{ watching: boolean } | { error: string }> {
  const user = await currentUser();
  if (!user) return { error: "יש להתחבר" };
  const s = symbolSchema.safeParse(symbol);
  if (!s.success) return { error: "סימול לא תקין" };
  const where = { userId_symbol: { userId: user.id, symbol: s.data } };
  const existing = await db.watchlistItem.findUnique({ where });
  if (existing) await db.watchlistItem.delete({ where });
  else await db.watchlistItem.create({ data: { userId: user.id, symbol: s.data } });
  revalidatePath("/watchlist");
  return { watching: !existing };
}

const txnSchema = z.object({
  symbol: symbolSchema,
  type: z.enum(["BUY", "SELL"]),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "תאריך לא תקין")
    .refine((d) => d <= new Date().toISOString().slice(0, 10), "התאריך לא יכול להיות בעתיד"),
  quantity: z.coerce.number().positive("הכמות חייבת להיות חיובית"),
  price: z.coerce.number().positive("המחיר חייב להיות חיובי"),
  fee: z.coerce.number().min(0).default(0),
});

export async function addTransaction(_: FormState, form: FormData): Promise<FormState> {
  const user = await currentUser();
  if (!user) return { error: "יש להתחבר" };
  const parsed = txnSchema.safeParse({
    symbol: form.get("symbol"),
    type: form.get("type"),
    date: form.get("date"),
    quantity: form.get("quantity"),
    price: form.get("price"),
    fee: form.get("fee") || 0,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const t = parsed.data;
  if (t.type === "SELL") {
    const prior = await db.transaction.findMany({
      where: { userId: user.id, symbol: t.symbol, date: { lte: new Date(t.date + "T00:00:00Z") } },
    });
    const held = prior.reduce((s, p) => s + (p.type === "SELL" ? -p.quantity : p.quantity), 0);
    if (t.quantity > held + 1e-9) return { error: `לא ניתן למכור ${t.quantity} יחידות — בתאריך זה מוחזקות ${held}` };
  }
  await db.transaction.create({
    data: { ...t, userId: user.id, date: new Date(t.date + "T00:00:00Z") },
  });
  revalidatePath("/portfolio");
  return { ok: true };
}

export async function deleteTransaction(id: string) {
  const user = await currentUser();
  if (!user) return;
  await db.transaction.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/portfolio");
}
