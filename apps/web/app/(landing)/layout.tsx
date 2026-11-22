import type { ReactNode } from "react";
import { ShowroomHeader } from "@/components/landing-showroom/ShowroomHeader";
import { MobileCtaBar } from "@/components/marketing/MobileCtaBar";
import { MarketingFooter } from "@/components/marketing/SiteChrome";
import "../(marketing)/marketing.css";

// Landing "Showroom": um bloco ink contínuo do topo até a prancha 07 (sites de exemplo grandes),
// depois a parte branca e prática (escritório, preço, dúvidas). Fontes e cores só da marca.
// As outras páginas de marketing (preço, termos…) ficam em app/(marketing).

export default function LandingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-white font-sans text-ink">
      <ShowroomHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <MarketingFooter />
      <MobileCtaBar label="Start my website" />
    </div>
  );
}
