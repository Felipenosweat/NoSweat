import { isAdmin } from "./admin";
import { getCurrentUser, type CurrentUser } from "./auth/session";
import { getSiteStore, type SiteRecord } from "./store";

/**
 * Site do usuário logado, ou `null` se não existir ou for de outra pessoa (tratamos igual: 404).
 * Admins da plataforma acessam qualquer site.
 */
export async function getOwnedSite(user: CurrentUser, id: string): Promise<SiteRecord | null> {
  const site = await getSiteStore().get(id);
  if (!site) return null;
  if (site.ownerId === user.id) return site;
  return (await isAdmin(user.id)) ? site : null;
}

/** Usuário logado + site dele, para as rotas da API. */
export async function requireOwnedSite(
  id: string,
): Promise<{ user: CurrentUser | null; site: SiteRecord | null }> {
  const user = await getCurrentUser();
  if (!user) return { user: null, site: null };
  return { user, site: await getOwnedSite(user, id) };
}

/** Endereço público do site: domínio próprio (se houver) ou o grátis em /s/<slug>. */
export function publicUrl(site: SiteRecord, origin: string): string | null {
  if (site.status !== "published") return null;
  if (site.customDomain) return `https://${site.customDomain}`;
  return site.slug ? `${origin}/s/${site.slug}` : null;
}

/** Endereço grátis, mesmo quando há domínio próprio (útil enquanto o DNS não propaga). */
export function freeUrl(site: SiteRecord, origin: string): string | null {
  return site.slug ? `${origin}/s/${site.slug}` : null;
}
