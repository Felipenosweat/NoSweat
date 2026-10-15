import { isAdmin } from "./admin";
import { errorResponse } from "./http";
import { requestIpHash } from "./ip";
import type { Actor } from "./sites";
import { getSiteStore, type AiUsageKind } from "./store";

// Limite diário de uso da IA (controle de custo). Admins não têm limite.
// Valores padrão abaixo; dá para mudar sem deploy de código pelas variáveis de ambiente.
//
// Visitantes sem conta têm três travas: por visitante (cookie), por IP (quem apaga o cookie
// continua limitado) e um teto global por dia somando todos os visitantes (custo máximo).

const DEFAULTS: Record<AiUsageKind, number> = {
  generate: 5,
  ai_edit: 30,
  social_plan: 3,
  social_caption: 30,
};
const ENV: Record<AiUsageKind, string> = {
  generate: "AI_DAILY_GENERATIONS",
  ai_edit: "AI_DAILY_EDITS",
  social_plan: "AI_DAILY_SOCIAL_PLANS",
  social_caption: "AI_DAILY_SOCIAL_CAPTIONS",
};

type GuestLimits = { perGuest: number; perIp: number; global: number };
const GUEST_DEFAULTS: Record<AiUsageKind, GuestLimits> = {
  generate: { perGuest: 2, perIp: 4, global: 300 },
  ai_edit: { perGuest: 5, perIp: 15, global: 2000 },
  // Redes sociais são só para contas: visitante sempre recebe 429.
  social_plan: { perGuest: 0, perIp: 0, global: 0 },
  social_caption: { perGuest: 0, perIp: 0, global: 0 },
};
const GUEST_ENV: Record<AiUsageKind, Record<keyof GuestLimits, string>> = {
  generate: {
    perGuest: "GUEST_DAILY_GENERATIONS",
    perIp: "GUEST_IP_DAILY_GENERATIONS",
    global: "GUEST_GLOBAL_DAILY_GENERATIONS",
  },
  ai_edit: {
    perGuest: "GUEST_DAILY_EDITS",
    perIp: "GUEST_IP_DAILY_EDITS",
    global: "GUEST_GLOBAL_DAILY_EDITS",
  },
  social_plan: {
    perGuest: "GUEST_DAILY_SOCIAL_PLANS",
    perIp: "GUEST_IP_DAILY_SOCIAL_PLANS",
    global: "GUEST_GLOBAL_DAILY_SOCIAL_PLANS",
  },
  social_caption: {
    perGuest: "GUEST_DAILY_SOCIAL_CAPTIONS",
    perIp: "GUEST_IP_DAILY_SOCIAL_CAPTIONS",
    global: "GUEST_GLOBAL_DAILY_SOCIAL_CAPTIONS",
  },
};

const LABELS: Record<AiUsageKind, string> = {
  generate: "new websites",
  ai_edit: "AI changes",
  social_plan: "AI month plans",
  social_caption: "AI captions",
};

function envNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  const value = Number(raw);
  return raw !== undefined && raw !== "" && Number.isFinite(value) && value >= 0 ? value : fallback;
}

export function dailyLimit(kind: AiUsageKind): number {
  return envNumber(ENV[kind], DEFAULTS[kind]);
}

export function guestLimits(kind: AiUsageKind): GuestLimits {
  const env = GUEST_ENV[kind];
  const defaults = GUEST_DEFAULTS[kind];
  return {
    perGuest: envNumber(env.perGuest, defaults.perGuest),
    perIp: envNumber(env.perIp, defaults.perIp),
    global: envNumber(env.global, defaults.global),
  };
}

const since24h = () => new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

type Counts = { byGuest: number; byIp: number; total: number };

async function guestCounts(
  actor: Extract<Actor, { kind: "guest" }>,
  kind: AiUsageKind,
  ipHash: string | null,
): Promise<Counts> {
  const store = getSiteStore();
  const since = since24h();
  const [byGuest, byIp, total] = await Promise.all([
    store.countGuestAiUsage({ guestId: actor.guestId }, kind, since),
    ipHash ? store.countGuestAiUsage({ ipHash }, kind, since) : Promise.resolve(0),
    store.countGuestAiUsage({}, kind, since),
  ]);
  return { byGuest, byIp, total };
}

