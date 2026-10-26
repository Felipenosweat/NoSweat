import { SiteRenderer } from "@nosweat/templates";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { customDomainUrl, siteJsonLd, siteMetadata } from "@/components/site-metadata";
import { SiteUnavailable } from "@/components/SiteUnavailable";
import { appOrigin } from "@/server/notify";
import { getPublicSiteByDomain, type PublicSite } from "@/server/store/public-site";

// Site publicado no domínio próprio do cliente. O proxy.ts reescreve
// joesplumbing.com/qualquer-coisa → /d/joesplumbing.com, então esta rota nunca aparece na URL.
// Estático sob demanda (ISR), como /s/[slug]: cache de até 1 hora, limpo na hora quando o site,
// o domínio ou o plano do dono mudam (server/store/revalidate.ts). Nada de cookies()/headers().

export const revalidate = 3600;

/** Nenhum domínio no build: todos são gerados na primeira visita. */
export function generateStaticParams(): { host: string }[] {
  return [];
}

type DomainSitePageProps = { params: Promise<{ host: string }> };

/** `null` se o endereço vier com "%" solto (não é um domínio válido). */
function normalizeHost(host: string): string | null {
  try {
    return decodeURIComponent(host)
      .toLowerCase()
      .replace(/^www\./, "");
  } catch {
    return null;
  }
}

async function getPublished(host: string): Promise<PublicSite | null> {
  const domain = normalizeHost(host);
  if (!domain) return null;
  return getPublicSiteByDomain(domain);
}

/** Endereço canônico: o domínio do cliente, sempre sem "www". */
const siteUrl = (site: PublicSite, host: string) =>
  customDomainUrl(site.customDomain ?? normalizeHost(host) ?? host);

export async function generateMetadata({ params }: DomainSitePageProps): Promise<Metadata> {
  const { host } = await params;
  const site = await getPublished(host);
  if (!site) return {};
  if (!site.liveAccess) return { robots: { index: false } };
  return siteMetadata(site, siteUrl(site, host));
}

export default async function DomainSitePage({ params }: DomainSitePageProps) {
  const { host } = await params;
  const site = await getPublished(host);
  if (!site) notFound();
  if (!site.liveAccess) {
    return <SiteUnavailable name={site.spec.business.name} />;
  }
  // Plano atual sem domínio próprio (ex.: desceu de Pro para Starter): o site segue no ar no
  // endereço grátis. `appOrigin` com um host de fora devolve o endereço da No Sweat (APP_URL).
  if (site.slug && !site.customDomainAccess) {
    redirect(`${appOrigin("https://customer.invalid/")}/s/${encodeURIComponent(site.slug)}`);
  }
  return (
    <>
      {/* JSON-LD já escapado em siteJsonLd (texto do cliente não fecha a tag). */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: siteJsonLd(site, siteUrl(site, host)) }}
      />
      <SiteRenderer spec={site.spec} contactEndpoint={`/api/sites/${site.id}/leads`} />
    </>
  );
}
