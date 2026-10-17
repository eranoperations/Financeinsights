import Link from "next/link";
import { logout } from "@/app/actions";
import { currentUser } from "@/lib/auth";

export default async function AccountPage() {
  const user = await currentUser();
  if (!user) {
    return (
      <div className="mx-auto max-w-sm space-y-4 text-center">
        <h1 className="text-3xl font-extrabold">חשבון</h1>
        <p className="text-muted">התחברו כדי לשמור רשימת מעקב ולנהל תיק השקעות.</p>
        <div className="flex justify-center gap-2">
          <Link href="/login" className="btn-primary">
            התחברות
          </Link>
          <Link href="/register" className="btn-ghost">
            הרשמה
          </Link>
        </div>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-sm space-y-4">
      <h1 className="text-3xl font-extrabold">חשבון</h1>
      <div className="card space-y-1 p-5">
        {user.name && <div className="text-lg font-semibold">{user.name}</div>}
        <div className="num text-start text-muted">{user.email}</div>
      </div>
      <form action={logout}>
        <button className="btn-ghost w-full">התנתקות</button>
      </form>
    </div>
  );
}
