import { createHmac } from "node:crypto";
import { resolveTxt } from "node:dns/promises";
import type { DnsRecord } from "@nosweat/schema";
import { safeEqual, secretsFor, signingSecret } from "../secret";

// Prova de que o cliente é dono do domínio: antes de ligar `dominio.com`, ele cria um registro
// TXT `_nosweat.dominio.com` com um código nosso. Sem isso, qualquer conta poderia "pegar" um
// domínio que ainda aponta para a Vercel (ex.: de um ex-cliente) ou reservar o domínio de outro.

export const VERIFY_HOST = "_nosweat";

/**
 * Código do dono `ownerId` para `domain` (o mesmo dono pode trocar o domínio de site).
 * Determinístico: a tela mostra o código do segredo ATUAL; `secret` só para testes.
 */
export function verificationToken(
  ownerId: string,
  domain: string,
  secret: string = signingSecret("domain-verify"),
): string {
  return createHmac("sha256", secret)
    .update(`domain-verify:${ownerId}:${domain}`)
    .digest("hex")
    .slice(0, 32);
}

/**
 * Valores de TXT aceitos: o do segredo atual e os dos anteriores. Quem criou o TXT com o código
 * mostrado antes de uma troca de segredo (inclusive o segredo antigo do Supabase) continua valendo.
 */
export function acceptedVerificationValues(ownerId: string, domain: string): string[] {
  return secretsFor("domain-verify").map(
    (secret) => `nosweat-verify=${verificationToken(ownerId, domain, secret)}`,
  );
}

export function verificationRecord(ownerId: string, domain: string): DnsRecord {
  return {
    type: "TXT",
    name: VERIFY_HOST,
    value: `nosweat-verify=${verificationToken(ownerId, domain)}`,
  };
}

/** `true` se o TXT `_nosweat.<domain>` tem o código certo. Erro de DNS = ainda não. */
export async function isDomainVerified(ownerId: string, domain: string): Promise<boolean> {
  const accepted = acceptedVerificationValues(ownerId, domain);
  try {
    const records = await resolveTxt(`${VERIFY_HOST}.${domain}`);
    return records.some((chunks) => {
      const value = chunks.join("").trim();
      // Compara com todos (sem parar no primeiro) e em tempo constante.
      return accepted.map((expected) => safeEqual(value, expected)).some(Boolean);
    });
  } catch {
    return false;
  }
}
