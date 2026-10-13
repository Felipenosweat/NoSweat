import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { isIP } from "node:net";

/**
 * Parte do IP que identifica "uma pessoa/rede" para os limites anti-abuso:
 * IPv4 inteiro; IPv6 só o prefixo /64 (cada casa recebe um /64 inteiro, então trocar o resto do
 * endereço não pode virar um jeito de fugir dos limites).
 */
export function ipBucket(ip: string): string | null {
  const value = ip.trim();
  const version = isIP(value);
  if (version === 4) return value;
  if (version !== 6) return null;
  // IPv4 dentro de IPv6 (::ffff:1.2.3.4) conta como o IPv4.
  const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i.exec(value);
  if (mapped?.[1]) return mapped[1];
  const [head = "", tail = ""] = value.toLowerCase().split("::");
  const left = head ? head.split(":") : [];
  const right = tail ? tail.split(":") : [];
  const groups = value.includes("::")
    ? [...left, ...Array<string>(8 - left.length - right.length).fill("0"), ...right]
    : left;
  return `${groups
    .slice(0, 4)
    .map((group) => group.padStart(4, "0"))
    .join(":")}::/64`;
}

// Segredo do hash: IP_HASH_SALT, ou a chave secreta do Supabase (já existe em produção e nunca
// está no código). Sem segredo, o hash poderia ser revertido testando todos os IPv4.
function secret(): string {
  return process.env.IP_HASH_SALT ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "dev-only-ip-salt";
}

/**
 * Hash do IP de quem fez o pedido (HMAC-SHA256 com segredo). Nunca guardamos o IP puro.
 * Route Handlers podem passar `request.headers`; sem isso, lê os headers do request atual.
 */
export async function requestIpHash(source?: Headers): Promise<string | null> {
  const h = source ?? (await headers());
  // Na Vercel, x-real-ip é o IP do visitante (x-forwarded-for pode vir com valores do cliente).
  const ip = h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim();
  const bucket = ip ? ipBucket(ip) : null;
  if (!bucket) return null;
  return createHmac("sha256", secret()).update(bucket).digest("hex");
}
