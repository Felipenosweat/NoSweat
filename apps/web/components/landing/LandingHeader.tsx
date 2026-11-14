import Link from "next/link";
import { Logo } from "@/components/Logo";
import { MarketingMenu } from "@/components/marketing/MobileCtaBar";
import { focusRingOnInk, shell } from "./type";

// Cabeçalho da landing: barra ink com texto branco, fixa no topo da página inteira. Logo à
// esquerda (variante para fundo escuro do Logo.tsx), navegação no centro (≥ lg) e "Log in" +
// "Start free" à direita; abaixo de lg entra o menu. Sobre o topo (também ink) a barra não tem
// borda; depois que a página rola, ganha um fio claro embaixo (.lp-header em landing.css).

const NAV = [
  { href: "/#what", label: "What you get" },
  { href: "/#story", label: "How it works" },
  { href: "/#looks", label: "Examples" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#faq", label: "FAQ" },
];

// Sem `display` aqui: "Log in" é `hidden` no celular e uma classe inline-flex ganharia dela.
const link = `min-h-11 items-center rounded-sm text-[15px] font-medium text-slate-300 transition-colors duration-200 hover:text-white ${focusRingOnInk}`;

export function LandingHeader() {
  return (
    <header className="lp-header sticky top-0 z-40 bg-ink text-white">
      <div className={`${shell} grid min-h-16 grid-cols-[1fr_auto_1fr] items-center gap-4`}>
        <div className="col-start-1 justify-self-start">
          <Logo tone="dark" />
        </div>
        <nav aria-label="Main" className="col-start-2 hidden items-center gap-7 lg:flex">
          {NAV.map((item) => (
            <a key={item.href} href={item.href} className={`inline-flex ${link}`}>
              {item.label}
            </a>
          ))}
        </nav>
        <div className="col-start-3 flex items-center justify-self-end gap-2 sm:gap-5">
          <Link href="/login" className={`hidden sm:inline-flex ${link}`}>
            Log in
          </Link>
          <Link
            href="/create"
            className={`inline-flex h-11 items-center rounded-full bg-white px-5 text-[15px] font-semibold whitespace-nowrap text-ink transition-colors duration-200 hover:bg-slate-200 ${focusRingOnInk}`}
          >
            Start free
          </Link>
          <MarketingMenu tone="dark" items={[...NAV, { href: "/login", label: "Log in" }]} />
        </div>
      </div>
    </header>
  );
}
