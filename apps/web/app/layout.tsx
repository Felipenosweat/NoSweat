import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { SITE_ORIGIN } from "@/lib/site";
import { fontVariables } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  // Verificação do Google Search Console (propriedade https://www.nosweatfd.com/). Não remover:
  // sem a etiqueta o Google desfaz a verificação.
  verification: { google: "hC43q6uBoSo4bys-HeeUACRbg69fg0djIf2_e3So30A" },
  title: {
    default: "No Sweat · Your website, no sweat.",
    template: "%s · No Sweat",
  },
  description:
    "Describe your business and get a beautiful, ready-to-publish website in minutes. Built for small businesses.",
  // Ícones e manifesto da No Sweat ficam em public/ (não em app/icon.png nem app/manifest.ts):
  // assim os sites dos clientes (/s/…, domínio próprio) trocam pelos deles em siteMetadata.
  icons: { icon: "/brand/icon.png", apple: "/brand/apple-icon.png" },
  manifest: "/manifest.webmanifest",
};

// Cor da barra do navegador e conteúdo até as bordas do iPhone (as barras fixas usam safe-area).
export const viewport: Viewport = {
  themeColor: "#ffffff",
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={fontVariables}>
      <body className="min-h-screen bg-white font-sans text-ink antialiased">
        {/* Pular para o conteúdo: o alvo é o <main id="main"> de cada layout. */}
        <a
          href="#main"
          className="sr-only z-50 rounded-lg bg-white px-4 py-3 font-semibold text-ink ring-2 ring-brand focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
