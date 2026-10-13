import { SiteRenderer } from "@nosweat/templates";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { customDomainUrl, siteJsonLd, siteMetadata } from "@/components/site-metadata";
import { liveSpec } from "@/server/sites";
import { getSiteStore, type SiteRecord } from "@/server/store";

// Site publicado no domínio próprio do cliente. O proxy.ts reescreve
// joesplumbing.com/qualquer-coisa → /d/joesplumbing.com, então esta rota nunca aparece na URL.

type DomainSitePageProps = { params: Promise<{ host: string }> };

const normalizeHost = (host: string) =>
  decodeURIComponent(host)
    .toLowerCase()
    .replace(/^www\./, "");

async function getPublished(host: string): Promise<SiteRecord | null> {
  const site = await getSiteStore().getByDomain(normalizeHost(host));
  return site?.status === "published" ? site : null;
}

/** Endereço canônico: o domínio do cliente, sempre sem "www". */
const siteUrl = (site: SiteRecord, host: string) =>
  customDomainUrl(site.customDomain ?? normalizeHost(host));

export async function generateMetadata({ params }: DomainSitePageProps): Promise<Metadata> {
  const { host } = await params;
  const site = await getPublished(host);
  return site ? siteMetadata(site, siteUrl(site, host)) : {};
}

export default async function DomainSitePage({ params }: DomainSitePageProps) {
  const { host } = await params;
  const site = await getPublished(host);
  if (!site) notFound();
  return (
    <>
      {/* JSON-LD já escapado em siteJsonLd (texto do cliente não fecha a tag). */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: siteJsonLd(site, siteUrl(site, host)) }}
      />
      <SiteRenderer spec={liveSpec(site)} contactEndpoint={`/api/sites/${site.id}/leads`} />
    </>
  );
}
