import Link from "next/link";
import { Logo } from "@/components/Logo";
import { MarketingMenu } from "@/components/marketing/MobileCtaBar";
import { focusRing } from "@/components/marketing/styles";
import { StartLink } from "./YourNameContext";

// Cabeçalho da landing "Your name on it": barra branca presa no alto, logo à esquerda, quatro
// âncoras no meio (só a partir de lg) e "Log in" + o botão azul compacto à direita. No celular:
// logo, botão e menu.

export const NAV = [
  { href: "/#styles", label: "Styles" },
  { href: "/#office", label: "The office" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#faq", label: "FAQ" },
];

const link = `inline-flex min-h-11 items-center rounded-sm text-[15px] font-medium text-slate-600 transition-colors duration-150 hover:text-ink ${focusRing}`;

export function YourNameHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center gap-4 px-5 sm:px-8">
        <Logo />
        <nav aria-label="Main" className="ml-10 hidden items-center gap-8 lg:flex">
          {NAV.map((item) => (
            <a key={item.href} href={item.href} className={link}>
              {item.label}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2 sm:gap-5">
          <Link href="/login" className={`hidden sm:inline-flex ${link}`}>
            Log in
          </Link>
          <StartLink
            className={`hidden h-11 items-center justify-center rounded-lg bg-brand px-4 text-sm font-semibold whitespace-nowrap text-white transition-colors duration-150 hover:bg-brand-dark sm:inline-flex ${focusRing}`}
          >
            Start my website
          </StartLink>
          <MarketingMenu items={[...NAV, { href: "/login", label: "Log in" }]} />
        </div>
      </div>
    </header>
  );
}
