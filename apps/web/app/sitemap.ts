import type { MetadataRoute } from "next";
import { freeSiteUrl } from "@/components/site-metadata";
import { siteUrl } from "@/lib/site";
import { ownerHasLiveAccess } from "@/server/billing";
import { getSiteStore } from "@/server/store";

// Mapa do site da plataforma (nosweatfd.com). Só páginas públicas e indexáveis, no endereço
// oficial (com www, ver lib/site.ts). Fica de fora: /examples/* e /demos/* (negócios fictícios,
// com noindex de propósito).
// Os sites publicados dos clientes no endereço grátis (/s/<slug>) entram, para o Google achar
// cada site novo sem depender de link. Site com domínio próprio fica de fora: o mapa dele está
// no próprio domínio (proxy.ts → /d/<host>/sitemap.xml).

/** Refeito no máximo a cada hora (lê todos os sites). */
export const revalidate = 3600;

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

/** Sites no ar no endereço grátis, de donos com o plano em dia. Erro no banco: lista vazia. */
async function publishedFreeSites(): Promise<MetadataRoute.Sitemap> {
  try {
    const sites = (await getSiteStore().listAll()).filter(
      (site) => site.status === "published" && site.slug && !site.customDomain,
    );
    const live = new Map<string | null, boolean>();
    const out: MetadataRoute.Sitemap = [];
    for (const site of sites) {
      if (!live.has(site.ownerId)) live.set(site.ownerId, await ownerHasLiveAccess(site.ownerId));
      if (!live.get(site.ownerId) || !site.slug) continue;
      out.push({ url: freeSiteUrl(site.slug), lastModified: site.updatedAt, priority: 0.5 });
    }
    return out;
  } catch (error) {
    console.error("[sitemap] could not list published sites", error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = PAGES.map(({ path, priority, changeFrequency }) => ({
    url: siteUrl(path),
    changeFrequency,
    priority,
  }));
  return [...pages, ...(await publishedFreeSites())];
}
