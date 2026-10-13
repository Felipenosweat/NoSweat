import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/Logo";
import { MobileCtaBar } from "@/components/marketing/MobileCtaBar";
import { RevealObserver } from "@/components/marketing/RevealObserver";
import { container, focusRing } from "@/components/marketing/styles";
import "./marketing.css";

const NAV = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#examples", label: "Examples" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#faq", label: "FAQ" },
];

type FooterLink = { href: string; label: string; external?: boolean };

// Rodapé em 4 colunas (brief). Ainda não existem páginas de privacidade/termos: a coluna
// "Legal" só traz o que é verdade hoje, sem links quebrados.
const FOOTER_LINKS: { title: string; links: FooterLink[]; note?: string }[] = [
  {
    title: "Product",
    links: [
      { href: "/#how-it-works", label: "How it works" },
      { href: "/#examples", label: "Examples" },
      { href: "/#pricing", label: "Pricing" },
      { href: "/#faq", label: "FAQ" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/create", label: "Build my website" },
      { href: "/login", label: "Log in" },
      { href: "mailto:hello@nosweatfd.com", label: "hello@nosweatfd.com", external: true },
    ],
  },
  {
    title: "Legal",
    links: [{ href: "mailto:hello@nosweatfd.com", label: "Privacy questions", external: true }],
    note: "Example businesses on this site are fictional.",
  },
  {
    title: "Image credits",
    links: [{ href: "/credits", label: "Photo credits" }],
    note: "Photos from Unsplash and Pexels, credited to each photographer.",
  },
];

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-sm">
        <div className={`${container} flex h-16 items-center justify-between gap-4`}>
          <Logo />
          <nav aria-label="Main" className="hidden items-center gap-8 text-sm lg:flex">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`inline-flex min-h-11 items-center rounded-sm font-medium text-slate-600 transition-colors duration-150 hover:text-ink ${focusRing}`}
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2 text-sm font-semibold sm:gap-3">
            <Link
              href="/login"
              className={`inline-flex h-11 items-center rounded-lg px-3 whitespace-nowrap text-slate-700 transition-colors duration-150 hover:bg-slate-50 hover:text-ink ${focusRing}`}
            >
              Log in
            </Link>
            {/* No celular o CTA do header some: o hero tem o formulário e, depois dele,
                aparece a barra fixa embaixo (um botão azul por tela). */}
            <Link
              href="/create"
              className={`hidden h-11 items-center rounded-lg bg-brand px-4 whitespace-nowrap text-white transition-colors duration-150 hover:bg-brand-dark active:translate-y-px sm:inline-flex ${focusRing}`}
            >
              Build my website
            </Link>
          </div>
        </div>
      </header>

      <main id="main" className="flex-1">
        {children}
      </main>

      <footer className="border-t border-slate-200 bg-surface pb-[calc(5rem+env(safe-area-inset-bottom))] sm:pb-0">
        <div className={`${container} grid gap-10 py-14 lg:grid-cols-12 lg:gap-x-8`}>
          <div className="lg:col-span-4">
            <Logo tagline />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-600">
              Websites for small businesses, built from a sentence and easy to keep up to date.
            </p>
          </div>
          <nav
            aria-label="Footer"
            className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4 lg:col-span-8"
          >
            {FOOTER_LINKS.map((group) => (
              <div key={group.title}>
                <p className="text-sm font-semibold text-ink">{group.title}</p>
                <ul className="mt-2 text-sm">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      {link.external ? (
                        <a
                          href={link.href}
                          className={`inline-flex min-h-11 items-center rounded-sm break-all text-slate-600 transition-colors duration-150 hover:text-ink ${focusRing}`}
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className={`inline-flex min-h-11 items-center rounded-sm text-slate-600 transition-colors duration-150 hover:text-ink ${focusRing}`}
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
                {group.note && (
                  <p className="mt-2 max-w-[28ch] text-[13px] leading-normal text-slate-500">
                    {group.note}
                  </p>
                )}
              </div>
            ))}
          </nav>
        </div>
        <div className="border-t border-slate-200">
          <div
            className={`${container} flex flex-col gap-2 py-6 text-sm text-slate-500 sm:flex-row sm:justify-between`}
          >
            <p>&copy; {new Date().getFullYear()} NoSweat. All rights reserved.</p>
            <p>nosweatfd.com</p>
          </div>
        </div>
      </footer>

      <MobileCtaBar />
      <RevealObserver />
    </div>
  );
}
