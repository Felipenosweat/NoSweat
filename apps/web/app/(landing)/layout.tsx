import type { ReactNode } from "react";
import { IntroCurtain } from "@/components/landing/IntroCurtain";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { edgeFlat } from "@/components/landing/type";
import { MobileCtaBar } from "@/components/marketing/MobileCtaBar";
import { MarketingFooter } from "@/components/marketing/SiteChrome";
import "../(marketing)/marketing.css";
import "./landing.css";

// Landing V13 (revisada): fundo slate-100 com bolhas brancas, fontes da marca e uma só borda de
// página do cabeçalho ao rodapé (ver landing.css e components/landing/type.ts). As outras páginas
// de marketing (preço, termos…) ficam em app/(marketing).

// Abertura: uma vez por sessão e nunca com "reduzir movimento". Roda antes da pintura e marca o
// próprio bloco .lp (o pai do script) com data-ns-intro="play"; se o sessionStorage estiver
// bloqueado, não há abertura. O atributo fica no .lp, e não no <html>, porque o React avisa de
// atributo diferente na hidratação: aqui o `suppressHydrationWarning` do bloco cobre só isso.
// O atributo sai depois que a cortina subiu e as entradas do topo terminaram (tirar antes mudaria
// o atraso delas no meio do caminho), para nada tocar de novo.
const INTRO_SCRIPT = `try{var p=document.currentScript.parentElement;if(!matchMedia("(prefers-reduced-motion: reduce)").matches&&!sessionStorage.getItem("ns-intro")){sessionStorage.setItem("ns-intro","1");p.dataset.nsIntro="play";setTimeout(function(){delete p.dataset.nsIntro},2000)}}catch(e){}`;

export default function LandingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="lp flex min-h-svh flex-col" suppressHydrationWarning>
      <script dangerouslySetInnerHTML={{ __html: INTRO_SCRIPT }} />
      <IntroCurtain />
      <LandingHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      {/* Rodapé na mesma borda da página (o padrão dele é o container de 1200 px). */}
      <MarketingFooter containerClass={edgeFlat} />
      <MobileCtaBar />
    </div>
  );
}
