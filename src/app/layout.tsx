import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import "./globals.css";

const heebo = Heebo({ subsets: ["hebrew", "latin"], variable: "--font-heebo" });

export const metadata: Metadata = {
  title: "FinanceHub — תובנות פיננסיות",
  description: "חיפוש מניות ותעודות סל, נתונים פיננסיים, רשימת מעקב וניהול תיק השקעות",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={heebo.variable}>
      <body className="min-h-screen font-sans antialiased">
        <Header />
        <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 md:pb-12">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
