import type { ReactNode } from "react";
import { MobileCtaBar } from "@/components/marketing/MobileCtaBar";
import { RevealObserver } from "@/components/marketing/RevealObserver";
import { MarketingFooter, MarketingHeader } from "@/components/marketing/SiteChrome";
import "./marketing.css";

// Páginas claras do marketing: preço, créditos, termos, privacidade, descadastro.
// A landing ("/") fica em app/(landing), com o tema escuro da V5.
export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <MarketingHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <MarketingFooter />
      <MobileCtaBar />
      <RevealObserver />
    </div>
  );
}
