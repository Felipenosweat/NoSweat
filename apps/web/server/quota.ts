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

const DEFAULTS: Record<AiUsageKind, number> = { generate: 5, ai_edit: 30 };
const ENV: Record<AiUsageKind, string> = {
  generate: "AI_DAILY_GENERATIONS",
  ai_edit: "AI_DAILY_EDITS",
};

type GuestLimits = { perGuest: number; perIp: number; global: number };
const GUEST_DEFAULTS: Record<AiUsageKind, GuestLimits> = {
  generate: { perGuest: 2, perIp: 4, global: 300 },
  ai_edit: { perGuest: 5, perIp: 15, global: 2000 },
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
};

const LABELS: Record<AiUsageKind, string> = {
  generate: "new websites",
  ai_edit: "AI changes",
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

/** Quantos usos ainda restam nas últimas 24h (`null` = sem limite). */
export async function remainingUses(actor: Actor, kind: AiUsageKind): Promise<number | null> {
  const store = getSiteStore();
  if (actor.kind === "guest") {
    const used = await store.countGuestAiUsage({ guestId: actor.guestId }, kind, since24h());
    return Math.max(0, guestLimits(kind).perGuest - used);
  }
  if (await isAdmin(actor.user.id)) return null;
  const used = await store.countAiUsage(actor.user.id, kind, since24h());
  return Math.max(0, dailyLimit(kind) - used);
}

const SIGN_UP_HINT = "Create a free account to keep going.";

/** Resposta 429 pronta se já passou do limite do dia; senão `null`. */
export async function quotaExceeded(actor: Actor, kind: AiUsageKind): Promise<Response | null> {
  if (actor.kind === "user") {
    const remaining = await remainingUses(actor, kind);
    if (remaining === null || remaining > 0) return null;
    return errorResponse(
      429,
      "quota_exceeded",
      `You've reached today's limit of ${dailyLimit(kind)} ${LABELS[kind]}. Please try again tomorrow.`,
    );
  }

  const store = getSiteStore();
  const since = since24h();
  const limits = guestLimits(kind);
  const ipHash = await requestIpHash();
  const [byGuest, byIp, total] = await Promise.all([
    store.countGuestAiUsage({ guestId: actor.guestId }, kind, since),
    ipHash ? store.countGuestAiUsage({ ipHash }, kind, since) : Promise.resolve(0),
    store.countGuestAiUsage({}, kind, since),
  ]);
  if (total >= limits.global) {
    return errorResponse(
      429,
      "quota_exceeded",
      `Lots of people are building right now. ${SIGN_UP_HINT}`,
    );
  }
  if (byGuest >= limits.perGuest || byIp >= limits.perIp) {
    return errorResponse(
      429,
      "quota_exceeded",
      `You've used today's free ${LABELS[kind]}. ${SIGN_UP_HINT}`,
    );
  }
  return null;
}

export async function recordUse(actor: Actor, kind: AiUsageKind): Promise<void> {
  const store = getSiteStore();
  if (actor.kind === "user") {
    await store.recordAiUsage(actor.user.id, kind);
    return;
  }
  await store.recordGuestAiUsage({ guestId: actor.guestId, ipHash: await requestIpHash() }, kind);
}
