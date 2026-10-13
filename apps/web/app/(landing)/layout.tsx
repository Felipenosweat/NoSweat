import type { ReactNode } from "react";
import { LandingMotion } from "@/components/landing/LandingMotion";
import { MobileCtaBar } from "@/components/marketing/MobileCtaBar";
import { MarketingFooter, MarketingHeader } from "@/components/marketing/SiteChrome";
import "../(marketing)/marketing.css";
import "./landing.css";

// Landing V5: tema escuro, rolagem suave e animações (LandingMotion). As outras páginas de
// marketing (preço, termos…) ficam em app/(marketing), no tema claro.
export default function LandingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="l-root flex min-h-svh flex-col">
      <MarketingHeader tone="dark" />
      <main id="main" className="flex-1">
        {children}
      </main>
      <MarketingFooter tone="dark" />
      <MobileCtaBar tone="dark" />
      <LandingMotion />
    </div>
  );
}
