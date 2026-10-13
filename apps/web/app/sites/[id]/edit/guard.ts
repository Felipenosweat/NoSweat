import { notFound, redirect } from "next/navigation";
import { getAccessibleSite, getActor, type Actor } from "@/server/sites";
import type { SiteRecord } from "@/server/store";

/**
 * Proteção do editor e da prévia do editor (/sites/[id]/edit e /sites/[id]/edit/canvas).
 * Vale para conta ou visitante sem conta (o site que ele mesmo criou, ver server/guest.ts).
 * Sem acesso e sem conta logada pode ser o dono com a sessão vencida: vai para o login
 * (o redirecionamento não revela se o site existe). Conta logada sem acesso = 404.
 */
export async function requireEditableSite(id: string): Promise<{ actor: Actor; site: SiteRecord }> {
  const actor = await getActor();
  const site = actor ? await getAccessibleSite(actor, id) : null;
  if (!actor || !site) {
    if (actor?.kind !== "user") redirect(`/login?next=/sites/${encodeURIComponent(id)}/edit`);
    notFound();
  }
  return { actor, site };
}
