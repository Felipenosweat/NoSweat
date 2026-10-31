import type { Metadata, Viewport } from "next";
import { Familjen_Grotesk, Zilla_Slab } from "next/font/google";
import type { ReactNode } from "react";
import "./sunrise.css";

// Demonstração "Sunrise Bakery": site feito à mão (não é um SiteSpec) para uma padaria FICTÍCIA
// de Sacramento, com os fatos do site-modelo `sunrise-bakery` (packages/fixtures). Fora do
// Google (noindex). Fontes só desta página: Zilla Slab (slab quente, com itálico, para títulos,
// preços e o quadro) e Familjen Grotesk (grotesca simpática para texto e rótulos).

const display = Zilla_Slab({
  subsets: ["latin"],
  display: "swap",
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-sb-display",
});

const body = Familjen_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sb-body",
});

export const metadata: Metadata = {
  title: { absolute: "Sunrise Bakery · A fictional Sacramento bakery (No Sweat concept)" },
  description:
    "A design demonstration by No Sweat: a fictional sourdough bakery on J St in Midtown Sacramento, with a weekly bake board, menu and prices, hours and a demo preorder flow.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#f6efe4" };

export default function SunriseLayout({ children }: { children: ReactNode }) {
  return <div className={`sunrise ${display.variable} ${body.variable}`}>{children}</div>;
}
