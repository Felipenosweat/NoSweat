import { createHmac, timingSafeEqual } from "node:crypto";

// Segredos dos HMACs do servidor, um por finalidade (antes era um só: IP_HASH_SALT ou a chave
// secreta do Supabase, reaproveitada em 5 lugares; trocar a chave do Supabase quebrava os links
// de descadastro, os códigos TXT de domínio e os hashes de IP de uma vez).
//
// Ordem de busca de cada finalidade (ver DEPLOY.md, "Segredos de assinatura"):
// 1. NOSWEAT_SECRET_<FINALIDADE> (ex.: NOSWEAT_SECRET_UNSUBSCRIBE), separado por vírgula:
//    o primeiro é o ATUAL (assina), os outros são ANTERIORES (só conferem). Rotação = pôr o novo
//    na frente e tirar o velho depois que nada assinado com ele precisar valer.
// 2. NOSWEAT_SECRET (também aceita vírgulas): um segredo-mestre, derivado por finalidade com
//    HMAC(mestre, "nosweat-secret:v1:<finalidade>"). Um vazamento de um derivado não revela os outros.
// 3. O valor ANTIGO (NOSWEAT_SECRET_LEGACY, senão IP_HASH_SALT, senão SUPABASE_SERVICE_ROLE_KEY)
//    entra SÓ PARA CONFERIR, no fim da lista, enquanto houver coisa assinada com ele por aí
//    (links de descadastro já enviados: o CAN-SPAM pede 30 dias; códigos TXT `_nosweat` que o
//    cliente já criou; cookies "ver como" abertos). NOSWEAT_SECRET_LEGACY=off desliga.
//    TEMPORÁRIO: tirar depois que todos os ambientes tiverem segredos novos há mais de 30 dias.
// Sem nenhum segredo novo, o valor antigo continua assinando (nada muda até o dono configurar).
// Sem nada (dev local e testes), um valor fixo que só vale fora da produção.

export const SECRET_PURPOSES = [
  "view-as",
  "oauth-state",
  "domain-verify",
  "unsubscribe",
  "ip-hash",
] as const;
export type SecretPurpose = (typeof SECRET_PURPOSES)[number];

/** Variável de ambiente dedicada de cada finalidade. */
export const SECRET_ENV: Record<SecretPurpose, string> = {
  "view-as": "NOSWEAT_SECRET_VIEW_AS",
  "oauth-state": "NOSWEAT_SECRET_OAUTH_STATE",
  "domain-verify": "NOSWEAT_SECRET_DOMAIN_VERIFY",
  unsubscribe: "NOSWEAT_SECRET_UNSUBSCRIBE",
  "ip-hash": "NOSWEAT_SECRET_IP_HASH",
};

const DEV_SECRET = "dev-only-secret";

type Env = Record<string, string | undefined>;

function list(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

/** Segredo da finalidade derivado do mestre (o rótulo separa as finalidades). */
export function deriveSecret(master: string, purpose: SecretPurpose): string {
  return createHmac("sha256", master).update(`nosweat-secret:v1:${purpose}`).digest("hex");
}

/** O segredo único de antes (`null` se desligado com NOSWEAT_SECRET_LEGACY=off ou ausente). */
export function legacySecret(env: Env = process.env): string | null {
  const pinned = env.NOSWEAT_SECRET_LEGACY?.trim();
  if (pinned?.toLowerCase() === "off") return null;
  return pinned || env.IP_HASH_SALT || env.SUPABASE_SERVICE_ROLE_KEY || null;
}

/** Segredos novos (sem o antigo): [atual, ...anteriores], ou [] se o dono ainda não configurou. */
function configuredSecrets(purpose: SecretPurpose, env: Env): string[] {
  const own = list(env[SECRET_ENV[purpose]]);
  if (own.length > 0) return own;
  return list(env.NOSWEAT_SECRET).map((master) => deriveSecret(master, purpose));
}

let warned = false;

/**
 * Segredos da finalidade: o primeiro ASSINA, todos CONFEREM (o antigo vai no fim, só para
 * conferir). Nunca vazio.
 */
export function secretsFor(purpose: SecretPurpose, env: Env = process.env): string[] {
  if (purpose === "ip-hash") return [ipHashSecret(env)];
  const configured = configuredSecrets(purpose, env);
  const legacy = legacySecret(env);
  const all = configured.length > 0 ? [...configured, ...(legacy ? [legacy] : [])] : [];
  if (all.length === 0) {
    if (legacy) {
      if (!warned && env.VERCEL_ENV === "production") {
        warned = true;
        console.warn(
          "[secret] NOSWEAT_SECRET is not set: still signing with the legacy secret. See DEPLOY.md.",
        );
      }
      return [legacy];
    }
    if (env.VERCEL_ENV === "production") {
      throw new Error("NOSWEAT_SECRET is not set in production. See DEPLOY.md.");
    }
    return [DEV_SECRET];
  }
  return [...new Set(all)];
}

/** Segredo que assina agora (o primeiro da lista). */
export function signingSecret(purpose: SecretPurpose, env: Env = process.env): string {
  return secretsFor(purpose, env)[0] ?? DEV_SECRET;
}

/**
 * Sal do hash de IP. Hash não se "confere" com vários segredos: trocar o sal muda todos os
 * hashes, e aí os limites anti-abuso por IP (visitantes, formulário) e a contagem de visitas
 * únicas recomeçam do zero. Por isso o padrão continua sendo o valor ANTIGO (IP_HASH_SALT ou a
 * chave do Supabase); só muda quando o dono define NOSWEAT_SECRET_IP_HASH de propósito (o ideal é
 * definir com o MESMO valor antigo antes de trocar a chave do Supabase, ver DEPLOY.md).
 */
export function ipHashSecret(env: Env = process.env): string {
  const own = list(env[SECRET_ENV["ip-hash"]])[0];
  if (own) return own;
  const legacy = legacySecret(env);
  if (legacy) return legacy;
  const master = list(env.NOSWEAT_SECRET)[0];
  if (master) return deriveSecret(master, "ip-hash");
  if (env.VERCEL_ENV === "production") {
    throw new Error("NOSWEAT_SECRET is not set in production. See DEPLOY.md.");
  }
  return DEV_SECRET;
}

/** Compara dois textos em tempo constante (tamanhos diferentes = falso). */
export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
