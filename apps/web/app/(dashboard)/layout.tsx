import Link from "next/link";
import type { ReactNode } from "react";
import { glassButtonClass } from "@/components/glass";
import { Logo } from "@/components/Logo";
import { getViewer } from "@/server/auth/viewer";
import { AccountShell } from "./AccountShell";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  // `viewer.user` é a conta logada; `viewer.ownerId` é de quem são os dados (no modo "ver como"
  // do admin, a conta vista).
  const viewer = await getViewer();

  // Visitante sem conta (só com login ligado; pode usar o /create): barra de vidro no topo, com
  // "Log in" e "Sign up" em vez da conta (sem barra lateral nem abas).
  if (!viewer) {
    return (
      <div className="min-h-screen bg-surface">
        <header className="glass-bar sticky top-0 z-30">
          <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-3 px-5 sm:px-8">
            <Logo />
            <nav aria-label="Main" className="flex items-center gap-3 sm:gap-6">
              <Link
                href="/login"
                className="inline-flex min-h-11 items-center text-sm font-semibold whitespace-nowrap text-slate-600 transition-colors duration-150 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                Log in
              </Link>
              <Link href="/signup" className={glassButtonClass({ variant: "primary" })}>
                Sign up
              </Link>
            </nav>
          </div>
        </header>
        <main
          id="main"
          className="mx-auto max-w-[1200px] px-5 pt-8 pb-16 sm:px-8 lg:pt-12 lg:pb-24"
        >
          {children}
        </main>
      </div>
    );
  }

  return <AccountShell viewer={viewer}>{children}</AccountShell>;
}
