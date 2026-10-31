import type { Metadata, Viewport } from "next";
import { Newsreader } from "next/font/google";
import type { ReactNode } from "react";
import "./mercer.css";

// Demonstração "Mercer Law": site feito à mão (não é um SiteSpec) para um escritório
// FICTÍCIO de direito de família e sucessões em Columbus. Todos os fatos vêm do site-modelo
// packages/fixtures/src/library/mercer-law.ts. Fora do Google (noindex). Uma família de letra
// só (Newsreader, serifa de jornal com eixo óptico): ver docs/design/demos/mercer-law.md.

const serif = Newsreader({
  subsets: ["latin"],
  display: "swap",
  style: ["normal", "italic"],
  axes: ["opsz"],
  variable: "--font-m-serif",
});

export const metadata: Metadata = {
  title: { absolute: "Mercer Law · Family and estate law in German Village (No Sweat concept)" },
  description:
    "A design demonstration by No Sweat: a fictional two-person family and estate law office in Columbus, Ohio, with flat fees listed like an index and a private demo consultation request.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#f3eee4" };

export default function MercerLayout({ children }: { children: ReactNode }) {
  return <div className={`mercer ${serif.variable}`}>{children}</div>;
}
