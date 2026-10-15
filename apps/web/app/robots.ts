import type { MetadataRoute } from "next";
import { SITE_ORIGIN } from "@/lib/site";

// robots.txt da plataforma. Áreas logadas, telas de conta e a API não interessam a buscadores.
// Robôs de busca com IA (ChatGPT, Claude, Perplexity, Gemini...) seguem a regra geral: podem ler
// as páginas públicas, para a No Sweat poder ser citada nas respostas deles.
// Os sites dos clientes (/s/...) ficam abertos: cada um é do cliente e deve aparecer no Google.

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/admin",
        "/billing",
        "/create",
        "/dashboard",
        "/login",
        "/signup",
        "/sites",
        "/social",
        "/unsubscribe",
        "/welcome",
      ],
    },
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
  };
}
