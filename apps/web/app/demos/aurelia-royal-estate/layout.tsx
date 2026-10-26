import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, Jost } from "next/font/google";
import type { ReactNode } from "react";
import { OPENING_SEEN_SCRIPT } from "@/components/demos/aurelia/Opening";
import "./aurelia.css";

// Demonstração "Aurelia Royal Estate": site feito à mão (não é um SiteSpec) para mostrar o
// nível de direção de arte que a pesquisa em docs/design/ pede. Hotel-palácio FICTÍCIO; fora
// do Google (noindex) e do sitemap. Fontes só desta página: Bodoni Moda (títulos, com
// itálico) e Jost (texto e rótulos em versalete).

const display = Bodoni_Moda({
  subsets: ["latin"],
  display: "swap",
  style: ["normal", "italic"],
  variable: "--font-a-display",
});

const body = Jost({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-a-body",
});

export const metadata: Metadata = {
  title: { absolute: "Aurelia Royal Estate · A fictional palace hotel (No Sweat concept)" },
  description:
    "A design demonstration by No Sweat: a fictional royal palace hotel on Lake Valcora, with suites, experiences, a gallery and a demo reservation flow.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#0d0a08" };

export default function AureliaLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`aurelia ${display.variable} ${body.variable}`}>
      {/* Antes da pintura: se a abertura já passou nesta sessão, ela não aparece de novo. */}
      <script dangerouslySetInnerHTML={{ __html: OPENING_SEEN_SCRIPT }} />
      {children}
    </div>
  );
}
