import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import type { ReactNode } from "react";
import "./iron-lotus.css";

// Demonstração "Iron Lotus Tattoo": site feito à mão (não é um SiteSpec) na direção
// "experimental-grid" (a folha de flash). Estúdio FICTÍCIO; fora do Google (noindex) e do
// sitemap. Uma família grotesca só, a Archivo (variável: o eixo de largura "wdth" faz o
// condensado dos títulos e o normal do texto), e a IBM Plex Mono só para números, rótulos e a
// ficha de consulta. Ver docs/design/demos/iron-lotus-tattoo.md.

const grotesk = Archivo({
  subsets: ["latin"],
  display: "swap",
  axes: ["wdth"],
  variable: "--font-il",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500"],
  variable: "--font-il-mono",
});

export const metadata: Metadata = {
  title: { absolute: "Iron Lotus Tattoo · A fictional Denver studio (No Sweat concept)" },
  description:
    "A design demonstration by No Sweat: a fictional custom tattoo studio in RiNo, Denver, with a flash sheet, the artists, prices, booking rules and a demo consult slip.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#f2ede3" };

export default function IronLotusLayout({ children }: { children: ReactNode }) {
  return <div className={`ironlotus ${grotesk.variable} ${mono.variable}`}>{children}</div>;
}
