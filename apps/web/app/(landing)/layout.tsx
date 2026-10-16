import { existsSync } from "node:fs";
import path from "node:path";
import type { ReactNode } from "react";
import { SoundToggle } from "@/components/landing/SoundToggle";
import { MobileCtaBar } from "@/components/marketing/MobileCtaBar";
import { MarketingFooter, MarketingHeader } from "@/components/marketing/SiteChrome";
import "../(marketing)/marketing.css";
import "./landing.css";

// Landing V6: hero e tour (#story) sobre ink, depois as seções claras (preço, dúvidas, CTA).
// O movimento do tour é do ScrollStage (components/landing/story). As outras páginas de
// marketing (preço, termos…) ficam em app/(marketing), no tema claro.

// O botão de música só aparece quando o arquivo da trilha existir em public/ (o cwd do Next
// é apps/web).
const hasTheme = existsSync(path.join(process.cwd(), "public/landing/audio/theme.mp3"));

export default function LandingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-white">
      <MarketingHeader tone="dark" actions={hasTheme ? <SoundToggle /> : undefined} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <MarketingFooter tone="light" />
      <MobileCtaBar tone="dark" />
    </div>
  );
}
