import { createHash } from "node:crypto";
import { headers } from "next/headers";

/**
 * Hash do IP de quem fez o pedido (SHA-256 com sal). Nunca guardamos o IP puro.
 * Route Handlers podem passar `request.headers`; sem isso, lê os headers do request atual.
 */
export async function requestIpHash(source?: Headers): Promise<string | null> {
  const h = source ?? (await headers());
  // Na Vercel, x-real-ip é o IP do visitante (x-forwarded-for pode vir com valores do cliente).
  const ip = h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (!ip) return null;
  const salt = process.env.IP_HASH_SALT ?? "nosweat-ip";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}
