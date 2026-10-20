import { SiteRenderer } from "@nosweat/templates";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { customDomainUrl, freeSiteUrl, siteJsonLd, siteMetadata } from "@/components/site-metadata";
import { SiteUnavailable } from "@/components/SiteUnavailable";
import { ownerHasCustomDomainAccess, ownerHasLiveAccess } from "@/server/billing";
import { isDomainLive } from "@/server/domains/configured";
import { liveSpec } from "@/server/sites";
import { getSiteStore, type SiteRecord } from "@/server/store";

// Site publicado, no endereço grátis: nosweatfd.com/s/<slug>. Público, sem login.

type PublicSitePageProps = { params: Promise<{ slug: string }> };

async function getPublished(slug: string): Promise<SiteRecord | null> {
  const site = await getSiteStore().getBySlug(slug);
  return site?.status === "published" ? site : null;
}

export async function generateMetadata({ params }: PublicSitePageProps): Promise<Metadata> {
  const { slug } = await params;
  const site = await getPublished(slug);
  if (!site) return {};
  if (!(await ownerHasLiveAccess(site.ownerId))) return { robots: { index: false } };
  return siteMetadata(site, await canonicalUrl(site, slug));
}

/**
 * Endereço oficial para o Google: o domínio do cliente quando ele já funciona (e o plano inclui
 * domínio), senão o grátis. Só o canonical muda; o endereço grátis continua abrindo (sem
 * redirecionar, que o navegador guardaria e quebraria se o domínio fosse removido).
 */
async function canonicalUrl(site: SiteRecord, slug: string): Promise<string> {
  const domain = site.customDomain;
  if (domain && (await ownerHasCustomDomainAccess(site.ownerId)) && (await isDomainLive(domain))) {
    return customDomainUrl(domain);
  }
  return freeSiteUrl(slug);
}

export default async function PublicSitePage({ params }: PublicSitePageProps) {
  const { slug } = await params;
  const site = await getPublished(slug);
  if (!site) notFound();
  if (!(await ownerHasLiveAccess(site.ownerId))) {
    return <SiteUnavailable name={liveSpec(site).business.name} />;
  }
  return (
    <>
      {/* JSON-LD já escapado em siteJsonLd (texto do cliente não fecha a tag). */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: siteJsonLd(site, freeSiteUrl(slug)) }}
      />
      <SiteRenderer spec={liveSpec(site)} contactEndpoint={`/api/sites/${site.id}/leads`} />
    </>
  );
}
