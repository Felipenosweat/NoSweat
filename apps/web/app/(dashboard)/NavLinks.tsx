"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Links de navegação do painel. Componente de cliente só para saber a rota atual (aria-current).
const linkClass =
  "relative inline-flex h-16 items-center text-sm font-semibold text-slate-600 transition-colors duration-150 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand aria-[current=page]:text-ink aria-[current=page]:after:absolute aria-[current=page]:after:inset-x-0 aria-[current=page]:after:-bottom-px aria-[current=page]:after:h-0.5 aria-[current=page]:after:bg-brand";

export function NavLinks({ admin }: { admin: boolean }) {
  const pathname = usePathname();
  const current = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`) ? "page" : undefined;

  return (
    <>
      {admin && (
        <Link href="/admin" aria-current={current("/admin")} className={linkClass}>
          <span className="rounded-lg border border-slate-300 px-1.5 py-0.5 text-xs font-semibold">
            Admin
          </span>
        </Link>
      )}
      <Link href="/dashboard" aria-current={current("/dashboard")} className={linkClass}>
        My sites
      </Link>
    </>
  );
}
