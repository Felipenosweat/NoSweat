"use client";

import { usePathname } from "next/navigation";
import { useState, type MouseEvent } from "react";
import { GlassSegmentedLinks } from "@/components/glass";

// Abas do painel do admin (controle segmentado de vidro). Precisa do endereço atual para marcar
// a aba: a ficha de uma conta (/admin/clients/...) fica em "Accounts". A aba clicada fica marcada
// na hora do clique, sem esperar a página nova chegar do servidor (o esqueleto loading.tsx
// aparece junto).

const SECTIONS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/finance", label: "Finance" },
  { href: "/admin/accounts", label: "Accounts" },
  { href: "/admin/websites", label: "Websites" },
  { href: "/admin/models", label: "Models" },
  { href: "/admin/usage", label: "Usage" },
] as const;

function isCurrent(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  if (href === "/admin/accounts" && pathname.startsWith("/admin/clients")) return true;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNav() {
  const pathname = usePathname() ?? "/admin";
  // Aba clicada enquanto a navegação acontece. Vale só enquanto o endereço for o do clique:
  // quando a página nova chega (ou o admin navega por outro caminho), volta a valer o endereço.
  const [pending, setPending] = useState<{ href: string; from: string } | null>(null);
  const active = pending && pending.from === pathname ? pending.href : pathname;

  // Captura (antes do onClick do Link, que cancela o clique para navegar no cliente). Clique com
  // Ctrl/⌘/Shift ou botão do meio abre outra aba do navegador: não marca nada aqui.
  function onClickCapture(event: MouseEvent<HTMLDivElement>) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    const href = (event.target as Element).closest("a")?.getAttribute("href");
    if (!href || !SECTIONS.some((section) => section.href === href)) return;
    setPending({ href, from: pathname });
  }

  return (
    // Até o computador grande as 6 abas não cabem sem cortar o texto: a faixa rola de lado (o
    // layout põe as abas numa segunda linha até o `lg`).
    <div
      onClickCapture={onClickCapture}
      className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] lg:mx-0 lg:overflow-visible lg:px-0"
    >
      <GlassSegmentedLinks
        aria-label="Admin sections"
        size="sm"
        fullWidth
        className="min-w-[32rem] lg:w-[35rem] [&_a]:min-h-11 lg:[&_a]:min-h-8"
        items={SECTIONS.map((section) => ({
          href: section.href,
          label: section.label,
          current: isCurrent(active, section.href),
        }))}
      />
    </div>
  );
}
