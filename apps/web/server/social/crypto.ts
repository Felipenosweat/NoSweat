import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// Criptografia dos tokens de acesso das redes sociais (AES-256-GCM).
// SOCIAL_TOKEN_KEYS = "v2:<base64 de 32 bytes>,v1:<base64>": a PRIMEIRA chave criptografa e todas
// descriptografam (troca de chave sem perder as contas: o cron de renovação recriptografa).
// Gerar uma chave: `openssl rand -base64 32`. Guarde uma cópia: sem ela, todos precisam reconectar.
// O texto salvo é "<versão>:<iv>:<dados>:<tag>" (base64url). O AAD amarra o token à conta
// (`<dono>:<rede>:<id externo>`): um token copiado para outra linha não abre.

type Key = { version: string; key: Buffer };

// Chave fixa só para dev local e testes (sem Supabase não existe dado real para proteger).
const DEV_KEY: Key = { version: "dev", key: Buffer.alloc(32, 7) };

export class SocialCryptoError extends Error {}

function parseKeys(raw: string): Key[] {
  return raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const at = part.indexOf(":");
      if (at <= 0)
        throw new SocialCryptoError("SOCIAL_TOKEN_KEYS entries must look like v1:<base64>.");
      const version = part.slice(0, at);
      const key = Buffer.from(part.slice(at + 1), "base64");
      if (!/^[A-Za-z0-9_-]{1,16}$/.test(version) || key.length !== 32) {
        throw new SocialCryptoError("Each SOCIAL_TOKEN_KEYS key must be 32 bytes in base64.");
      }
      return { version, key };
    });
}

function supabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/** Chaves disponíveis. Sem SOCIAL_TOKEN_KEYS: chave de dev só sem Supabase; com Supabase, nenhuma. */
function keys(): Key[] {
  const raw = process.env.SOCIAL_TOKEN_KEYS;
  if (raw && raw.trim()) return parseKeys(raw);
  return supabaseConfigured() ? [] : [DEV_KEY];
}

/** `false` em produção sem SOCIAL_TOKEN_KEYS: aí conectar contas fica desligado. */
export function socialCryptoConfigured(): boolean {
  try {
    return keys().length > 0;
  } catch {
    return false;
  }
}

export function currentKeyVersion(): string | null {
  return keys()[0]?.version ?? null;
}

export function tokenAad(ownerId: string, provider: string, externalId: string): string {
  return `${ownerId}:${provider}:${externalId}`;
}

const b64 = (buf: Buffer) => buf.toString("base64url");

export function encryptToken(plain: string, aad: string): { value: string; version: string } {
  const key = keys()[0];
  if (!key) throw new SocialCryptoError("SOCIAL_TOKEN_KEYS is not configured.");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key.key, iv);
  cipher.setAAD(Buffer.from(aad));
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { value: `${key.version}:${b64(iv)}:${b64(data)}:${b64(tag)}`, version: key.version };
}

export function decryptToken(value: string, aad: string): string {
  const [version, iv, data, tag] = value.split(":");
  const key = keys().find((k) => k.version === version);
  if (!key || !iv || data === undefined || !tag) {
    throw new SocialCryptoError("This token was encrypted with a key that is not configured.");
  }
  try {
    const decipher = createDecipheriv("aes-256-gcm", key.key, Buffer.from(iv, "base64url"));
    decipher.setAAD(Buffer.from(aad));
    decipher.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([
      decipher.update(Buffer.from(data, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    throw new SocialCryptoError("Could not decrypt the token.");
  }
}
