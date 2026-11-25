import { unstable_cache } from "next/cache";
import { ownerHasFeature } from "../billing";
import { ownerCanAfford } from "../credits";
import { ownerTag, PUBLIC_SITE_REVALIDATE_S, siteTag } from "../store/revalidate";
import { assistantAiReady } from "./ai";
import { getAssistantStore } from "./store";

// O site publicado mostra o botão do atendente? Lido pelas páginas públicas (/s/<slug> e
// /d/<host>) com o mesmo cache delas (etiquetas site:<id> e owner:<dono>, até 1 hora): ligar ou
// desligar o atendente, ficar sem créditos no chat ou mudar o plano limpam o cache na hora.
// Separado de service.ts: unstable_cache só funciona dentro do Next.

/**
 * `true` quando: há IA configurada, o dono ligou o atendente neste site, o plano dele inclui o
 * atendente (Premium) e ele ainda tem créditos. Erro no banco = sem botão (o site continua).
 */
export function assistantWidgetEnabled(siteId: string, ownerId: string | null): Promise<boolean> {
  if (!ownerId || !assistantAiReady()) return Promise.resolve(false);
  return unstable_cache(
    async (): Promise<boolean> => {
      try {
        if (!(await getAssistantStore().isEnabled(siteId))) return false;
        const [feature, credits] = await Promise.all([
          ownerHasFeature(ownerId, "aiAssistant"),
          ownerCanAfford(ownerId, "assistant_chat"),
        ]);
        return feature && credits;
      } catch (error) {
        console.error("[assistant] could not check the widget", error);
        return false;
      }
    },
    ["assistant-widget", siteId],
    { tags: [siteTag(siteId), ownerTag(ownerId)], revalidate: PUBLIC_SITE_REVALIDATE_S },
  )();
}
