import Link from "next/link";
import type { ReactNode } from "react";
import { displayWordSpacing } from "@/components/DashboardUi";
import { Logo } from "@/components/Logo";
import { ViewAsBanner } from "@/components/ViewAsBanner";
import { getSupabaseAuthConfig } from "@/server/auth/config";
import { isAdminUser } from "@/server/admin";
import { getViewer } from "@/server/auth/viewer";
import { getSiteStore } from "@/server/store";
import { DashboardChrome } from "./DashboardChrome";

/** Id do site mais recente da conta (atalho "Messages"). Erro no banco = sem atalho. */
async function latestSiteId(ownerId: string): Promise<string | null> {
  try {
    // `list` já vem do mais recente para o mais antigo.
    const [latest] = await getSiteStore().list(ownerId);
    return latest?.id ?? null;
  } catch {
    return null;
  }
}

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  // Com login desligado (dev local) todo mundo é o DEV_USER: sem e-mail, "Log out" nem "Sign up".
  const authEnabled = getSupabaseAuthConfig() !== null;
  // `viewer.user` é a conta logada; `viewer.ownerId` é de quem são os dados (no modo "ver como"
  // do admin, a conta vista).
  const viewer = await getViewer();
  const currentUser = viewer?.user ?? null;
  const user = authEnabled ? currentUser : null;

  // Visitante sem conta (só com login ligado; pode usar o /create): o mesmo topo de antes, com
  // "Log in" e "Sign up" em vez da conta (sem barra lateral nem abas).
  if (!currentUser) {
    return (
      <div className={`min-h-screen bg-surface ${displayWordSpacing}`}>
        <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-3 px-5 sm:px-8">
            <Logo />
            <nav aria-label="Main" className="flex items-center gap-3 sm:gap-6">
              <Link
                href="/login"
                className="inline-flex min-h-11 items-center text-sm font-semibold whitespace-nowrap text-slate-600 transition-colors duration-150 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="inline-flex min-h-11 items-center rounded-xl bg-brand px-3.5 text-sm font-semibold whitespace-nowrap text-white transition-colors duration-150 hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:translate-y-px sm:min-h-10 sm:px-4"
              >
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

  const [admin, latest] = await Promise.all([
    isAdminUser(currentUser),
    latestSiteId(viewer?.ownerId ?? currentUser.id),
  ]);

  return (
    <DashboardChrome
      admin={admin}
      account={user ? { email: user.email } : null}
      latestSiteId={latest}
      banner={viewer?.viewingAs ? <ViewAsBanner email={viewer.viewingAs.email} /> : null}
    >
      {children}
    </DashboardChrome>
  );
}
