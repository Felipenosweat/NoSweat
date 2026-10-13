import { isAdmin } from "./admin";
import { getCurrentUser, type CurrentUser } from "./auth/session";
import { getGuestId } from "./guest";
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

/** Quem está usando: uma conta, ou um visitante sem conta (ver server/guest.ts). */
export type Actor = { kind: "user"; user: CurrentUser } | { kind: "guest"; guestId: string };

/** Conta logada; senão o visitante (se já tiver cookie); senão `null`. */
export async function getActor(): Promise<Actor | null> {
  const user = await getCurrentUser();
  if (user) return { kind: "user", user };
  const guestId = await getGuestId();
  return guestId ? { kind: "guest", guestId } : null;
}

/**
 * Site que `actor` pode ver e editar (rascunho, prévia, versões, IA), ou `null` (= 404).
 * Visitante só acessa os sites que ele mesmo criou e que ainda não foram para uma conta.
 */
export async function getAccessibleSite(actor: Actor, id: string): Promise<SiteRecord | null> {
  if (actor.kind === "user") return getOwnedSite(actor.user, id);
  const site = await getSiteStore().get(id);
  return site && site.ownerId === null && site.guestId === actor.guestId ? site : null;
}

/** Conta ou visitante + site acessível, para as rotas que visitantes também usam. */
export async function requireSiteAccess(
  id: string,
): Promise<{ actor: Actor | null; site: SiteRecord | null }> {
  const actor = await getActor();
  if (!actor) return { actor: null, site: null };
  return { actor, site: await getAccessibleSite(actor, id) };
}

/** Usuário logado + site dele, para as rotas só de conta (publicar, domínio, mensagens). */
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

/** O rascunho tem mudanças que ainda não estão no ar? */
export function hasUnpublishedChanges(site: SiteRecord): boolean {
  if (site.status !== "published") return false;
  return JSON.stringify(site.spec) !== JSON.stringify(site.publishedSpec ?? site.spec);
}

/** O que os visitantes veem: a versão publicada (sites antigos, sem cópia, usam o rascunho). */
export function liveSpec(site: SiteRecord) {
  return site.publishedSpec ?? site.spec;
}
