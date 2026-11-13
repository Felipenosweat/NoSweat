import Link from "next/link";
import { Logo } from "@/components/Logo";
import { MarketingMenu } from "@/components/marketing/MobileCtaBar";
import { edgeInner, edgeOuter, focusRing } from "./type";

// Cabeçalho da landing: barra fina na cor da página, na mesma borda das bolhas (logo alinhado
// com os títulos das seções). Logo à esquerda (pedido do fundador), navegação no centro (≥ lg) e
// "Log in" + "Start free" à direita; abaixo de lg entra o menu. "Start free" é uma pílula ink de
// 36 px dentro de um link de 44 px (área de toque). O cabeçalho não tem animação de entrada.

const NAV = [
  { href: "/#what", label: "What you get" },
  { href: "/#story", label: "How it works" },
  { href: "/#looks", label: "Examples" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#faq", label: "FAQ" },
];

// Sem `display` aqui: "Log in" é `hidden` no celular e uma classe inline-flex ganharia dela.
const link = `min-h-11 items-center rounded-sm text-sm font-medium text-slate-600 transition-colors duration-200 hover:text-ink ${focusRing}`;

export function LandingHeader() {
  return (
    <header className={`sticky top-0 z-40 bg-slate-100 ${edgeOuter}`}>
      <div className={`${edgeInner} grid min-h-14 grid-cols-[1fr_auto_1fr] items-center gap-4`}>
        <div className="col-start-1 justify-self-start">
          <Logo />
        </div>
        <nav aria-label="Main" className="col-start-2 hidden items-center gap-7 lg:flex">
          {NAV.map((item) => (
            <a key={item.href} href={item.href} className={`inline-flex ${link}`}>
              {item.label}
            </a>
          ))}
        </nav>
        <div className="col-start-3 flex items-center justify-self-end gap-3 sm:gap-5">
          <Link href="/login" className={`hidden sm:inline-flex ${link}`}>
            Log in
          </Link>
          <Link
            href="/create"
            className={`group inline-flex min-h-11 items-center rounded-full ${focusRing}`}
          >
            <span className="inline-flex h-9 items-center rounded-full bg-ink px-4 text-sm font-semibold whitespace-nowrap text-white transition-colors duration-200 group-hover:bg-black">
              Start free
            </span>
          </Link>
          <MarketingMenu items={[...NAV, { href: "/login", label: "Log in" }]} />
        </div>
      </div>
    </header>
  );
}
