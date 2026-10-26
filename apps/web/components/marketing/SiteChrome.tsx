import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/Logo";
import { MarketingMenu } from "./MobileCtaBar";
import { container, focusRing } from "./styles";

// Header e rodapé do site de marketing, em dois tons: "light" (preço, termos, créditos…) e
// "dark" (o header da landing, sobre o ink do hero e do tour). Mesmos links nos dois.
// Server component: lê SALES_WHATSAPP direto do ambiente (sem a variável, o link não aparece).

type Tone = "light" | "dark";

const NAV = [
  { href: "/#story", label: "How it works" },
  { href: "/#looks", label: "Examples" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#faq", label: "FAQ" },
];

type FooterLink = { href: string; label: string; external?: boolean };

/** Link do WhatsApp de vendas (SALES_WHATSAPP, só dígitos como o wa.me pede) ou `null`. */
export function salesWhatsappUrl(): string | null {
  const digits = process.env.SALES_WHATSAPP?.replace(/\D/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent("Hi! I have a question about No Sweat.")}`;
}

// Rodapé em 4 colunas (brief). Termos e privacidade são rascunhos (ver as próprias páginas).
const FOOTER_LINKS: { title: string; links: FooterLink[]; note?: string }[] = [
  {
    title: "Product",
    links: [
      { href: "/#story", label: "Websites" },
      { href: "/#clients", label: "Clients" },
      { href: "/#social", label: "Instagram posts" },
      { href: "/#looks", label: "Examples" },
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

export function MarketingHeader({
  tone = "light",
  float = false,
  actions,
}: {
  tone?: Tone;
  /** Landing: menu de vidro flutuando sobre a página (fixo, em pílula), em vez da barra. */
  float?: boolean;
  /** Botões extras antes do "Log in" (ex.: o som da landing). */
  actions?: ReactNode;
}) {
  const dark = tone === "dark";
  // No fundo escuro o contorno de foco é branco (o azul da marca some no ink).
  const ring = dark
    ? "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
    : focusRing;
  return (
    <header
      className={
        float
          ? "lp-nav fixed inset-x-3 top-3 z-40 sm:inset-x-5 sm:top-4"
          : `sticky top-0 z-30 border-b backdrop-blur-md ${
              dark ? "border-white/10 bg-ink/75" : "border-slate-200/80 bg-white/90"
            }`
      }
    >
      {/* min-h + flex-wrap: com o texto aumentado (zoom 200%), os itens descem de linha em vez
          de sair da tela. No tamanho normal fica uma linha só de 64px. */}
      <div
        className={
          float
            ? "lp-glass mx-auto flex min-h-14 w-full max-w-[1240px] flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-[1.75rem] py-1.5 pr-1.5 pl-4 sm:pl-5"
            : `${container} flex min-h-16 flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2.5`
        }
      >
        <Logo tone={tone} />
        <nav aria-label="Main" className="hidden flex-wrap items-center gap-x-8 text-sm lg:flex">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`inline-flex min-h-11 items-center rounded-sm font-medium transition-colors duration-150 ${ring} ${
                dark ? "text-slate-300 hover:text-white" : "text-slate-600 hover:text-ink"
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="flex flex-wrap items-center gap-2 text-sm font-semibold sm:gap-3">
          {actions}
          {/* No celular o "Log in" fica dentro do menu (abaixo de sm não cabe tudo numa linha). */}
          <Link
            href="/login"
            className={`hidden h-11 items-center rounded-lg px-3 whitespace-nowrap transition-colors duration-150 sm:inline-flex ${ring} ${
              dark
                ? "text-slate-200 hover:bg-white/10 hover:text-white"
                : "text-slate-700 hover:bg-slate-50 hover:text-ink"
            }`}
          >
            Log in
          </Link>
          {/* No celular o CTA fica compacto ("Start free"): a barra fixa de baixo some durante
              o tour inteiro (#story), então o header precisa ter sempre um caminho para /create. */}
          <Link
            href="/create"
            className={`inline-flex h-10 items-center rounded-lg px-3 whitespace-nowrap transition-colors duration-150 active:translate-y-px sm:h-11 sm:px-4 ${ring} ${
              float
                ? "rounded-full bg-white text-ink hover:bg-slate-200"
                : dark
                  ? "bg-white text-ink hover:bg-slate-200"
                  : "bg-brand text-white hover:bg-brand-dark"
            }`}
          >
            <span className="sm:hidden">Start free</span>
            <span className="hidden sm:inline">Build my website</span>
          </Link>
          {/* Abaixo de lg a navegação principal some; o menu leva às mesmas seções e ao login. */}
          <MarketingMenu tone={tone} items={[...NAV, { href: "/login", label: "Log in" }]} />
        </div>
      </div>
    </header>
  );
}

export function MarketingFooter({ tone = "light" }: { tone?: Tone }) {
  const dark = tone === "dark";
  const whatsapp = salesWhatsappUrl();
  const groups = whatsapp
    ? FOOTER_LINKS.map((group) =>
        group.title === "Company"
          ? {
              ...group,
              links: [
                ...group.links,
                { href: whatsapp, label: "Chat on WhatsApp", external: true },
              ],
            }
          : group,
      )
    : FOOTER_LINKS;
  const link = `inline-flex min-h-11 items-center rounded-sm transition-colors duration-150 ${focusRing} ${
    dark ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-ink"
  }`;
  return (
    <footer
      className={`border-t pb-[calc(5rem+env(safe-area-inset-bottom))] sm:pb-0 ${
        dark ? "border-white/10 bg-ink" : "border-slate-200 bg-surface"
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
          {groups.map((group) => (
            <div key={group.title}>
              <p className={`text-sm font-semibold ${dark ? "text-white" : "text-ink"}`}>
                {group.title}
              </p>
              <ul className="mt-2 text-sm">
                {group.links.map((item) => (
                  <li key={item.label}>
                    {item.external ? (
                      <a
                        href={item.href}
                        className={`${link} break-all`}
                        {...(item.href.startsWith("https://")
                          ? { target: "_blank", rel: "noopener noreferrer" }
                          : {})}
                      >
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
