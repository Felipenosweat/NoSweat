import { createHmac } from "node:crypto";
import { resolveTxt } from "node:dns/promises";
import type { DnsRecord } from "@nosweat/schema";
import { serverSecret } from "../secret";

// Prova de que o cliente é dono do domínio: antes de ligar `dominio.com`, ele cria um registro
// TXT `_nosweat.dominio.com` com um código nosso. Sem isso, qualquer conta poderia "pegar" um
// domínio que ainda aponta para a Vercel (ex.: de um ex-cliente) ou reservar o domínio de outro.

export const VERIFY_HOST = "_nosweat";

/** Código do dono `ownerId` para `domain` (o mesmo dono pode trocar o domínio de site). */
export function verificationToken(ownerId: string, domain: string): string {
  return createHmac("sha256", serverSecret())
    .update(`domain-verify:${ownerId}:${domain}`)
    .digest("hex")
    .slice(0, 32);
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
  const expected = verificationRecord(ownerId, domain).value;
  try {
    const records = await resolveTxt(`${VERIFY_HOST}.${domain}`);
    return records.some((chunks) => chunks.join("").trim() === expected);
  } catch {
    return false;
  }
}
