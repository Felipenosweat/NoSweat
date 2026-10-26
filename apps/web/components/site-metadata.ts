import type { SiteSpec } from "@nosweat/schema";
import type { Metadata } from "next";
import { SITE_ORIGIN } from "@/lib/site";
import type { SiteRecord } from "@/server/store";

/**
 * O que os metadados precisam de um site: o id e a versão no ar. Serve um `SiteRecord` inteiro
 * (vale `publishedSpec ?? spec`, como `liveSpec` de server/sites.ts) ou o `PublicSite` das
 * páginas públicas (que já traz só a versão no ar em `spec`).
 */
type MetadataSite = Pick<SiteRecord, "id" | "spec"> & { publishedSpec?: SiteSpec | null };

const specOf = (site: MetadataSite): SiteSpec => site.publishedSpec ?? site.spec;

/** Endereço grátis de um site publicado (mesma origem do `metadataBase` do layout). */
export const freeSiteUrl = (slug: string) => `${SITE_ORIGIN}/s/${slug}`;

/** Endereço no domínio próprio do cliente (raiz, sem "www"). */
export const customDomainUrl = (domain: string) => `https://${domain}`;

/** Tamanho da imagem de compartilhamento gerada (/api/sites/[id]/og). */
export const SITE_OG_SIZE = { width: 1200, height: 630 };

/**
 * Letra do ícone (favicon) de um site: a primeira letra ou número do nome do negócio, em
 * maiúscula. Nome sem letras (ou vazio): `null` (o ícone fica só com a cor do site).
 */
export function siteInitial(name: string): string | null {
  const first = name.trim().match(/[\p{L}\p{N}]/u)?.[0];
  return first ? first.toLocaleUpperCase("en-US") : null;
}

/** Cor de texto (branco ou quase preto) que mais contrasta com `hex` (#RRGGBB), pela WCAG. */
export function textColorOn(hex: string): string {
  if (!/^#?[0-9a-fA-F]{6}$/.test(hex)) return "#FFFFFF";
  const value = Number.parseInt(hex.replace(/^#/, ""), 16);
  const linear = (channel: number) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const luminance =
    0.2126 * linear((value >> 16) & 0xff) +
    0.7152 * linear((value >> 8) & 0xff) +
    0.0722 * linear(value & 0xff);
  // Contraste com branco (luminância 1) x com #0B0F19 (luminância ~0,005).
  return 1.05 / (luminance + 0.05) >= (luminance + 0.05) / 0.055 ? "#FFFFFF" : "#0B0F19";
}

/**
 * Título e descrição que o Google e outros buscadores leem (as tags <title> e description).
 */
export function searchSnippet(spec: SiteSpec): { title: string; description?: string } {
  const { business, sections } = spec;
  const hero = sections.find((s) => s.type === "hero");
  const where = [business.city, business.state].filter(Boolean).join(", ");
  return {
    title: where ? `${business.name} | ${where}` : business.name,
    description: hero?.type === "hero" ? hero.subtitle : undefined,
  };
}

/**
 * Título, descrição e cartões de compartilhamento de um site publicado
 * (usado em /s/<slug> e no domínio do cliente). `url` = endereço onde a página está sendo vista.
 */
export function siteMetadata(site: MetadataSite, url: string): Metadata {
  const spec = specOf(site);
  const { business } = spec;
  const { title, description } = searchSnippet(spec);
  const hero = spec.sections.find((s) => s.type === "hero");
  const image = hero?.type === "hero" ? hero.image : undefined;
  // Sem foto no topo: a imagem gerada com o nome e a cor do site (para o link não ir "pelado"
  // por SMS, Facebook ou Nextdoor). Endereço absoluto: os apps de mensagem exigem.
  const images = image
    ? [{ url: image.url, alt: image.alt, width: image.width, height: image.height }]
    : [{ url: `${SITE_ORIGIN}/api/sites/${site.id}/og`, alt: business.name, ...SITE_OG_SIZE }];
  // `v` muda quando a cor muda, para o navegador não ficar com o ícone antigo guardado.
  const iconUrl = `/api/sites/${site.id}/icon?v=${spec.theme.primary.replace(/^#/, "").toLowerCase()}`;

  return {
    // `absolute` para não herdar o " · No Sweat" do layout: o site é do cliente.
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    // Ícone do próprio negócio (letra na cor do site), no lugar do da No Sweat do layout.
    // /api passa direto pelo proxy também no domínio do cliente.
    icons: {
      icon: [{ url: iconUrl, type: "image/png", sizes: "64x64" }],
      apple: [{ url: `${iconUrl}&size=180`, type: "image/png", sizes: "180x180" }],
    },
    // O manifesto "No Sweat" (adicionar à tela inicial) é da plataforma, não do site do cliente.
    manifest: null,
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
      card: "summary_large_image",
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
export function siteJsonLd(site: MetadataSite, url: string): string {
  const { business } = specOf(site);
  const address =
    business.address || business.city || business.state
      ? {
          "@type": "PostalAddress",
          streetAddress: business.address || undefined,
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
export function escapeJsonForScript(json: string): string {
  return json.replace(/[<>&\u2028\u2029]/g, (char) => {
    return `\\u${char.charCodeAt(0).toString(16).padStart(4, "0")}`;
  });
}
