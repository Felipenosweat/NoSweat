import Link from "next/link";
import { Logo } from "@/components/Logo";
import { container, focusRing } from "./styles";

// Header e rodapé do site de marketing, em dois tons: "light" (preço, termos, créditos…) e
// "dark" (a landing V5, fundo escuro). Mesmos links nos dois.

type Tone = "light" | "dark";

const NAV = [
  { href: "/#build", label: "How it works" },
  { href: "/#examples", label: "Examples" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#faq", label: "FAQ" },
];

type FooterLink = { href: string; label: string; external?: boolean };

// Rodapé em 4 colunas (brief). Termos e privacidade são rascunhos (ver as próprias páginas).
const FOOTER_LINKS: { title: string; links: FooterLink[]; note?: string }[] = [
  {
    title: "Product",
    links: [
      { href: "/#build", label: "Websites" },
      { href: "/#clients", label: "Clients" },
      { href: "/#social", label: "Instagram posts" },
      { href: "/#examples", label: "Examples" },
      { href: "/pricing", label: "Pricing" },
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
    links: [
      { href: "/terms", label: "Terms of Service" },
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/data-deletion", label: "Data deletion" },
    ],
    note: "Example businesses on this site are fictional.",
  },
  {
    title: "Image credits",
    links: [{ href: "/credits", label: "Photo credits" }],
    note: "Photos from Unsplash and Pexels, credited to each photographer.",
  },
];

export function MarketingHeader({ tone = "light" }: { tone?: Tone }) {
  const dark = tone === "dark";
  return (
    <header
      className={`sticky top-0 z-30 border-b backdrop-blur-md ${
        dark ? "border-white/10 bg-[#040d1c]/70" : "border-slate-200/80 bg-white/90"
      }`}
    >
      {/* min-h + flex-wrap: com o texto aumentado (zoom 200%), os itens descem de linha em vez
          de sair da tela. No tamanho normal fica uma linha só de 64px. */}
      <div
        className={`${container} flex min-h-16 flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2.5`}
      >
        <Logo tone={tone} />
        <nav aria-label="Main" className="hidden flex-wrap items-center gap-x-8 text-sm lg:flex">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`inline-flex min-h-11 items-center rounded-sm font-medium transition-colors duration-150 ${focusRing} ${
                dark ? "text-slate-300 hover:text-white" : "text-slate-600 hover:text-ink"
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="flex flex-wrap items-center gap-2 text-sm font-semibold sm:gap-3">
          <Link
            href="/login"
            className={`inline-flex h-11 items-center rounded-lg px-3 whitespace-nowrap transition-colors duration-150 ${focusRing} ${
              dark
                ? "text-slate-200 hover:bg-white/10 hover:text-white"
                : "text-slate-700 hover:bg-slate-50 hover:text-ink"
            }`}
          >
            Log in
          </Link>
          {/* No celular o CTA do header some: o hero tem o formulário e, depois dele,
              aparece a barra fixa embaixo (um botão azul por tela). */}
          <Link
            href="/create"
            className={`hidden h-11 items-center rounded-lg px-4 whitespace-nowrap transition-colors duration-150 active:translate-y-px sm:inline-flex ${focusRing} ${
              dark
                ? "bg-white text-ink hover:bg-slate-200"
                : "bg-brand text-white hover:bg-brand-dark"
            }`}
          >
            Build my website
          </Link>
        </div>
      </div>
    </header>
  );
}

export function MarketingFooter({ tone = "light" }: { tone?: Tone }) {
  const dark = tone === "dark";
  const link = `inline-flex min-h-11 items-center rounded-sm transition-colors duration-150 ${focusRing} ${
    dark ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-ink"
  }`;
  return (
    <footer
      className={`border-t pb-[calc(5rem+env(safe-area-inset-bottom))] sm:pb-0 ${
        dark ? "border-white/10 bg-[#030a16]" : "border-slate-200 bg-surface"
      }`}
    >
      <div className={`${container} grid gap-10 py-14 lg:grid-cols-12 lg:gap-x-8`}>
        <div className="lg:col-span-4">
          <Logo tagline tone={tone} />
          <p
            className={`mt-4 max-w-xs text-sm leading-relaxed ${dark ? "text-slate-400" : "text-slate-600"}`}
          >
            Websites for small businesses, built from a sentence and easy to keep up to date.
          </p>
        </div>
        <nav
          aria-label="Footer"
          className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4 lg:col-span-8"
        >
          {FOOTER_LINKS.map((group) => (
            <div key={group.title}>
              <p className={`text-sm font-semibold ${dark ? "text-white" : "text-ink"}`}>
                {group.title}
              </p>
              <ul className="mt-2 text-sm">
                {group.links.map((item) => (
                  <li key={item.label}>
                    {item.external ? (
                      <a href={item.href} className={`${link} break-all`}>
                        {item.label}
                      </a>
                    ) : (
                      <Link href={item.href} className={link}>
                        {item.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
              {group.note && (
                <p
                  className={`mt-2 max-w-[28ch] text-[13px] leading-normal ${dark ? "text-slate-400" : "text-slate-500"}`}
                >
                  {group.note}
                </p>
              )}
            </div>
          ))}
        </nav>
      </div>
      <div className={`border-t ${dark ? "border-white/10" : "border-slate-200"}`}>
        <div
          className={`${container} flex flex-col gap-2 py-6 text-sm sm:flex-row sm:justify-between ${dark ? "text-slate-400" : "text-slate-500"}`}
        >
          <p>&copy; {new Date().getFullYear()} No Sweat. All rights reserved.</p>
          <p>nosweatfd.com</p>
        </div>
      </div>
    </footer>
  );
}
