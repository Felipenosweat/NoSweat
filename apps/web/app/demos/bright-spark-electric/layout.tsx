import type { Metadata, Viewport } from "next";
import { Schibsted_Grotesk } from "next/font/google";
import type { ReactNode } from "react";
import "./bright-spark.css";

// Demonstração "Bright Spark Electric": site feito à mão (não é um SiteSpec) na direção
// "service-direct" com composição "type-poster". Eletricista FICTÍCIO em Phoenix; fora do
// Google (noindex) e do sitemap. Uma família grotesca só, a Schibsted Grotesk (variável,
// 400–900): o cartaz do topo em 800, números em algarismos tabulares, texto em 400.
// Ver docs/design/demos/bright-spark-electric.md.

const grotesk = Schibsted_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-bs",
});

export const metadata: Metadata = {
  title: { absolute: "Bright Spark Electric · A fictional Phoenix electrician (No Sweat concept)" },
  description:
    "A design demonstration by No Sweat: a fictional residential electrician in Phoenix, AZ, with prices, the service area, hours and a demo quote request.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#ffd000" };

export default function BrightSparkLayout({ children }: { children: ReactNode }) {
  return <div className={`brightspark ${grotesk.variable}`}>{children}</div>;
}
