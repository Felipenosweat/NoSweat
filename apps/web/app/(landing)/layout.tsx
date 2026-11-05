import type { ReactNode } from "react";
import { IntroCurtain } from "@/components/landing/IntroCurtain";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { MobileCtaBar } from "@/components/marketing/MobileCtaBar";
import { MarketingFooter } from "@/components/marketing/SiteChrome";
import "../(marketing)/marketing.css";
import "./landing.css";

// Landing V12: página branca, tipografia de sistema, cabeçalho fino com o logo no centro (ver
// landing.css). As outras páginas de marketing (preço, termos…) ficam em app/(marketing).

export default function LandingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="lp flex min-h-svh flex-col">
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
