import type { ReactNode } from "react";
import { signOut } from "@/app/(auth)/login/actions";
import { GlassBackdrop, GlassButton } from "@/components/glass";
import { Logo } from "@/components/Logo";
import { ViewAsBanner } from "@/components/ViewAsBanner";
import { requireAdmin } from "@/server/admin";
import { getViewer } from "@/server/auth/viewer";
import { AdminNav } from "./AdminNav";

/**
 * Painel principal da No Sweat. Só admins (public.platform_admins); para os outros, 404.
 * Barra de vidro grudada no topo (o conteúdo passa por baixo, desfocado) com as abas do painel.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdmin();
  // Modo "ver como" ainda ligado: avisa aqui também (o /dashboard está mostrando a outra conta).
  const viewer = await getViewer();

  return (
    <div className="relative isolate min-h-screen bg-surface text-(--glass-fg)">
      <GlassBackdrop />
      {viewer?.viewingAs && <ViewAsBanner email={viewer.viewingAs.email} />}
      <header className="glass-bar sticky top-0 z-30">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5 sm:px-6 md:flex-nowrap">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            {/* Volta para o painel do cliente (a própria conta), sempre à vista na esquerda. */}
            <GlassButton
              href="/dashboard"
              variant="secondary"
              icon={<span className="text-[1.1em] leading-none">&larr;</span>}
              className="px-3.5 sm:px-4"
            >
              <span className="max-[359px]:sr-only">Dashboard</span>
            </GlassButton>
            <span className="hidden lg:inline-flex">
              <Logo />
            </span>
            <span className="glass-edge rounded-full bg-amber-300/90 px-2.5 py-0.5 text-[11px] font-bold tracking-[0.06em] text-ink">
              ADMIN
            </span>
          </div>

          {/* Celular: as abas descem para a segunda linha (order-last); computador: no meio. */}
          <div className="order-last w-full md:order-none md:flex md:w-auto md:flex-1 md:justify-center">
            <AdminNav />
          </div>

          <form action={signOut} className="ml-auto md:ml-0">
            <GlassButton type="submit" variant="ghost">
              Log out
            </GlassButton>
          </form>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-6xl px-4 pt-8 pb-28 sm:px-6 sm:pt-10 lg:px-8">
        {children}
      </main>
    </div>
  );
}
