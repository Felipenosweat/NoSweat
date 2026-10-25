import type { CreditBalance, PlanId } from "@nosweat/schema";
import { isAdmin } from "../admin";
import type { CurrentUser } from "../auth/session";
import { activePlan } from "../billing";
import { errorResponse } from "../http";
import type { Actor } from "../sites";
import { creditCost, monthlyAllowance, periodEnd, periodStart, type CreditAction } from "./pricing";
import { getCreditStore, type NewCreditEntry } from "./store";

export {
  CREDIT_ACTION_LABELS,
  CREDIT_ACTIONS,
  CREDIT_COSTS,
  creditCost,
  MONTHLY_CREDITS,
  monthlyAllowance,
  TOPUP_PACKS,
  type CreditAction,
} from "./pricing";
export { getCreditStore, type CreditEntry } from "./store";

// Créditos da IA (moeda da No Sweat). Saldo = cota mensal do plano (zera todo mês, UTC) +
// créditos comprados (não vencem). Gasta primeiro a cota do mês, depois os comprados.
// Tudo vem do livro-caixa `credit_ledger` (migration 0019); a cota do plano não é gravada,
// é calculada do plano ativo (Stripe ou acesso manual) na hora.

export type { CreditBalance };

type UserRef = Pick<CurrentUser, "id">;

/** Números crus (podem ficar negativos se o plano diminuiu no meio do mês). */
type RawBalance = {
  plan: PlanId | null;
  allowance: number;
  monthlyUsed: number;
  topup: number;
};

async function readRaw(userId: string, now: Date): Promise<RawBalance> {
  const [plan, sums] = await Promise.all([
    activePlan(userId),
    getCreditStore().sums(userId, periodStart(now).toISOString()),
  ]);
  return {
    plan,
    allowance: Math.max(0, monthlyAllowance(plan) + sums.monthlyGranted),
    monthlyUsed: sums.monthlySpent,
    topup: sums.topup,
  };
}

function toBalance(raw: RawBalance, now: Date, unlimited: boolean): CreditBalance {
  const monthlyLeft = Math.max(0, raw.allowance - raw.monthlyUsed);
  const topup = Math.max(0, raw.topup);
  return {
    unlimited,
    monthlyAllowance: raw.allowance,
    monthlyUsed: Math.max(0, raw.monthlyUsed),
    monthlyLeft,
    topup,
    total: monthlyLeft + topup,
    resetsAt: periodEnd(now).toISOString(),
  };
}

/** Saldo de créditos da conta. Admins: `unlimited: true`. */
export async function getBalance(user: UserRef, now = new Date()): Promise<CreditBalance> {
  const [raw, admin] = await Promise.all([readRaw(user.id, now), isAdmin(user.id)]);
  return toBalance(raw, now, admin);
}

/** Plano que define a cota mensal (`null` = sem plano). */
export async function creditPlan(user: UserRef): Promise<PlanId | null> {
  return activePlan(user.id);
}

/**
 * Quantas vezes a ação ainda cabe no saldo (`null` = sem limite: admin; visitante também, porque
 * visitante não usa créditos e tem os limites GUEST_* de server/quota.ts).
 */
export async function usesLeft(actor: Actor, action: CreditAction): Promise<number | null> {
  if (actor.kind !== "user") return null;
  const balance = await getBalance(actor.user);
  if (balance.unlimited) return null;
  const cost = creditCost(action);
  return cost > 0 ? Math.floor(balance.total / cost) : null;
}

const dayFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

/** 402 `out_of_credits` com a explicação (quanto custa, quanto tem, quando volta a cota). */
export function outOfCreditsResponse(action: CreditAction, balance: CreditBalance): Response {
  const cost = creditCost(action);
  const left = balance.total;
  return errorResponse(
    402,
    "out_of_credits",
    `You're out of AI credits: this needs ${cost} ${cost === 1 ? "credit" : "credits"} and you have ${left} left. ` +
      `Your monthly credits refill on ${dayFormat.format(new Date(balance.resetsAt))}, ` +
      "or you can get more credits in Plans and billing.",
  );
}

/** Movimentos que desfazem `spend` (devolução). Parte mensal de um mês que já acabou não volta. */
function reversal(
  entries: (NewCreditEntry & { createdAt?: string })[],
  spendId: string,
  why: string,
  now: Date,
): NewCreditEntry[] {
  const start = periodStart(now).getTime();
  return entries
    .filter(
      (entry) =>
        entry.bucket === "topup" ||
        entry.createdAt === undefined ||
        Date.parse(entry.createdAt) >= start,
    )
    .map((entry) => ({
      userId: entry.userId,
      delta: -entry.delta,
      bucket: entry.bucket,
      reason: "refund" as const,
      action: entry.action,
      siteId: entry.siteId,
      meta: { refundOf: spendId, why },
    }));
}

/**
 * Desconta os créditos da ação ANTES de chamar a IA. Devolve o 402 `out_of_credits` pronto se
 * não há saldo, senão `null` (o gasto já ficou registrado). Visitantes e admins: sempre `null`
 * (sem créditos). Mesma ordem do server/quota.ts: confere → registra → confere de novo (pedidos
 * ao mesmo tempo não passam juntos do saldo; quem perdeu a corrida recebe a devolução).
 */
