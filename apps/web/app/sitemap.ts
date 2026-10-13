import type { MetadataRoute } from "next";

// Mapa do site da plataforma (nosweatfd.com). Só páginas públicas e indexáveis.
// Fica de fora: /examples/* (negócios fictícios, marcados com noindex de propósito) e os
// sites publicados dos clientes (cada um é do cliente, não da plataforma).

const ORIGIN = "https://nosweatfd.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${ORIGIN}/`,
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
