import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/Logo";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav className="flex items-center gap-2 text-sm font-medium sm:gap-6">
            <a href="#how-it-works" className="hidden text-slate-600 hover:text-slate-900 sm:block">
              How it works
            </a>
            <Link href="/dashboard" className="text-slate-600 hover:text-slate-900">
              My sites
            </Link>
            <Link
              href="/create"
              className="rounded-full bg-slate-900 px-4 py-2 text-white transition hover:bg-slate-700"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-slate-200">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:justify-between sm:px-6">
          <p>&copy; {new Date().getFullYear()} No Sweat. Made for small businesses.</p>
          <p>nosweatfd.com</p>
        </div>
      </footer>
    </div>
  );
}
