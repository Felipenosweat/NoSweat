import { SiteRenderer } from "@nosweat/templates";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { freeSiteUrl, siteJsonLd, siteMetadata } from "@/components/site-metadata";
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
  return siteMetadata(site, freeSiteUrl(slug));
}

export default async function PublicSitePage({ params }: PublicSitePageProps) {
  const { slug } = await params;
  const site = await getPublished(slug);
  if (!site) notFound();
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
