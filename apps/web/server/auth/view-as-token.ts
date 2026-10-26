import { serverSecret } from "../secret";
import type { CurrentUser } from "./session";

// "Ver como esta conta" (só leitura): o admin abre o painel de outra conta para ver o que ela vê.
// O cookie httpOnly `ns_view_as` guarda `<id da conta>.<expira em (segundos)>.<hmac>`. O HMAC
// (SHA-256 com o segredo do servidor) amarra o cookie ao admin que pediu: copiado para outro
// navegador ou outra conta, não vale nada. Vale 1 hora.
// Usa Web Crypto (crypto.subtle), que existe no Node, no proxy.ts e nos testes.
// Sem imports do Next: o proxy.ts e os testes importam este arquivo direto.

export const VIEW_AS_COOKIE = "ns_view_as";
export const VIEW_AS_TTL_SECONDS = 60 * 60;

export const VIEW_AS_READ_ONLY_MESSAGE =
  "You're viewing another account (read-only). Exit view mode to make changes.";

/** Opções do cookie (httpOnly: o JavaScript da página nunca lê). */
export function viewAsCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: VIEW_AS_TTL_SECONDS,
  };
}

const TARGET_ID = /^[0-9A-Za-z-]{1,64}$/;
const encoder = new TextEncoder();

/** O que é assinado. O prefixo separa este HMAC dos outros que usam o mesmo segredo. */
function signedText(adminId: string, targetId: string, expiresAt: number) {
  return encoder.encode(`ns-view-as:v1:${adminId}:${targetId}:${expiresAt}`);
}

function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function toBase64Url(bytes: ArrayBuffer): string {
  let binary = "";
  for (const byte of new Uint8Array(bytes)) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(text: string) {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(text)) return null;
  try {
    const binary = atob(text.replace(/-/g, "+").replace(/_/g, "/"));
    return Uint8Array.from(binary, (char) => char.charCodeAt(0));
  } catch {
    return null;
  }
}

type TokenOptions = { secret?: string; now?: number };

const nowSeconds = (now?: number) => Math.floor((now ?? Date.now()) / 1000);

/** Valor do cookie para `adminId` ver a conta `targetId` por VIEW_AS_TTL_SECONDS. */
export async function signViewAsToken(
  adminId: string,
  targetId: string,
  options: TokenOptions = {},
): Promise<string> {
  if (!TARGET_ID.test(targetId)) throw new Error("Invalid account id.");
  const expiresAt = nowSeconds(options.now) + VIEW_AS_TTL_SECONDS;
  const key = await hmacKey(options.secret ?? serverSecret());
  const signature = await crypto.subtle.sign("HMAC", key, signedText(adminId, targetId, expiresAt));
  return `${targetId}.${expiresAt}.${toBase64Url(signature)}`;
}

/**
 * Id da conta que `adminId` está vendo, ou `null` se o cookie não vale (formato errado, vencido,
 * HMAC adulterado ou assinado para outra pessoa).
 */
export async function verifyViewAsToken(
  token: string,
  adminId: string,
  options: TokenOptions = {},
): Promise<string | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [targetId, rawExpiry, rawSignature] = parts as [string, string, string];
  if (!TARGET_ID.test(targetId) || !/^\d{1,12}$/.test(rawExpiry)) return null;

  const expiresAt = Number(rawExpiry);
  const now = nowSeconds(options.now);
  // Vencido, ou com validade maior do que a que damos (ninguém assina isso).
  if (expiresAt <= now || expiresAt > now + VIEW_AS_TTL_SECONDS + 60) return null;

  const signature = fromBase64Url(rawSignature);
  if (!signature) return null;
  const key = await hmacKey(options.secret ?? serverSecret());
  // `verify` compara em tempo constante.
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    signature,
    signedText(adminId, targetId, expiresAt),
  );
  return valid ? targetId : null;
}

export type ViewingAs = { id: string; email: string | null };

/**
 * Quem está olhando o painel: `user` é sempre a conta logada de verdade; `ownerId` é de quem
 * são os dados mostrados (a conta vista, ou a própria); `viewingAs` existe só no modo "ver como".
 */
export type Viewer = { user: CurrentUser; ownerId: string; viewingAs: ViewingAs | null };

export type ResolveViewerInput = {
  user: CurrentUser;
  /** Valor do cookie `ns_view_as` (se houver). */
  token: string | null | undefined;
  isAdmin: (userId: string) => Promise<boolean>;
  /** Acha a conta vista (`null` se ela não existe mais). */
  findAccount: (userId: string) => Promise<ViewingAs | null>;
} & TokenOptions;

/**
 * Decide de quem são os dados do painel. O cookie só vale se a conta logada for admin, o HMAC
 * e a validade conferirem e a conta vista existir; em qualquer outro caso, a própria conta.
 */
export async function resolveViewer(input: ResolveViewerInput): Promise<Viewer> {
  const self: Viewer = { user: input.user, ownerId: input.user.id, viewingAs: null };
  if (!input.token) return self;
  const targetId = await verifyViewAsToken(input.token, input.user.id, input);
  if (!targetId || targetId === input.user.id) return self;
  if (!(await input.isAdmin(input.user.id))) return self;
  const target = await input.findAccount(targetId);
  if (!target) return self;
  return {
    user: input.user,
    ownerId: target.id,
    viewingAs: { id: target.id, email: target.email },
  };
}

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

// Rotas da API que não agem em nome da conta logada (formulário público dos sites, links de
// e-mail, avisos do Stripe e da Meta, crons): continuam funcionando no modo "ver como".
const PUBLIC_API = [
  /^\/api\/sites\/[^/]+\/leads\/?$/,
  /^\/api\/unsubscribe\/?$/,
  /^\/api\/billing\/webhook\/?$/,
  /^\/api\/meta\//,
  /^\/api\/cron\//,
  // Resposta do cliente final ao orçamento pelo link público (não é dado da conta vista).
  /^\/api\/public\//,
];

/** No modo "ver como", este pedido mudaria dados? (non-GET em /api/*, menos as rotas públicas) */
export function isWriteBlockedWhileViewing(method: string, pathname: string): boolean {
  if (SAFE_METHODS.has(method.toUpperCase())) return false;
  if (!pathname.startsWith("/api/")) return false;
  return !PUBLIC_API.some((pattern) => pattern.test(pathname));
}
