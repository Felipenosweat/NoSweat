import { revalidateTag, unstable_cache } from "next/cache";

// Cache curto das leituras do painel do admin (contas, sites, planos, uso da IA). Cada aba do
// /admin lia tudo de novo a cada clique; agora a leitura fica no cache do Next por até 30
// segundos, com a etiqueta "admin". Toda ação do admin (actions.ts das páginas do /admin) chama
// revalidateAdmin(): o admin sempre vê na hora o que ele mesmo mudou. O que muda por fora
// (cliente publicou, webhook do Stripe, pedido novo) aparece em até 30 segundos.
// Só leituras de servidor sem cookies: quem chama já passou por requireAdmin().

export const ADMIN_CACHE_TAG = "admin";
export const ADMIN_CACHE_REVALIDATE_S = 30;

/**
 * Guarda o resultado de `fn` no cache do Next (chave `admin:<key>`). O resultado vira JSON: só
 * dados simples (nada de Map, Set ou Date). Erro não fica no cache (a próxima leitura tenta de novo).
 */
export function adminCached<T>(key: string, fn: () => Promise<T>): () => Promise<T> {
  return unstable_cache(fn, ["admin", key], {
    tags: [ADMIN_CACHE_TAG],
    revalidate: ADMIN_CACHE_REVALIDATE_S,
  });
}

/**
 * Expira o cache do admin na hora (`expire: 0`, como store/revalidate.ts): a próxima leitura já
 * vem do banco. Fora de um request do Next (testes, scripts) não há cache: ignora em silêncio.
 */
export function revalidateAdmin(): void {
  try {
    revalidateTag(ADMIN_CACHE_TAG, { expire: 0 });
  } catch (error) {
    if (process.env.NODE_ENV !== "test") {
      console.warn("[cache] could not revalidate", ADMIN_CACHE_TAG, error);
    }
  }
}
