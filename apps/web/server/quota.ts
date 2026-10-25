import { isAdmin } from "./admin";
import { refundCredits, spendCredits, usesLeft } from "./credits";
import { errorResponse } from "./http";
import { requestIpHash } from "./ip";
import type { Actor } from "./sites";
import { getSiteStore, type AiUsageKind } from "./store";

// Limites de uso da IA (controle de custo). Admins não têm limite.
//
// Contas: o limite de verdade são os CRÉDITOS do mês (server/credits: cota do plano que zera
// todo mês + créditos comprados que não vencem). O limite diário abaixo continua como trava
// contra abuso (rajadas); valores padrão abaixo, ajustáveis pelas variáveis de ambiente.
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

/** Para visitantes ("today's free websites": "free new websites" lia estranho). */
const GUEST_LABELS: Record<AiUsageKind, string> = { ...LABELS, generate: "websites" };

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
  const [used, byCredits] = await Promise.all([
    getSiteStore().countAiUsage(actor.user.id, kind, since24h()),
    usesLeft(actor, kind),
  ]);
  const daily = Math.max(0, dailyLimit(kind) - used);
  return byCredits === null ? daily : Math.min(daily, byCredits);
}

/**
 * Convite para criar conta no fim das mensagens de limite do visitante. O /create tira esta
 * frase e mostra o link "Create a free account" no lugar (ver CreateFlow.tsx); o editor mostra
 * a mensagem inteira.
 */
const SIGN_UP_HINT = "Create a free account to keep going.";

function userLimitResponse(kind: AiUsageKind): Response {
  return errorResponse(
    429,
    "quota_exceeded",
    `You've reached the limit of ${dailyLimit(kind)} ${LABELS[kind]} for the last 24 hours. Please try again later.`,
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
      `You’ve used today’s free ${GUEST_LABELS[kind]}. ${SIGN_UP_HINT}`,
    );
  }
  return null;
}

/**
 * Reserva um uso da IA ANTES de chamá-la. Devolve a resposta pronta se passou do limite (402
 * `out_of_credits` sem créditos; 429 `quota_exceeded` no limite diário ou de visitante), senão
 * `null` (o uso já ficou registrado e os créditos já foram descontados).
 *
 * Ordem: confere → registra → confere de novo. Registrar antes de chamar a IA (que demora
 * segundos) impede que vários pedidos ao mesmo tempo passem todos pelo limite; a primeira
 * conferência evita registrar pedidos de quem já estava no limite.
 * Se a IA falhar, a rota chama `refundUse` (os créditos voltam; o uso continua no ai_usage, que
 * alimenta o custo do /admin e o limite diário).
 */
export async function reserveUse(
  actor: Actor,
  kind: AiUsageKind,
  siteId?: string | null,
): Promise<Response | null> {
  const store = getSiteStore();

  if (actor.kind === "user") {
    if (await isAdmin(actor.user.id)) {
      await store.recordAiUsage(actor.user.id, kind);
      return null;
    }
    const limit = dailyLimit(kind);
    const before = await store.countAiUsage(actor.user.id, kind, since24h());
    if (before >= limit) return userLimitResponse(kind);
    const noCredits = await spendCredits(actor, kind, siteId);
    if (noCredits) return noCredits;
    await store.recordAiUsage(actor.user.id, kind);
    const after = await store.countAiUsage(actor.user.id, kind, since24h());
    if (after <= limit) return null;
    await refundCredits(actor, kind, "daily_limit");
    return userLimitResponse(kind);
  }

  const ipHash = await requestIpHash();
  const before = guestLimitResponse(kind, await guestCounts(actor, kind, ipHash), (n, l) => n >= l);
  if (before) return before;
  await store.recordGuestAiUsage({ guestId: actor.guestId, ipHash }, kind);
  return guestLimitResponse(kind, await guestCounts(actor, kind, ipHash), (n, l) => n > l);
}

/**
 * A IA falhou depois de `reserveUse`: devolve os créditos da conta. Visitantes não usam créditos
 * (o uso continua contado no limite deles). Nunca lança erro.
 */
export async function refundUse(actor: Actor, kind: AiUsageKind): Promise<void> {
  await refundCredits(actor, kind);
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
