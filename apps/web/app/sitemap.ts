import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

// Mapa do site da plataforma (nosweatfd.com). Só páginas públicas e indexáveis, no endereço
// oficial (com www, ver lib/site.ts). Fica de fora: /examples/* (negócios fictícios, com noindex
// de propósito) e os sites publicados dos clientes (cada um é do cliente, não da plataforma).

const PAGES: {
  path: string;
  priority: number;
  changeFrequency: "weekly" | "monthly" | "yearly";
}[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/pricing", priority: 0.8, changeFrequency: "monthly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/credits", priority: 0.2, changeFrequency: "yearly" },
  { path: "/data-deletion", priority: 0.2, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.map(({ path, priority, changeFrequency }) => ({
    url: siteUrl(path),
    changeFrequency,
    priority,
  }));
}
