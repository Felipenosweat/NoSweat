import { SiteRenderer } from "@nosweat/templates";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { siteMetadata } from "@/components/site-metadata";
import { getSiteStore, type SiteRecord } from "@/server/store";

// Site publicado no domínio próprio do cliente. O proxy.ts reescreve
// joesplumbing.com/qualquer-coisa → /d/joesplumbing.com, então esta rota nunca aparece na URL.

type DomainSitePageProps = { params: Promise<{ host: string }> };

async function getPublished(host: string): Promise<SiteRecord | null> {
  const domain = decodeURIComponent(host)
    .toLowerCase()
    .replace(/^www\./, "");
  const site = await getSiteStore().getByDomain(domain);
  return site?.status === "published" ? site : null;
}

export async function generateMetadata({ params }: DomainSitePageProps): Promise<Metadata> {
  const site = await getPublished((await params).host);
  return site ? siteMetadata(site) : {};
}

export default async function DomainSitePage({ params }: DomainSitePageProps) {
  const site = await getPublished((await params).host);
  if (!site) notFound();
  return <SiteRenderer spec={site.spec} contactEndpoint={`/api/sites/${site.id}/leads`} />;
}
