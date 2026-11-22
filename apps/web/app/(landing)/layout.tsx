import type { ReactNode } from "react";
import { YourNameHeader } from "@/components/landing-your-name/Header";
import { YourNameProvider } from "@/components/landing-your-name/YourNameContext";
import { MobileCtaBar } from "@/components/marketing/MobileCtaBar";
import { MarketingFooter } from "@/components/marketing/SiteChrome";
import "../(marketing)/marketing.css";
import "@/components/landing-your-name/your-name.css";

// Landing "Your name on it": página branca com as fontes e cores da marca. O visitante digita o
// nome da empresa e a prévia de verdade (<SiteRenderer>) repinta com ele. O provedor guarda o
// nome digitado para o topo, os estilos, os títulos e os botões "Start my website".
// A versão anterior (components/landing, landing.css) continua no repositório, fora de uso.
// As outras páginas de marketing (preço, termos…) ficam em app/(marketing).

export default function LandingLayout({ children }: { children: ReactNode }) {
  return (
    <YourNameProvider>
      <div className="flex min-h-svh flex-col bg-white">
        <YourNameHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <MarketingFooter />
        <MobileCtaBar label="Start my website" />
      </div>
    </YourNameProvider>
  );
}
