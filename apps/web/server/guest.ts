import { cookies } from "next/headers";
import { serviceConfig, updateAuthUserAppMetadata } from "./admin/auth-api";
import { GUEST_COOKIE } from "./guest-cookie";
import { getSiteStore } from "./store";

// "Experimente antes de criar conta": quem não está logado ganha um id de visitante num cookie
// (aleatório, impossível de adivinhar). Os sites criados assim ficam com owner_id nulo e
// guest_id = esse id. Ao entrar ou criar a conta, claimGuestSites passa os sites para a conta.
// Cadastro ainda sem e-mail confirmado: os sites NÃO mudam de dono (se o e-mail nunca for
// confirmado, o trabalho se perderia). O id do visitante fica guardado na conta
// (app_metadata.pending_guest_id, que só o servidor muda) e os sites passam quando o e-mail é
// confirmado, mesmo em outro aparelho (claimGuestSitesForUser).

export { GUEST_COOKIE };
const MAX_AGE = 60 * 60 * 24 * 30; // 30 dias
const GUEST_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Id do visitante (sem conta) que está navegando, ou `null`. */
export async function getGuestId(): Promise<string | null> {
  const value = (await cookies()).get(GUEST_COOKIE)?.value;
  return value && GUEST_ID.test(value) ? value : null;
}

/** Id do visitante, criando o cookie se ainda não existir. Só em Route Handlers e Server Actions. */
export async function ensureGuestId(): Promise<string> {
  const current = await getGuestId();
  if (current) return current;
  const id = crypto.randomUUID();
  (await cookies()).set(GUEST_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
  return id;
}

/**
 * Passa os sites que o visitante criou sem conta para a conta `userId` e apaga o cookie.
 * Pode ser chamada em qualquer lugar: num Server Component o cookie não pode ser apagado,
 * mas isso não faz mal (os sites já não têm mais guest_id).
 */
export async function claimGuestSites(userId: string): Promise<number> {
  const guestId = await getGuestId();
  if (!guestId) return 0;
  const claimed = await getSiteStore().claimGuestSites(guestId, userId);
  try {
    (await cookies()).delete(GUEST_COOKIE);
  } catch {
    // Server Component: não dá para mexer em cookies aqui.
  }
  return claimed;
}

/** Chave do app_metadata com o id de visitante guardado num cadastro ainda não confirmado. */
export const PENDING_GUEST_KEY = "pending_guest_id";

/** Passa para a conta os sites de um id de visitante (só os que ainda não têm dono). */
export async function claimGuestSitesById(guestId: string, userId: string): Promise<number> {
  if (!GUEST_ID.test(guestId)) return 0;
  return getSiteStore().claimGuestSites(guestId, userId);
}

/**
 * Cadastro sem sessão (falta confirmar o e-mail): guarda o id do visitante deste navegador na
 * conta, sem mexer nos sites nem no cookie (a pessoa continua editando aqui enquanto espera).
 * Sem a chave secreta do Supabase, não guarda: os sites passam quando ela entrar neste
 * navegador. Nunca lança.
 */
export async function rememberGuestForSignup(userId: string): Promise<void> {
  try {
    const guestId = await getGuestId();
    const config = serviceConfig();
    if (!guestId || !config) return;
    await updateAuthUserAppMetadata(config, userId, { [PENDING_GUEST_KEY]: guestId });
  } catch (error) {
    console.error("Could not save the guest id on the new account", error);
  }
}

/** Usuário do Supabase Auth (só o que importa aqui). */
export type ClaimingUser = { id: string; app_metadata?: unknown };

function pendingGuestId(appMetadata: unknown): string | null {
  if (!appMetadata || typeof appMetadata !== "object") return null;
  const value = (appMetadata as Record<string, unknown>)[PENDING_GUEST_KEY];
  return typeof value === "string" && GUEST_ID.test(value) ? value : null;
}

/**
 * Login ou e-mail confirmado: passa para a conta os sites do cookie deste navegador e os do id
 * guardado no cadastro (app_metadata.pending_guest_id), e apaga essa chave. Nunca lança: uma
 * falha aqui não pode impedir o login.
 */
export async function claimGuestSitesForUser(user: ClaimingUser): Promise<void> {
  try {
    await claimGuestSites(user.id);
  } catch (error) {
    console.error("Could not move guest sites to the account", error);
  }
  const pending = pendingGuestId(user.app_metadata);
  if (!pending) return;
  try {
    await claimGuestSitesById(pending, user.id);
    const config = serviceConfig();
    if (config) await updateAuthUserAppMetadata(config, user.id, { [PENDING_GUEST_KEY]: null });
  } catch (error) {
    console.error("Could not move the saved guest sites to the account", error);
  }
}
