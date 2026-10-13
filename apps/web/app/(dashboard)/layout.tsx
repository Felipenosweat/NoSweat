import Link from "next/link";
import type { ReactNode } from "react";
import { signOut } from "@/app/(auth)/login/actions";
import { Logo } from "@/components/Logo";
import { getSupabaseAuthConfig } from "@/server/auth/config";
import { isAdminUser } from "@/server/admin";
import { getCurrentUser } from "@/server/auth/session";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  // Com login desligado (dev local) não mostra e-mail nem "Log out".
  const user = getSupabaseAuthConfig() ? await getCurrentUser() : null;
  const admin = await isAdminUser(user ?? (await getCurrentUser()));

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav className="flex items-center gap-4 text-sm font-medium">
            {admin && (
              <Link href="/admin" className="font-semibold text-amber-700 hover:text-amber-900">
                Admin
              </Link>
            )}
            <Link href="/dashboard" className="text-slate-600 hover:text-slate-900">
              My sites
            </Link>
            <Link
              href="/create"
              className="rounded-full bg-slate-900 px-4 py-2 text-white transition hover:bg-slate-700"
            >
              New site
            </Link>
            {user && (
              <form
                action={signOut}
                className="flex items-center gap-3 border-l border-slate-200 pl-4"
              >
                <span className="hidden text-slate-500 sm:inline">{user.email}</span>
                <button type="submit" className="text-slate-600 hover:text-slate-900">
                  Log out
                </button>
              </form>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16">{children}</main>
    </div>
  );
}
