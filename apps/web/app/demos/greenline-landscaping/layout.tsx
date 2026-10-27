import type { Metadata, Viewport } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import type { ReactNode } from "react";
import "./greenline.css";

// Demonstração "Greenline Landscaping": site feito à mão (não é um SiteSpec) para um
// paisagista FICTÍCIO de Charlotte (fatos da fixture greenline-landscaping). Fora do Google
// (noindex) e do sitemap. Fontes só desta página: Fraunces (serifa de estilo antigo, macia,
// com itálico, para títulos) e Source Sans 3 (sans humanista para texto, preços e rótulos).

const display = Fraunces({
  subsets: ["latin"],
  display: "swap",
  style: ["normal", "italic"],
  axes: ["SOFT", "opsz"],
  variable: "--font-g-display",
});

const body = Source_Sans_3({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-g-body",
});

export const metadata: Metadata = {
  title: { absolute: "Greenline Landscaping · Lawn care in Charlotte (No Sweat concept)" },
  description:
    "A design demonstration by No Sweat: a fictional lawn care and landscaping company in Charlotte, NC, with services and prices, the year in the yard, the service area and a demo quote request.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#f0eadc" };

export default function GreenlineLayout({ children }: { children: ReactNode }) {
  return <div className={`greenline ${display.variable} ${body.variable}`}>{children}</div>;
}
