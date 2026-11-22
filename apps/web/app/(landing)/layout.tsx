import type { ReactNode } from "react";
import { LiveFooter } from "@/components/landing-live/LiveFooter";
import { LiveMobileBar } from "@/components/landing-live/LiveMobileBar";
import "@/components/landing-live/live.css";

// Landing "Live" (versão D): o cabeçalho fica dentro do herói azul (components/landing-live/
// LiveHero.tsx), então o layout só tem o conteúdo, o rodapé e a barra fixa do celular.
// Os componentes das versões antigas (components/landing, marketing.css, landing.css) continuam
// no repositório, mas esta rota não os carrega mais.

export default function LandingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="live flex min-h-svh flex-col">
      <main id="main" className="flex-1">
        {children}
      </main>
      <LiveFooter />
      <LiveMobileBar />
    </div>
  );
}
