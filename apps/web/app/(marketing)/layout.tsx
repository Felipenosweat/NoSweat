import type { ReactNode } from "react";
import { MobileCtaBar } from "@/components/marketing/MobileCtaBar";
import { RevealObserver } from "@/components/marketing/RevealObserver";
import { MarketingFooter } from "@/components/marketing/SiteChrome";
import { LandingHeader } from "@/components/landing/LandingHeader";
import "./marketing.css";

// Páginas claras do marketing: preço, créditos, termos, privacidade, descadastro.
// A landing ("/") fica em app/(landing); as duas usam o mesmo cabeçalho (LandingHeader).
export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <LandingHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <MarketingFooter />
      <MobileCtaBar />
      <RevealObserver />
    </div>
  );
}
