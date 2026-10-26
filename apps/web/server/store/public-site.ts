import type { SiteSpec } from "@nosweat/schema";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { ownerHasCustomDomainAccess, ownerHasLiveAccess } from "../billing";
import { getSiteStore } from "./index";
import { hostTag, ownerTag, PUBLIC_SITE_REVALIDATE_S, siteTag, slugTag } from "./revalidate";
import type { SiteRef } from "./types";

// Leitura das páginas públicas dos sites (/s/<slug> e o domínio do cliente, /d/<host>), com
// cache: a página e o generateMetadata usam a mesma leitura (React cache) e o resultado fica no
// cache do Next por até 1 hora (unstable_cache), com etiquetas para limpar na hora certa
// (revalidate.ts). Em dois passos, porque as etiquetas do site e do dono só são conhecidas
// depois de achar o site pelo endereço:
//   1. endereço → { id, dono }       (etiqueta site-slug:<slug> ou site-host:<domínio>)
//   2. id → site no ar + acesso      (etiquetas site:<id> e owner:<dono>)
// Nada aqui lê cookies ou cabeçalhos: as páginas continuam estáticas (ISR).
// Não reexportado por ./index de propósito: billing importa o store, e isto importa billing.

/** O que as páginas públicas precisam de um site no ar (sem o rascunho). */
export type PublicSite = {
  id: string;
  ownerId: string | null;
  slug: string | null;
  customDomain: string | null;
  /** A versão no ar (published_spec). */
  spec: SiteSpec;
  /** O plano do dono deixa o site no ar (`ownerHasLiveAccess`). */
  liveAccess: boolean;
  /** O plano do dono inclui domínio próprio (`ownerHasCustomDomainAccess`). */
  customDomainAccess: boolean;
};

function cachedRef(by: { slug: string } | { domain: string }): Promise<SiteRef | null> {
  const [kind, value, tag] =
    "slug" in by
      ? (["slug", by.slug, slugTag(by.slug)] as const)
      : (["domain", by.domain, hostTag(by.domain)] as const);
  return unstable_cache(() => getSiteStore().findRef(by), ["public-site-ref", kind, value], {
    tags: [tag],
    revalidate: PUBLIC_SITE_REVALIDATE_S,
  })();
}

function cachedSite(ref: SiteRef): Promise<PublicSite | null> {
  const tags = [siteTag(ref.id), ...(ref.ownerId ? [ownerTag(ref.ownerId)] : [])];
  return unstable_cache(
    async (): Promise<PublicSite | null> => {
      const site = await getSiteStore().getPublished(ref.id);
      if (!site) return null;
      const [liveAccess, customDomainAccess] = await Promise.all([
        ownerHasLiveAccess(site.ownerId),
        ownerHasCustomDomainAccess(site.ownerId),
      ]);
      return {
        id: site.id,
        ownerId: site.ownerId,
        slug: site.slug,
        customDomain: site.customDomain,
        spec: site.liveSpec,
        liveAccess,
        customDomainAccess,
      };
    },
    ["public-site", ref.id],
    { tags, revalidate: PUBLIC_SITE_REVALIDATE_S },
  )();
}

/** Site no ar com o endereço grátis /s/<slug>, ou `null`. */
export const getPublicSiteBySlug = cache(async (slug: string): Promise<PublicSite | null> => {
  const ref = await cachedRef({ slug });
  if (!ref) return null;
  const site = await cachedSite(ref);
  // O endereço pode ter mudado depois do passo 1 ter ido para o cache: confere de novo.
  return site?.slug === slug ? site : null;
});

/** Site no ar no domínio `domain` (raiz, minúsculas, sem "www"), ou `null`. */
export const getPublicSiteByDomain = cache(async (domain: string): Promise<PublicSite | null> => {
  const ref = await cachedRef({ domain });
  if (!ref) return null;
  const site = await cachedSite(ref);
  return site?.customDomain === domain ? site : null;
});
