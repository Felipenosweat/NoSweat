import { isAdmin } from "./admin";
import type { CurrentUser } from "./auth/session";
import { errorResponse } from "./http";
import { getSiteStore, type AiUsageKind } from "./store";

// Limite diário de uso da IA por conta (controle de custo). Admins não têm limite.
// Valores padrão abaixo; dá para mudar sem deploy de código pelas variáveis de ambiente.

const DEFAULTS: Record<AiUsageKind, number> = { generate: 5, ai_edit: 30 };
const ENV: Record<AiUsageKind, string> = {
  generate: "AI_DAILY_GENERATIONS",
  ai_edit: "AI_DAILY_EDITS",
};
const LABELS: Record<AiUsageKind, string> = {
  generate: "new websites",
  ai_edit: "AI changes",
};

export function dailyLimit(kind: AiUsageKind): number {
  const value = Number(process.env[ENV[kind]]);
  return Number.isFinite(value) && value >= 0 ? value : DEFAULTS[kind];
}

const since24h = () => new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

/** Quantos usos ainda restam nas últimas 24h (`null` = sem limite). */
export async function remainingUses(user: CurrentUser, kind: AiUsageKind): Promise<number | null> {
  if (await isAdmin(user.id)) return null;
  const used = await getSiteStore().countAiUsage(user.id, kind, since24h());
  return Math.max(0, dailyLimit(kind) - used);
}

/** Resposta 429 pronta se a conta já usou o limite do dia; senão `null`. */
export async function quotaExceeded(
  user: CurrentUser,
  kind: AiUsageKind,
): Promise<Response | null> {
  const remaining = await remainingUses(user, kind);
  if (remaining === null || remaining > 0) return null;
  return errorResponse(
    429,
    "quota_exceeded",
    `You've reached today's limit of ${dailyLimit(kind)} ${LABELS[kind]}. Please try again tomorrow.`,
  );
}

export async function recordUse(user: CurrentUser, kind: AiUsageKind): Promise<void> {
  await getSiteStore().recordAiUsage(user.id, kind);
}
