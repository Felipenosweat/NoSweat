import type { ReactNode } from "react";
import { HERO } from "@/components/landing-on-the-job/content";
import { Footer } from "@/components/landing-on-the-job/Footer";
import { Header } from "@/components/landing-on-the-job/Header";
import { StickyCta } from "@/components/landing-on-the-job/StickyCta";
import "./on-the-job.css";

// Landing "On the job" (components/landing-on-the-job): fotos documentais de donos de pequenos
// negócios trabalhando e o pedido chegando no celular deles. As landings antigas continuam em
// components/landing (sem uso aqui). As outras páginas de marketing ficam em app/(marketing).

export default function LandingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="otj flex min-h-svh flex-col">
      <Header />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
      <StickyCta label={HERO.cta} />
    </div>
  );
}
