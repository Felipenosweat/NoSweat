import { customDomainUrl, freeSiteUrl } from "@/components/site-metadata";
import { ownerHasCustomDomainAccess } from "@/server/billing";
import { isDomainLive } from "@/server/domains/configured";
import type { SiteRecord } from "@/server/store";
import { INDEXNOW_ENGINES, notifyIndexNow } from "./indexnow";

// Depois de publicar: avisa os buscadores do endereço oficial do site (o domínio do cliente
// quando ele já funciona e o plano inclui domínio; senão o endereço grátis).

export type SearchEngineNotice = {
  status: "sent" | "skipped" | "failed";
  engines: string[];
  urls: string[];
};

/** Endereço oficial (o mesmo do canonical das páginas públicas). */
export async function canonicalSiteUrl(site: SiteRecord): Promise<string | null> {
  const domain = site.customDomain;
  if (domain && (await ownerHasCustomDomainAccess(site.ownerId)) && (await isDomainLive(domain))) {
    return customDomainUrl(domain);
  }
  return site.slug ? freeSiteUrl(site.slug) : null;
}

export async function announcePublishedSite(site: SiteRecord): Promise<SearchEngineNotice> {
  const url = await canonicalSiteUrl(site);
  if (!url) return { status: "skipped", engines: [], urls: [] };
  const results = await notifyIndexNow([url]);
  const status = results.some((r) => r.status === "sent")
    ? "sent"
    : results.every((r) => r.status === "skipped")
      ? "skipped"
      : "failed";
  return { status, engines: status === "sent" ? INDEXNOW_ENGINES : [], urls: [url] };
}
