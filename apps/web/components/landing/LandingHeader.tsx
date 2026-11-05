import Link from "next/link";
import { Logo } from "@/components/Logo";
import { MarketingMenu } from "@/components/marketing/MobileCtaBar";

// Cabeçalho da landing: barra fina e translúcida com o logo no canto esquerdo (como no avea.studio,
// pedido do fundador), a navegação no centro e o login + "Start free" à direita (no celular, o
// logo à esquerda e o botão e o menu à direita).

const NAV = [
  { href: "/#what", label: "What you get" },
  { href: "/#story", label: "How it works" },
  { href: "/#looks", label: "Examples" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#faq", label: "FAQ" },
];

const link =
  "rounded-sm py-1.5 text-[13px] text-[#071b33]/80 transition-colors duration-200 hover:text-[#071b33] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0066ff]";

export function LandingHeader() {
  return (
    <header className="lp-nav sticky top-0 z-40 border-b border-black/10 bg-[rgb(251_251_253/0.8)] backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto grid min-h-14 w-full max-w-[1240px] grid-cols-[1fr_auto_1fr] items-center gap-4 px-5 sm:px-8">
        <div className="col-start-1 justify-self-start">
          <Logo />
        </div>
        <nav aria-label="Main" className="col-start-2 hidden items-center gap-7 lg:flex">
          {NAV.map((item) => (
            <a key={item.href} href={item.href} className={link}>
              {item.label}
            </a>
          ))}
        </nav>
        <div className="col-start-3 flex items-center justify-self-end gap-3 sm:gap-5">
          <Link href="/login" className={`hidden sm:inline-flex ${link}`}>
            Log in
          </Link>
          <Link href="/create" className={`inline-flex whitespace-nowrap ${link}`}>
            Start free
          </Link>
          <MarketingMenu items={[...NAV, { href: "/login", label: "Log in" }]} />
        </div>
      </div>
    </header>
  );
}
