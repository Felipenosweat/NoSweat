import { revalidateTag } from "next/cache";

// Etiquetas do cache das páginas públicas dos sites (/s/<slug> e o domínio do cliente, ver
// public-site.ts). Quem muda o que um site no ar mostra (publicar, tirar do ar, apagar,
// domínio, link de avaliação, plano do dono) chama as funções daqui. Sem dependências do resto
// do servidor de propósito: billing e grants importam este arquivo sem criar ciclo.

/** As páginas públicas ficam no cache por até 1 hora (também o `revalidate` das páginas). */
export const PUBLIC_SITE_REVALIDATE_S = 3600;

export const siteTag = (id: string) => `site:${id}`;
export const slugTag = (slug: string) => `site-slug:${slug}`;
export const hostTag = (host: string) => `site-host:${host.toLowerCase()}`;
export const ownerTag = (ownerId: string) => `owner:${ownerId}`;

/**
 * Expira as etiquetas na hora (`expire: 0`): a próxima visita já vê o site novo, em vez de
 * receber uma vez a página antiga (o padrão do Next 16 sem `expire`). Fora de um request do
 * Next (testes, scripts) não há cache para limpar: ignora em silêncio.
 */
function expire(tags: string[]): void {
  for (const tag of new Set(tags)) {
    try {
      revalidateTag(tag, { expire: 0 });
    } catch (error) {
      if (process.env.NODE_ENV !== "test") {
        console.warn("[cache] could not revalidate", tag, error);
      }
    }
  }
}

type SiteAddress = { slug?: string | null; customDomain?: string | null };

/**
 * Limpa o cache das páginas públicas do site `site` (id, endereço grátis e domínio). Passe em
 * `previous` os endereços antigos quando eles mudarem (ex.: domínio trocado ou removido).
 */
export function revalidatePublicSite(
  site: { id: string } & SiteAddress,
  ...previous: (SiteAddress | null | undefined)[]
): void {
  const tags = [siteTag(site.id)];
  for (const address of [site, ...previous]) {
    if (address?.slug) tags.push(slugTag(address.slug));
    if (address?.customDomain) tags.push(hostTag(address.customDomain));
  }
  expire(tags);
}

/** Limpa o cache de todos os sites no ar da conta (mudou o plano ou o acesso manual). */
export function revalidateOwnerSites(ownerId: string | null | undefined): void {
  if (ownerId) expire([ownerTag(ownerId)]);
}
