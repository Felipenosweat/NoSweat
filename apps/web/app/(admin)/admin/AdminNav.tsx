"use client";

import { usePathname } from "next/navigation";
import { GlassSegmentedLinks } from "@/components/glass";

// Abas do painel do admin (controle segmentado de vidro). Precisa do endereço atual para marcar
// a aba: a ficha de uma conta (/admin/clients/...) fica em "Accounts".

const SECTIONS = [
  { href: "/admin", label: "Overview" },
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
  return (
    // No celular as 5 abas não cabem sem cortar o texto: a faixa rola de lado.
    <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:overflow-visible md:px-0">
      <GlassSegmentedLinks
        aria-label="Admin sections"
        size="sm"
        fullWidth
        className="min-w-[27rem] md:w-[30rem] [&_a]:min-h-11 md:[&_a]:min-h-8"
        items={SECTIONS.map((section) => ({
          href: section.href,
          label: section.label,
          current: isCurrent(pathname, section.href),
        }))}
      />
    </div>
  );
}
