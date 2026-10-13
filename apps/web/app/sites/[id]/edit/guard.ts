import { notFound, redirect } from "next/navigation";
import { getCurrentUser, type CurrentUser } from "@/server/auth/session";
import { getOwnedSite } from "@/server/sites";
import type { SiteRecord } from "@/server/store";

/**
 * Proteção do editor e da prévia do editor (/sites/[id]/edit e /sites/[id]/edit/canvas):
 * sem login vai para /login; site de outra pessoa (ou inexistente) é 404.
 */
export async function requireEditableSite(
  id: string,
): Promise<{ user: CurrentUser; site: SiteRecord }> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/sites/${encodeURIComponent(id)}/edit`);
  const site = await getOwnedSite(user, id);
  if (!site) notFound();
  return { user, site };
}
