import type { SiteSpec } from "@nosweat/schema";
import { getSiteStore, type SiteRecord } from "./store";

// Link de avaliações do Google (página /reviews). O link mora no SiteSpec
// (`business.googleReviewUrl`) e vira o botão "Review us on Google" do site. Só o dono muda:
// a IA nunca põe, troca nem tira (ver keepReviewUrl).

/** O spec com o link de avaliações trocado (`null` tira o link). Não muda o spec recebido. */
export function withReviewUrl(spec: SiteSpec, url: string | null): SiteSpec {
  const business = { ...spec.business };
  delete business.googleReviewUrl;
  if (url) business.googleReviewUrl = url;
  return { ...spec, business };
}

/**
 * `next` com o link de avaliações de `previous` (ou sem link, se `previous` for `null`). Usado
 * depois da IA (gerar e editar) e ao restaurar uma versão antiga: o link é configuração do dono,
 * não conteúdo do site.
 */
export function keepReviewUrl(next: SiteSpec, previous: SiteSpec | null): SiteSpec {
  return withReviewUrl(next, previous?.business.googleReviewUrl ?? null);
}

const urlOf = (spec: SiteSpec | null) => spec?.business.googleReviewUrl ?? null;

/**
 * Salva o link de avaliações do site. O RASCUNHO muda como num salvamento do editor (nova linha
 * em `site_versions`, fonte "edit"). Se o site estiver no ar, a versão publicada também ganha o
 * link (e só ele: o resto do rascunho continua esperando o "Publish").
 * Devolve `null` se o site sumiu no meio do caminho. Mesmo link de antes = nada é gravado.
 */
export async function saveReviewLink(
  site: SiteRecord,
  url: string | null,
): Promise<SiteRecord | null> {
  const store = getSiteStore();
  let current: SiteRecord | null = site;

  if (urlOf(site.spec) !== url) {
    current = await store.update(site.id, withReviewUrl(site.spec, url), "edit");
    if (!current) return null;
  }

  // EXCEÇÃO DELIBERADA à regra "published_spec só muda ao publicar": o link de avaliações é um
  // dado de contato do dono (como o domínio próprio), não conteúdo do site. Quem cola o link quer
  // o botão no ar agora, sem precisar publicar de novo (e sem levar junto outras mudanças do
  // rascunho que ainda não quer mostrar). Por isso só ESTE campo é copiado para a versão no ar.
  if (current.status === "published" && current.publishedSpec) {
    if (urlOf(current.publishedSpec) !== url) {
      current = await store.updateMeta(current.id, {
        publishedSpec: withReviewUrl(current.publishedSpec, url),
      });
    }
  }
  return current;
}

/** Link de avaliações da conta: o do site mais recente que tem um (a lista vem mais nova antes). */
export function accountReviewLink(
  sites: readonly Pick<SiteRecord, "spec">[],
): { url: string; businessName: string } | null {
  for (const site of sites) {
    const url = site.spec.business.googleReviewUrl;
    if (url) return { url, businessName: site.spec.business.name };
  }
  return null;
}
