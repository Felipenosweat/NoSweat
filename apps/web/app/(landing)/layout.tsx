import type { ReactNode } from "react";
import { IntroCurtain } from "@/components/landing/IntroCurtain";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { MobileCtaBar } from "@/components/marketing/MobileCtaBar";
import { MarketingFooter } from "@/components/marketing/SiteChrome";
import "../(marketing)/marketing.css";
import "./landing.css";

// Landing V12: página branca, tipografia de sistema, cabeçalho fino com o logo no centro (ver
// landing.css). As outras páginas de marketing (preço, termos…) ficam em app/(marketing).

// Abertura: uma vez por sessão e nunca com "reduzir movimento". Roda antes da pintura; se o
// sessionStorage estiver bloqueado, não há abertura. O atributo sai depois que a cortina subiu e
// as entradas do topo terminaram (tirar antes mudaria o atraso delas no meio do caminho), para a
// cortina não tocar de novo quando a pessoa volta para a landing sem recarregar.
const INTRO_SCRIPT = `try{if(!matchMedia("(prefers-reduced-motion: reduce)").matches&&!sessionStorage.getItem("ns-intro")){sessionStorage.setItem("ns-intro","1");var d=document.documentElement;d.dataset.nsIntro="play";setTimeout(function(){delete d.dataset.nsIntro},2000)}}catch(e){}`;

export default function LandingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="lp flex min-h-svh flex-col">
      <script dangerouslySetInnerHTML={{ __html: INTRO_SCRIPT }} />
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
