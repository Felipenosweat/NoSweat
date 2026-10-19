import Link from "next/link";
import type { ReactNode } from "react";
import { signOut } from "@/app/(auth)/login/actions";
import { focusRing } from "@/components/DashboardUi";
import { Logo } from "@/components/Logo";
import { ViewAsBanner } from "@/components/ViewAsBanner";
import { requireAdmin } from "@/server/admin";
import { getViewer } from "@/server/auth/viewer";

// Seções do painel: todas na mesma página (/admin), com âncoras.
const SECTIONS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin#accounts", label: "Accounts" },
  { href: "/admin#websites", label: "Websites" },
  { href: "/admin#usage", label: "Usage" },
];

const navItem = `inline-flex min-h-10 items-center rounded-lg px-2 text-sm sm:px-3 font-semibold whitespace-nowrap text-slate-300 transition-colors duration-150 hover:bg-white/10 hover:text-white ${focusRing}`;

/** Painel principal da No Sweat. Só admins (public.platform_admins); para os outros, 404. */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdmin();
  // Modo "ver como" ainda ligado: avisa aqui também (o /dashboard está mostrando a outra conta).
  const viewer = await getViewer();

  return (
    <div className="min-h-screen bg-surface">
      {viewer?.viewingAs && <ViewAsBanner email={viewer.viewingAs.email} />}
      <header className="bg-ink text-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4 sm:gap-4 sm:px-8">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            {/* Volta para o painel do cliente (a própria conta), sempre à vista na esquerda. */}
            <Link
              href="/dashboard"
              className={`${navItem} gap-1.5 border border-white/15 bg-white/5`}
            >
              <span aria-hidden="true">&larr;</span>
              <span className="max-[360px]:sr-only">Dashboard</span>
            </Link>
            <div className="hidden rounded-lg bg-white px-2 py-1 text-ink sm:block">
              <Logo />
            </div>
            <span className="hidden rounded-full bg-amber-400 px-2.5 py-0.5 text-xs font-bold text-ink min-[420px]:inline">
              ADMIN
            </span>
          </div>
          <div className="flex items-center gap-1">
            <form action={signOut}>
              <button type="submit" className={navItem}>
                Log out
              </button>
            </form>
          </div>
        </div>
        <nav aria-label="Admin" className="mx-auto max-w-6xl overflow-x-auto px-3 pb-2 sm:px-6">
          <ul className="flex gap-1">
            {SECTIONS.map((section) => (
              <li key={section.href}>
                <Link href={section.href} className={navItem}>
                  {section.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">{children}</main>
    </div>
  );
}
