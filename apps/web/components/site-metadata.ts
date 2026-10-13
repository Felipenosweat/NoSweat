import type { Metadata } from "next";
import { liveSpec } from "@/server/sites";
import type { SiteRecord } from "@/server/store";

/** Endereço grátis de um site publicado (mesma origem do `metadataBase` do layout). */
export const freeSiteUrl = (slug: string) => `https://nosweatfd.com/s/${slug}`;

/** Endereço no domínio próprio do cliente (raiz, sem "www"). */
export const customDomainUrl = (domain: string) => `https://${domain}`;

/**
 * Título, descrição e cartões de compartilhamento de um site publicado
 * (usado em /s/<slug> e no domínio do cliente). `url` = endereço onde a página está sendo vista.
 */
export function siteMetadata(site: SiteRecord, url: string): Metadata {
  const { business, sections } = liveSpec(site);
  const hero = sections.find((s) => s.type === "hero");
  const where = [business.city, business.state].filter(Boolean).join(", ");
  const title = where ? `${business.name} | ${where}` : business.name;
  const description = hero?.type === "hero" ? hero.subtitle : undefined;
  const image = hero?.type === "hero" ? hero.image : undefined;
  const images = image
    ? [{ url: image.url, alt: image.alt, width: image.width, height: image.height }]
    : undefined;

  return {
    // `absolute` para não herdar o " · No Sweat" do layout: o site é do cliente.
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      siteName: business.name,
      title,
      description,
      locale: "en_US",
      images,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images,
    },
  };
}

/**
 * JSON-LD (schema.org LocalBusiness) só com o que está no SiteSpec — nada inventado.
 * Devolve o texto pronto para <script type="application/ld+json">, já escapado.
 */
export function siteJsonLd(site: SiteRecord, url: string): string {
  const { business } = liveSpec(site);
  const address =
    business.city || business.state
      ? {
          "@type": "PostalAddress",
          addressLocality: business.city || undefined,
          addressRegion: business.state || undefined,
        }
      : undefined;

  const data = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: business.name,
    url,
    telephone: business.phone || undefined,
    email: business.email || undefined,
    address,
    areaServed: business.serviceArea || undefined,
  };

  // JSON.stringify já omite os campos `undefined`.
  return escapeJsonForScript(JSON.stringify(data));
}

/**
 * Impede que um texto do cliente feche a tag <script> ("</script>") ou abra um comentário
 * HTML: troca <, >, & e os separadores de linha U+2028/U+2029 por escapes \uXXXX (JSON válido).
 */
function escapeJsonForScript(json: string): string {
  return json.replace(/[<>&\u2028\u2029]/g, (char) => {
    return `\\u${char.charCodeAt(0).toString(16).padStart(4, "0")}`;
  });
}
