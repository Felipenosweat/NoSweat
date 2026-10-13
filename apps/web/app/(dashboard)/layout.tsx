import Link from "next/link";
import type { ReactNode } from "react";
import { signOut } from "@/app/(auth)/login/actions";
import { Logo } from "@/components/Logo";
import { getSupabaseAuthConfig } from "@/server/auth/config";
import { isAdminUser } from "@/server/admin";
import { getCurrentUser } from "@/server/auth/session";
import { NavLinks } from "./NavLinks";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  // Com login desligado (dev local) não mostra e-mail nem "Log out".
  const user = getSupabaseAuthConfig() ? await getCurrentUser() : null;
  const admin = await isAdminUser(user ?? (await getCurrentUser()));

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-3 px-5 sm:px-8">
          <Logo />
          <nav aria-label="Main" className="flex items-center gap-3 sm:gap-6">
            <NavLinks admin={admin} />
            <Link
              href="/create"
              className="inline-flex h-11 items-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold whitespace-nowrap text-ink transition-colors duration-150 hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:translate-y-px sm:px-4"
            >
              New site
            </Link>
            {user && (
              <form action={signOut} className="flex items-center gap-3">
                <span className="hidden max-w-[22ch] truncate text-sm text-slate-500 md:inline">
                  {user.email}
                </span>
                <button
                  type="submit"
                  className="min-h-11 text-sm font-semibold whitespace-nowrap text-slate-600 transition-colors duration-150 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  Log out
                </button>
              </form>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-[1200px] px-5 pt-8 pb-16 sm:px-8 lg:pt-12 lg:pb-24">
        {children}
      </main>
    </div>
  );
}