export async function spendCredits(
  actor: Actor,
  action: CreditAction,
  siteId?: string | null,
): Promise<Response | null> {
  if (actor.kind !== "user") return null;
  const userId = actor.user.id;
  if (await isAdmin(userId)) return null;
  const cost = creditCost(action);
  if (cost <= 0) return null;

  const now = new Date();
  const before = toBalance(await readRaw(userId, now), now, false);
  if (before.total < cost) return outOfCreditsResponse(action, before);

  const fromMonthly = Math.min(cost, before.monthlyLeft);
  const fromTopup = cost - fromMonthly;
  const spendId = crypto.randomUUID();
  const base = { userId, reason: "spend" as const, action, siteId: siteId ?? null };
  const entries: NewCreditEntry[] = [];
  if (fromMonthly > 0) {
    entries.push({ ...base, delta: -fromMonthly, bucket: "monthly", meta: { spendId } });
  }
  if (fromTopup > 0) {
    entries.push({ ...base, delta: -fromTopup, bucket: "topup", meta: { spendId } });
  }
  const store = getCreditStore();
  await store.insert(entries);

  // Confere de novo: outro pedido pode ter gastado o mesmo saldo ao mesmo tempo.
  const after = await readRaw(userId, now);
  const overdrawn =
    (fromMonthly > 0 && after.allowance - after.monthlyUsed < 0) ||
    (fromTopup > 0 && after.topup < 0);
  if (!overdrawn) return null;
  await store.insert(reversal(entries, spendId, "race", now));
  return outOfCreditsResponse(action, toBalance(await readRaw(userId, now), now, false));
}

/** Janela para achar o gasto a devolver (a IA mais lenta leva poucos minutos). */
const REFUND_WINDOW_MS = 30 * 60 * 1000;

/**
 * Devolve os créditos do último gasto desta ação que ainda não foi devolvido (ex.: a IA falhou).
 * Visitantes e admins: nada a devolver. Nunca lança erro (a falha só fica no log).
 */
export async function refundCredits(
  actor: Actor,
  action: CreditAction,
  why = "ai_failed",
): Promise<void> {
  if (actor.kind !== "user") return;
  const userId = actor.user.id;
  try {
    const now = new Date();
    const store = getCreditStore();
    const entries = await store.listSince(
      userId,
      new Date(now.getTime() - REFUND_WINDOW_MS).toISOString(),
    );
    const refunded = new Set(
      entries
        .filter((entry) => entry.reason === "refund")
        .map((entry) => entry.meta.refundOf)
        .filter((id): id is string => typeof id === "string"),
    );
    const latest = entries.find(
      (entry) =>
        entry.reason === "spend" &&
        entry.action === action &&
        typeof entry.meta.spendId === "string" &&
        !refunded.has(entry.meta.spendId),
    );
    const spendId = latest?.meta.spendId;
    if (typeof spendId !== "string") return;
    const group = entries.filter(
      (entry) => entry.reason === "spend" && entry.meta.spendId === spendId,
    );
    const rows = reversal(group, spendId, why, now);
    if (rows.length > 0) await store.insert(rows);
  } catch (error) {
    console.error("[credits] could not refund", action, error);
  }
}

/**
 * Ajuste manual do admin (bônus, cortesia, correção, compra paga por Pix/WhatsApp). Entra no
 * saldo que não vence (top-up). `delta` negativo tira créditos, mas nunca deixa o saldo comprado
 * abaixo de zero. Devolve o saldo novo.
 * Para o painel do admin: `adminAdjustCredits(userId, delta, note, adminId)`.
 */
export async function adminAdjustCredits(
  userId: string,
  delta: number,
  note: string | null,
  adminId: string | null = null,
): Promise<CreditBalance> {
  if (!Number.isInteger(delta) || delta === 0) {
    throw new Error("Credit adjustment must be a non-zero whole number.");
  }
  const now = new Date();
  let amount = delta;
  if (amount < 0) {
    const raw = await readRaw(userId, now);
    amount = Math.max(amount, -Math.max(0, raw.topup));
  }
  if (amount !== 0) {
    await getCreditStore().insert([
      {
        userId,
        delta: amount,
        bucket: "topup",
        reason: "admin_adjust",
        action: null,
        siteId: null,
        meta: {
          ...(note?.trim() ? { note: note.trim().slice(0, 500) } : {}),
          ...(adminId ? { adminId } : {}),
          ...(amount !== delta ? { requested: delta } : {}),
        },
      },
    ]);
  }
  return getBalance({ id: userId }, now);
}

/**
 * Créditos comprados (não vencem). Hoje a compra é manual; quando o Stripe tiver o checkout
 * avulso, o webhook chama isto. TODO(Stripe): `mode: "payment"` + idempotência pelo id do evento.
 */
export async function addTopupCredits(
  userId: string,
  credits: number,
  meta: Record<string, unknown> = {},
): Promise<void> {
  if (!Number.isInteger(credits) || credits <= 0) {
    throw new Error("Top-up must be a positive whole number of credits.");
  }
  await getCreditStore().insert([
    { userId, delta: credits, bucket: "topup", reason: "topup", action: null, siteId: null, meta },
  ]);
}