/** Quantos usos ainda restam nas últimas 24h (`null` = sem limite). */
export async function remainingUses(actor: Actor, kind: AiUsageKind): Promise<number | null> {
  if (actor.kind === "guest") {
    const limits = guestLimits(kind);
    const used = await guestCounts(actor, kind, await requestIpHash());
    return Math.max(
      0,
      Math.min(
        limits.perGuest - used.byGuest,
        limits.perIp - used.byIp,
        limits.global - used.total,
      ),
    );
  }
  if (await isAdmin(actor.user.id)) return null;
  const used = await getSiteStore().countAiUsage(actor.user.id, kind, since24h());
  return Math.max(0, dailyLimit(kind) - used);
}

const SIGN_UP_HINT = "Create a free account to keep going.";

function userLimitResponse(kind: AiUsageKind): Response {
  return errorResponse(
    429,
    "quota_exceeded",
    `You've reached today's limit of ${dailyLimit(kind)} ${LABELS[kind]}. Please try again tomorrow.`,
  );
}

/** 429 do visitante se `used` passou de algum limite (`over` diz o que é "passou"). */
function guestLimitResponse(
  kind: AiUsageKind,
  used: Counts,
  over: (n: number, limit: number) => boolean,
): Response | null {
  const limits = guestLimits(kind);
  if (over(used.total, limits.global)) {
    return errorResponse(
      429,
      "quota_exceeded",
      `Lots of people are building right now. ${SIGN_UP_HINT}`,
    );
  }
  if (over(used.byGuest, limits.perGuest) || over(used.byIp, limits.perIp)) {
    return errorResponse(
      429,
      "quota_exceeded",
      `You've used today's free ${LABELS[kind]}. ${SIGN_UP_HINT}`,
    );
  }
  return null;
}

/**
 * Reserva um uso da IA ANTES de chamá-la. Devolve a resposta 429 pronta se passou do limite,
 * senão `null` (o uso já ficou registrado).
 *
 * Ordem: confere → registra → confere de novo. Registrar antes de chamar a IA (que demora
 * segundos) impede que vários pedidos ao mesmo tempo passem todos pelo limite; a primeira
 * conferência evita registrar pedidos de quem já estava no limite.
 * Se a IA falhar, o uso continua contado (custo: no máximo um crédito perdido por falha).
 */
export async function reserveUse(actor: Actor, kind: AiUsageKind): Promise<Response | null> {
  const store = getSiteStore();

  if (actor.kind === "user") {
    if (await isAdmin(actor.user.id)) {
      await store.recordAiUsage(actor.user.id, kind);
      return null;
    }
    const limit = dailyLimit(kind);
    const before = await store.countAiUsage(actor.user.id, kind, since24h());
    if (before >= limit) return userLimitResponse(kind);
    await store.recordAiUsage(actor.user.id, kind);
    const after = await store.countAiUsage(actor.user.id, kind, since24h());
    return after > limit ? userLimitResponse(kind) : null;
  }

  const ipHash = await requestIpHash();
  const before = guestLimitResponse(kind, await guestCounts(actor, kind, ipHash), (n, l) => n >= l);
  if (before) return before;
  await store.recordGuestAiUsage({ guestId: actor.guestId, ipHash }, kind);
  return guestLimitResponse(kind, await guestCounts(actor, kind, ipHash), (n, l) => n > l);
}

/**
 * Limite de salvamentos (cada um vira uma versão no banco): 120 por hora por site. Sem isso,
 * qualquer um com um site (inclusive visitante sem conta) poderia encher o banco em loop.
 */
export const SAVES_PER_SITE_PER_HOUR = 120;

export async function savesExceeded(siteId: string): Promise<Response | null> {
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const saves = await getSiteStore().countVersions(siteId, hourAgo);
  if (saves < SAVES_PER_SITE_PER_HOUR) return null;
  return errorResponse(
    429,
    "quota_exceeded",
    "You're saving very fast. Please wait a few minutes and try again.",
  );
}
