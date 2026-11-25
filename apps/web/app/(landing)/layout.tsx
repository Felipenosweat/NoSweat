import type { ReactNode } from "react";
import { IntroCurtain } from "@/components/landing/IntroCurtain";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { MobileCtaBar } from "@/components/marketing/MobileCtaBar";
import { MarketingFooter } from "@/components/marketing/SiteChrome";
import "../(marketing)/marketing.css";
import "./landing.css";

// Landing V12: página branca, tipografia de sistema, cabeçalho fino com o logo no centro (ver
// landing.css). As outras páginas de marketing (preço, termos…) ficam em app/(marketing).

// Roda antes de a cortina aparecer (script no meio do HTML): a abertura só passa uma vez por aba.
// Sem sessionStorage (modo privado, bloqueado), a abertura aparece como antes.
const SKIP_INTRO_SCRIPT =
  "try{var k='ns-intro';if(sessionStorage.getItem(k))document.documentElement.setAttribute('data-lp-seen','');else sessionStorage.setItem(k,'1')}catch(e){}";

export default function LandingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="lp flex min-h-svh flex-col">
      {/* Antes da cortina pintar: na segunda visita da aba, marca a página para pular a abertura. */}
      <script dangerouslySetInnerHTML={{ __html: SKIP_INTRO_SCRIPT }} />
      <IntroCurtain />
      <LandingHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <MarketingFooter />
      <MobileCtaBar />
    </div>
  );
}
