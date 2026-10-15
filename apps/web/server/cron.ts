import { timingSafeEqual } from "node:crypto";

// Proteção das rotas de cron (/api/cron/*). O Cron da Vercel manda
// `Authorization: Bearer CRON_SECRET`. Sem a variável CRON_SECRET, recusa tudo.
export function isCronAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}
