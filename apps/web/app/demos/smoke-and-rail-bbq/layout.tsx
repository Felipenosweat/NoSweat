import type { Metadata, Viewport } from "next";
import { Archivo, Big_Shoulders } from "next/font/google";
import type { ReactNode } from "react";
import "./smoke-and-rail.css";

// Demonstração "Smoke & Rail BBQ": site feito à mão (não é um SiteSpec) a partir dos fatos do
// site-modelo de churrasco (packages/fixtures). Negócio FICTÍCIO; fora do Google (noindex) e
// do sitemap. Fontes só desta página: Big Shoulders (letreiro industrial condensado de
// Chicago, para nomes, números e a placa de partidas) e Archivo (texto e rótulos).

const display = Big_Shoulders({
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz"],
  variable: "--font-sr-display",
});

const body = Archivo({
  subsets: ["latin"],
  display: "swap",
  axes: ["wdth"],
  variable: "--font-sr-body",
});

export const metadata: Metadata = {
  title: { absolute: "Smoke & Rail BBQ · A fictional Kansas City pit (No Sweat concept)" },
  description:
    "A design demonstration by No Sweat: a fictional barbecue pit and food truck in the West Bottoms of Kansas City, with the menu, the week's schedule, directions and catering.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#0d0c0b" };

export default function SmokeAndRailLayout({ children }: { children: ReactNode }) {
  return <div className={`smoke-rail ${display.variable} ${body.variable}`}>{children}</div>;
}
