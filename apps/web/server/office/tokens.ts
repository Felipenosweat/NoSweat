import { randomBytes } from "node:crypto";

// Link público do orçamento (/q/<token>) e da fatura (/i/<token>): quem tem o link vê o documento,
// sem conta. 24 bytes aleatórios = 32 caracteres base64url (192 bits), impossível de adivinhar.

export function newPublicToken(): string {
  return randomBytes(24).toString("base64url");
}

/** Formato aceito na busca pública (corta lixo antes de ir ao banco). */
export function isPublicToken(value: string): boolean {
  return /^[A-Za-z0-9_-]{32,128}$/.test(value);
}
