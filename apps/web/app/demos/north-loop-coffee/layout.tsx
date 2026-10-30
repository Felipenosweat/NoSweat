import type { Metadata, Viewport } from "next";
import { DM_Mono, Piazzolla } from "next/font/google";
import type { ReactNode } from "react";
import "./north-loop.css";

// Demonstração "North Loop Coffee": site feito à mão (não é um SiteSpec) para um café FICTÍCIO
// de Minneapolis, com os fatos do site-modelo `north-loop-coffee` (packages/fixtures). Fora do
// Google (noindex). Fontes só desta página: Piazzolla (serif de texto com personalidade, eixo
// óptico e itálico, para tudo que se lê) e DM Mono (pequena, para preços, horas e rótulos).

const serif = Piazzolla({
  subsets: ["latin"],
  display: "swap",
  style: ["normal", "italic"],
  axes: ["opsz"],
  variable: "--font-nl-serif",
});

const mono = DM_Mono({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500"],
  variable: "--font-nl-mono",
});

export const metadata: Metadata = {
  title: { absolute: "North Loop Coffee · A fictional Minneapolis café (No Sweat concept)" },
  description:
    "A design demonstration by No Sweat: a fictional coffee shop and roastery on Washington Ave N in Minneapolis, with its menu and prices, the day at the café, hours and a demo pickup slip.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#f1eee6" };

export default function NorthLoopLayout({ children }: { children: ReactNode }) {
  return <div className={`northloop ${serif.variable} ${mono.variable}`}>{children}</div>;
}
