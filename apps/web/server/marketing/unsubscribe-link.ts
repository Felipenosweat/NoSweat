import { createHmac } from "node:crypto";
import { safeEqual, secretsFor, signingSecret } from "../secret";
import { normalizeEmail } from "./contacts";

// Link de "sair da lista" assinado: só quem recebeu o e-mail consegue tirar aquele endereço da
// lista (ninguém descadastra outra pessoa trocando o e-mail na URL). Não expira, como pede o
// CAN-SPAM (o link tem que funcionar por pelo menos 30 dias depois do envio). Por isso a
// conferência aceita o segredo atual E os anteriores (rotação; ver server/secret.ts): um link
// enviado antes da troca continua tirando o e-mail da lista.

export function unsubscribeToken(
  email: string,
  secret: string = signingSecret("unsubscribe"),
): string {
  return createHmac("sha256", secret)
    .update(`unsubscribe:${normalizeEmail(email)}`)
    .digest("base64url")
    .slice(0, 32);
}

/** `secrets`: só para testes (padrão: o atual e os anteriores). Uma string = um segredo só. */
export function isValidUnsubscribeToken(
  email: string,
  token: string,
  secrets: string | readonly string[] = secretsFor("unsubscribe"),
): boolean {
  const list = typeof secrets === "string" ? [secrets] : secrets;
  // Confere com todos (sem parar no primeiro que bate) e em tempo constante.
  return list.map((secret) => safeEqual(unsubscribeToken(email, secret), token)).some(Boolean);
}

/** Página de confirmação (link no corpo do e-mail). */
export function unsubscribePageUrl(origin: string, email: string): string {
  const params = new URLSearchParams({
    email: normalizeEmail(email),
    token: unsubscribeToken(email),
  });
  return `${origin.replace(/\/+$/, "")}/unsubscribe?${params.toString()}`;
}

/** Endpoint de um clique (cabeçalho List-Unsubscribe, RFC 8058), usado pelo Gmail/Yahoo. */
export function oneClickUnsubscribeUrl(origin: string, email: string): string {
  const params = new URLSearchParams({
    email: normalizeEmail(email),
    token: unsubscribeToken(email),
  });
  return `${origin.replace(/\/+$/, "")}/api/unsubscribe?${params.toString()}`;
}
