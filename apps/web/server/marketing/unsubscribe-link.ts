import { createHmac, timingSafeEqual } from "node:crypto";
import { serverSecret } from "../secret";
import { normalizeEmail } from "./contacts";

// Link de "sair da lista" assinado: só quem recebeu o e-mail consegue tirar aquele endereço da
// lista (ninguém descadastra outra pessoa trocando o e-mail na URL). Não expira, como pede o
// CAN-SPAM (o link tem que funcionar por pelo menos 30 dias depois do envio).

export function unsubscribeToken(email: string, secret: string = serverSecret()): string {
  return createHmac("sha256", secret)
    .update(`unsubscribe:${normalizeEmail(email)}`)
    .digest("base64url")
    .slice(0, 32);
}

export function isValidUnsubscribeToken(
  email: string,
  token: string,
  secret: string = serverSecret(),
): boolean {
  const expected = Buffer.from(unsubscribeToken(email, secret));
  const given = Buffer.from(token);
  return expected.length === given.length && timingSafeEqual(expected, given);
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
