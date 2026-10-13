import { cookies } from "next/headers";
import { GUEST_COOKIE } from "./guest-cookie";
import { getSiteStore } from "./store";

// "Experimente antes de criar conta": quem não está logado ganha um id de visitante num cookie
// (aleatório, impossível de adivinhar). Os sites criados assim ficam com owner_id nulo e
// guest_id = esse id. Ao entrar ou criar a conta, claimGuestSites passa os sites para a conta.

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
