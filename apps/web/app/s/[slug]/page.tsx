import { SiteRenderer } from "@nosweat/templates";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { siteMetadata } from "@/components/site-metadata";
import { getSiteStore, type SiteRecord } from "@/server/store";

// Site publicado, no endereço grátis: nosweatfd.com/s/<slug>. Público, sem login.

type PublicSitePageProps = { params: Promise<{ slug: string }> };

async function getPublished(slug: string): Promise<SiteRecord | null> {
  const site = await getSiteStore().getBySlug(slug);
  return site?.status === "published" ? site : null;
}

export async function generateMetadata({ params }: PublicSitePageProps): Promise<Metadata> {
  const site = await getPublished((await params).slug);
  if (!site) return {};
  return siteMetadata(site);
}

export default async function PublicSitePage({ params }: PublicSitePageProps) {
  const site = await getPublished((await params).slug);
  if (!site) notFound();
  return <SiteRenderer spec={site.spec} contactEndpoint={`/api/sites/${site.id}/leads`} />;
}
