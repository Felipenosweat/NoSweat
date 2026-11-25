import type { ReactNode } from "react";
import { HERO } from "@/components/landing-after-hours/content";
import { Footer } from "@/components/landing-after-hours/Footer";
import { Header } from "@/components/landing-after-hours/Header";
import { StickyCta } from "@/components/landing-after-hours/StickyCta";
import "./after-hours.css";

// Landing "After hours" (components/landing-after-hours): a loja fecha e o site continua
// recebendo pedidos e marcações. As landings antigas continuam em
// components/landing (sem uso aqui). As outras páginas de marketing ficam em app/(marketing).

export default function LandingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="ah flex min-h-svh flex-col">
      <Header />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
      <StickyCta label={HERO.cta} />
    </div>
  );
}
