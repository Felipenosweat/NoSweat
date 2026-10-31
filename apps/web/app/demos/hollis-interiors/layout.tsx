import type { Metadata, Viewport } from "next";
import { Host_Grotesk } from "next/font/google";
import type { ReactNode } from "react";
import "./hollis.css";

// Demonstração "Hollis Interiors": site feito à mão (não é um SiteSpec) para um estúdio de design
// de interiores FICTÍCIO de Nashville (fatos da fixture hollis-interiors). Fora do Google
// (noindex) e do sitemap. Uma família só: Host Grotesk (grotesco refinado) em 300/400/500; a
// hierarquia vem do tamanho e do espaço, nunca de uma serifa (o Aurelia, a Mercer Law e a
// Greenline já usam serifas).

const grotesk = Host_Grotesk({
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500"],
  variable: "--font-h",
});

export const metadata: Metadata = {
  title: { absolute: "Hollis Interiors · Interior design in Nashville (No Sweat concept)" },
  description:
    "A design demonstration by No Sweat: a fictional interior design studio in East Nashville, room by room, with services and fees, the process, the studio and a demo consultation request.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#f1efea" };

export default function HollisLayout({ children }: { children: ReactNode }) {
  return <div className={`hollis ${grotesk.variable}`}>{children}</div>;
}
