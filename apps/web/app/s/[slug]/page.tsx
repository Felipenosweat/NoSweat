import { SiteRenderer } from "@nosweat/templates";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { customDomainUrl, freeSiteUrl, siteJsonLd, siteMetadata } from "@/components/site-metadata";
import { SiteUnavailable } from "@/components/SiteUnavailable";
import { isDomainLive } from "@/server/domains/configured";
import { getPublicSiteBySlug, type PublicSite } from "@/server/store/public-site";

// Site publicado, no endereço grátis: nosweatfd.com/s/<slug>. Público, sem login.
// Estático sob demanda (ISR): cada endereço é desenhado na primeira visita e fica no cache por
// até 1 hora; publicar, tirar do ar, apagar, trocar o domínio ou o plano do dono limpa o cache
// na hora (server/store/revalidate.ts). Nada de cookies()/headers() aqui: deixaria dinâmica.

export const revalidate = 3600;

/** Nenhum endereço no build: todos são gerados na primeira visita. */
export function generateStaticParams(): { slug: string }[] {
  return [];
}

type PublicSitePageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PublicSitePageProps): Promise<Metadata> {
  const { slug } = await params;
  const site = await getPublicSiteBySlug(slug);
  if (!site) return {};
  if (!site.liveAccess) return { robots: { index: false } };
  return siteMetadata(site, await canonicalUrl(site, slug));
}

/**
 * Endereço oficial para o Google: o domínio do cliente quando ele já funciona (e o plano inclui
 * domínio), senão o grátis. Só o canonical muda; o endereço grátis continua abrindo (sem
 * redirecionar, que o navegador guardaria e quebraria se o domínio fosse removido).
 */
async function canonicalUrl(site: PublicSite, slug: string): Promise<string> {
  const domain = site.customDomain;
  if (domain && site.customDomainAccess && (await isDomainLive(domain))) {
    return customDomainUrl(domain);
  }
  return freeSiteUrl(slug);
}

export default async function PublicSitePage({ params }: PublicSitePageProps) {
  const { slug } = await params;
  const site = await getPublicSiteBySlug(slug);
  if (!site) notFound();
  if (!site.liveAccess) {
    return <SiteUnavailable name={site.spec.business.name} />;
  }
  return (
    <>
      {/* JSON-LD já escapado em siteJsonLd (texto do cliente não fecha a tag). */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: siteJsonLd(site, freeSiteUrl(slug)) }}
      />
      <SiteRenderer spec={site.spec} contactEndpoint={`/api/sites/${site.id}/leads`} />
    </>
  );
}
