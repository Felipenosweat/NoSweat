import type { ReactNode } from "react";
import { AnswersHeader } from "@/components/landing-answers/AnswersHeader";
import { MobileCtaBar } from "@/components/marketing/MobileCtaBar";
import { MarketingFooter } from "@/components/marketing/SiteChrome";
import "../(marketing)/marketing.css";

// Landing "Straight answers": página branca, cabeçalho preso no alto com linha fina, o rodapé de
// sempre e a barra fixa do celular (some quando o hero ou o CTA final estão na tela). O antigo
// landing.css (V12/V13) não é mais carregado aqui; o arquivo fica para consulta.

export default function LandingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-white text-ink">
      <AnswersHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <MarketingFooter />
      <MobileCtaBar label="Start my website" />
    </div>
  );
}
