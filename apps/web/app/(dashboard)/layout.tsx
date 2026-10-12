import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/Logo";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav className="flex items-center gap-4 text-sm font-medium">
            <Link href="/dashboard" className="text-slate-600 hover:text-slate-900">
              My sites
            </Link>
            <Link
              href="/create"
              className="rounded-full bg-slate-900 px-4 py-2 text-white transition hover:bg-slate-700"
            >
              New site
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16">{children}</main>
    </div>
  );
}
