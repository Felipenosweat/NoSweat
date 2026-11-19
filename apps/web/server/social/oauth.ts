import { createHmac, randomBytes } from "node:crypto";
import { safeEqual, secretsFor, signingSecret } from "@/server/secret";

// `state` do OAuth do Instagram: nonce aleatório + validade de 10 min + HMAC amarrado ao usuário.
// O mesmo valor vai num cookie httpOnly (ns_ig_state); na volta, o `state` da URL precisa ser igual
// ao do cookie, ter assinatura válida para quem está logado e não ter vencido (proteção CSRF).

export const OAUTH_STATE_COOKIE = "ns_ig_state";
export const OAUTH_STATE_TTL_S = 10 * 60;

function sign(userId: string, nonce: string, expires: string, secret: string): string {
  return createHmac("sha256", secret)
    .update(`ig-oauth-state:${userId}:${nonce}:${expires}`)
    .digest("base64url");
}

export function createOAuthState(
  userId: string,
  now: number = Date.now(),
): { state: string; cookieValue: string } {
  const nonce = randomBytes(16).toString("base64url");
  const expires = String(Math.floor(now / 1000) + OAUTH_STATE_TTL_S);
  const state = `${nonce}.${expires}.${sign(userId, nonce, expires, signingSecret("oauth-state"))}`;
  return { state, cookieValue: state };
}

export function verifyOAuthState(
  stateParam: string | null | undefined,
  cookieValue: string | null | undefined,
  userId: string,
  now: number = Date.now(),
): boolean {
  if (!stateParam || !cookieValue || !safeEqual(stateParam, cookieValue)) return false;
  const [nonce, expires, signature, extra] = stateParam.split(".");
  if (!nonce || !expires || !signature || extra !== undefined) return false;
  if (!/^\d+$/.test(expires) || Number(expires) * 1000 < now) return false;
  // Assinado com o segredo atual ou um anterior (rotação): confere com todos, em tempo constante.
  let valid = false;
  for (const secret of secretsFor("oauth-state")) {
    if (safeEqual(signature, sign(userId, nonce, expires, secret))) valid = true;
  }
  return valid;
}
