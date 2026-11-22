import Link from "next/link";
import { Logo } from "@/components/Logo";
import { MarketingMenu } from "@/components/marketing/MobileCtaBar";
import { focusRing, shell } from "./ui";

// Cabeçalho da landing "Straight answers": barra branca presa no alto com linha fina embaixo.
// Logo à esquerda; no computador, atalhos para as respostas e o FAQ; à direita "Log in" e o
// botão azul (o único azul da barra). Abaixo de lg, o menu nativo (<details>) leva aos mesmos
// lugares.

const NAV = [
  { href: "/#pricing", label: "Pricing" },
  { href: "/#looks", label: "Examples" },
  { href: "/#clients", label: "Clients" },
  { href: "/#faq", label: "FAQ" },
];

const navBase = `min-h-11 items-center rounded-sm text-sm font-medium text-slate-600 transition-colors duration-150 hover:text-ink ${focusRing}`;
const navLink = `inline-flex ${navBase}`;

export function AnswersHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className={`${shell} flex min-h-16 items-center justify-between gap-4`}>
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-8 lg:flex">
          {NAV.map((item) => (
            <a key={item.href} href={item.href} className={navLink}>
              {item.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2 sm:gap-4">
          <Link href="/login" className={`hidden px-2 sm:inline-flex ${navBase}`}>
            Log in
          </Link>
          <Link
            href="/create"
            className={`inline-flex h-10 items-center rounded-lg bg-brand px-4 text-sm font-semibold whitespace-nowrap text-white transition-colors duration-150 hover:bg-brand-dark active:translate-y-px motion-reduce:active:translate-y-0 ${focusRing}`}
          >
            <span className="sm:hidden">Start</span>
            <span className="hidden sm:inline">Start my website</span>
          </Link>
          <MarketingMenu items={[...NAV, { href: "/login", label: "Log in" }]} />
        </div>
      </div>
    </header>
  );
}
