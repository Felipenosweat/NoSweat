import type { ReactNode } from "react";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { MobileCtaBar } from "@/components/marketing/MobileCtaBar";
import { MarketingFooter } from "@/components/marketing/SiteChrome";
import "../(marketing)/marketing.css";
import "./landing.css";

// Landing (redesenho de 2026-11): página branca, Inter no texto e Plus Jakarta Sans nos títulos,
// o mesmo cabeçalho de /pricing. Sem abertura animada: o título (h1) aparece parado no primeiro
// quadro. As outras páginas de marketing (preço, termos…) ficam em app/(marketing).

export default function LandingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="lp flex min-h-svh flex-col bg-white font-sans text-ink">
      <LandingHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <MarketingFooter />
      <MobileCtaBar />
    </div>
  );
}
