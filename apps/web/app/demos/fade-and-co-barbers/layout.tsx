import type { Metadata, Viewport } from "next";
import { Anybody, Hanken_Grotesk } from "next/font/google";
import type { ReactNode } from "react";
import "./fade.css";

// Demonstração "Fade & Co. Barbers": site feito à mão (não é um SiteSpec) na direção
// kinetic-type (a letra é a imagem). Barbearia FICTÍCIA; fatos do site-modelo da biblioteca
// (packages/fixtures/src/library/fade-and-co-barbers.ts). Fora do Google (noindex).
// Fontes só desta página: Anybody (variável, eixos de peso 100–900 e largura 50–150, a única
// voz de display, usada em movimento) e Hanken Grotesk (texto corrido e fatos).

const display = Anybody({
  subsets: ["latin"],
  display: "swap",
  weight: "variable",
  axes: ["wdth"],
  variable: "--font-f-display",
});

const body = Hanken_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-f-body",
});

export const metadata: Metadata = {
  title: { absolute: "Fade & Co. Barbers · A fictional Chicago barbershop (No Sweat concept)" },
  description:
    "A design demonstration by No Sweat: a fictional four-chair barbershop on Milwaukee Ave in Logan Square, Chicago, with prices, barbers, hours and a demo booking flow.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#a3191e" };

export default function FadeLayout({ children }: { children: ReactNode }) {
  return <div className={`fade ${display.variable} ${body.variable}`}>{children}</div>;
}
