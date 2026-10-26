import { existsSync } from "node:fs";
import path from "node:path";
import type { ReactNode } from "react";
import { SoundToggle } from "@/components/landing/SoundToggle";
import { MobileCtaBar } from "@/components/marketing/MobileCtaBar";
import { MarketingFooter, MarketingHeader } from "@/components/marketing/SiteChrome";
import "../(marketing)/marketing.css";
import "./landing.css";

// Landing V8 ("Signature", o mesmo padrão dos sites premium dos clientes): ink e papel, títulos
// em serifa editorial, menu de vidro flutuando, fotos de verdade dos sites de exemplo e
// movimento do LandingMotion (components/landing). Sem degradê de cor.
// As outras páginas de marketing (preço, termos…) ficam em app/(marketing), no tema claro.

// A serifa dos títulos da landing (Instrument Serif, com itálico) é a do par "editorial" de
// app/fonts.ts (uma declaração só; landing.css usa a variável dela em --font-lp-serif).

// O botão de música só aparece quando o arquivo da trilha existir em public/ (o cwd do Next
// é apps/web).
const hasTheme = existsSync(path.join(process.cwd(), "public/landing/audio/theme.mp3"));

export default function LandingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="lp flex min-h-svh flex-col">
      <MarketingHeader tone="dark" float actions={hasTheme ? <SoundToggle /> : undefined} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <MarketingFooter tone="dark" />
      <MobileCtaBar tone="dark" />
    </div>
  );
}
