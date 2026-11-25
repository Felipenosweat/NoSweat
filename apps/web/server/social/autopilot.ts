import type { PlanMonthRequest } from "@nosweat/schema";
import type { CurrentUser } from "../auth/session";
import { ownerHasFeature, socialMonthlyCap } from "../billing";
import { findOwnerEmail } from "../notify/lead-email";
import { approvalPatch } from "./api";
import {
  AUTO_APPROVE_WINDOW_MS,
  digestDue,
  isAutopilotCandidate,
  monthToPlan,
  needsNotice,
  noticeHorizon,
  pickWithinCap,
  postsPerWeekFor,
  readyToAutoApprove,
} from "./autopilot-rules";
import { canAutoPublish } from "./config";
import { sendAutopilotDigestEmail, type AutopilotDigest } from "./notify";
import { planMonthForOwner, type PlanMonthResult } from "./plan";
import { monthOf, monthRangeUtc } from "./service";
import { getSocialStore, type SocialStore } from "./store";
import type { AutopilotPlanStatus, SocialPostRecord, SocialSettingsRecord } from "./types";

// Piloto automático do Instagram (Premium), rodado pelo cron /api/cron/social-autopilot.
// EXCEÇÃO DELIBERADA à regra "a IA nunca aprova": o dono ligou o Piloto automático (consentimento
// permanente). Mesmo assim:
// - só rascunhos da IA completos (foto, legenda, data), sem "Skip", sem edição do dono e sem
//   afirmação a conferir (regra 8);
// - o dono recebe um e-mail (um por dia) listando os posts; só post avisado há 12 h ou mais é
//   aprovado, e só nas 2 h antes da hora (post atrasado nunca: segue as regras de "missed");
// - respeita o limite de posts do plano e só aprova com o Instagram conectado e publicando sozinho;
// - aprovar só coloca o post na fila: publicar continua com o publicador e as travas dele
//   (pega atômica, container salvo antes de publicar, nunca duas vezes).
// Do dia 25 em diante, planeja o mês seguinte pelo mesmo caminho do botão (mesmos créditos).

const MINUTE_MS = 60_000;
/** Margem para não começar um dono sem tempo de terminar (planejar o mês leva ~1 min). */
const BUDGET_MARGIN_MS = 90_000;

export type AutopilotDeps = {
  store?: SocialStore;
  /** Relógio (testes). */
  now?: () => Date;
  hasAutopilot?: (ownerId: string) => Promise<boolean>;
  ownerUser?: (ownerId: string) => Promise<CurrentUser>;
  canAutoPublish?: (user: CurrentUser, settings: SocialSettingsRecord) => Promise<boolean>;
  monthlyCap?: (user: CurrentUser) => Promise<number | null>;
  planMonth?: (user: CurrentUser, input: PlanMonthRequest) => Promise<PlanMonthResult>;
  sendDigest?: (ownerId: string, digest: AutopilotDigest) => Promise<boolean>;
};

export type AutopilotSummary = {
  /** Donos com o Piloto automático ligado que foram vistos. */
  owners: number;
  /** Ligado, mas o plano não tem mais o recurso (nada foi feito). */
  inactive: number;
  approved: number;
  /** Prontos, mas acima do limite do plano no mês (ficaram como rascunho). */
  overCap: number;
  digests: number;
  noticed: number;
  planned: number;
  outOfCredits: number;
  errors: number;
};

type Ctx = Required<Omit<AutopilotDeps, "now">> & {
  now: () => Date;
  plansLeft: number;
};

function buildCtx(deps: AutopilotDeps, maxPlans: number): Ctx {
  const store = deps.store ?? getSocialStore();
  return {
    store,
    now: deps.now ?? (() => new Date()),
    hasAutopilot: deps.hasAutopilot ?? ((ownerId) => ownerHasFeature(ownerId, "socialAutopilot")),
    ownerUser:
      deps.ownerUser ??
      (async (ownerId) => ({ id: ownerId, email: await findOwnerEmail(ownerId, process.env) })),
    canAutoPublish: deps.canAutoPublish ?? canAutoPublish,
    monthlyCap: deps.monthlyCap ?? socialMonthlyCap,
    planMonth:
      deps.planMonth ?? ((user, input) => planMonthForOwner(user, input, { via: "autopilot" })),
    sendDigest:
      deps.sendDigest ?? ((ownerId, digest) => sendAutopilotDigestEmail(ownerId, digest, { store })),
    plansLeft: maxPlans,
  };
}

/** Roda o Piloto automático de todos os donos com ele ligado. Erro num dono não para os outros. */
export async function runAutopilot(
  options: { limit?: number; budgetMs?: number; maxPlans?: number } = {},
  deps: AutopilotDeps = {},
): Promise<AutopilotSummary> {
  const summary: AutopilotSummary = {
    owners: 0,
    inactive: 0,
    approved: 0,
    overCap: 0,
    digests: 0,
    noticed: 0,
    planned: 0,
    outOfCredits: 0,
    errors: 0,
  };
  const ctx = buildCtx(deps, options.maxPlans ?? 2);
  const budgetMs = options.budgetMs ?? 240_000;
  const started = Date.now();
  const list = await ctx.store.listAutopilotSettings(options.limit ?? 500);
  for (const settings of list) {
    if (budgetMs - (Date.now() - started) < BUDGET_MARGIN_MS) break;
    summary.owners += 1;
    try {
      await runForOwner(ctx, settings, summary);
    } catch (error) {
      summary.errors += 1;
      console.error(`[social] autopilot failed for ${settings.ownerId}`, error);
    }
  }
  return summary;
}

function monthName(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { month: "long", timeZone: "UTC" }).format(
    new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, 1)),
  );
}

/** Motivo de um plano que não saiu, para guardar e decidir se tenta de novo amanhã. */
async function failureStatus(
  result: Extract<PlanMonthResult, { ok: false }>,
): Promise<AutopilotPlanStatus> {
  if (result.reason === "no_site") return "no_site";
  if (result.reason === "ai_failed") return "failed";
  // Créditos acabaram (402 out_of_credits) ou plano sem créditos (402); limite diário (429) é falha.
  if (result.response.status === 402) return "out_of_credits";
  try {
    const body = (await result.response.clone().json()) as { error?: { code?: unknown } };
    if (body.error?.code === "out_of_credits") return "out_of_credits";
  } catch {
    // corpo ilegível: falha comum
  }
  return "failed";
}

async function runForOwner(
  ctx: Ctx,
  settings: SocialSettingsRecord,
  summary: AutopilotSummary,
): Promise<void> {
  const { store } = ctx;
  const ownerId = settings.ownerId;
  if (!(await ctx.hasAutopilot(ownerId))) {
    summary.inactive += 1;
    return;
  }
  const now = ctx.now();
  const nowMs = now.getTime();
  const nowIso = now.toISOString();
  const tz = settings.timezone;
  const user = await ctx.ownerUser(ownerId);
  const account = await store.getAccountForOwner(ownerId, "instagram");
  // Só aprova (e só avisa "vai sair") quando a No Sweat publica sozinha por esta conta.
  const canPublish =
    account !== null && account.status === "active" && (await ctx.canAutoPublish(user, settings));

  // 1) Aprova os posts avisados que chegaram na janela de 2 h.
  if (account && canPublish) {
    const windowEnd = new Date(nowMs + AUTO_APPROVE_WINDOW_MS + MINUTE_MS).toISOString();
    const due = (await store.listPosts(ownerId, nowIso, windowEnd))
      .filter((post) => readyToAutoApprove(post, nowMs))
      .sort((a, b) => (a.scheduledAt ?? "").localeCompare(b.scheduledAt ?? ""));
    if (due.length > 0) {
      const cap = await ctx.monthlyCap(user);
      const monthOfPost = (post: SocialPostRecord) => monthOf(post.scheduledAt ?? nowIso, tz);
      const used = new Map<string, number>();
      if (cap !== null) {
        for (const month of new Set(due.map(monthOfPost))) {
          const { fromIso, toIso } = monthRangeUtc(month, tz);
          used.set(month, await store.countCountedInRange(ownerId, fromIso, toIso));
        }
      }
      const { approve, overCap } = pickWithinCap(due, cap, used, monthOfPost);
      summary.overCap += overCap.length;
      for (const post of approve) {
        const next = await store.autoApprovePost(post.id, {
          ...approvalPatch(post, {
            auto: true,
            accountId: account.id,
            approvedAt: nowIso,
            // Aprovação em nome do dono (consentimento permanente); `autoApprovedAt` diz que foi o
            // Piloto automático e não um clique.
            approvedBy: ownerId,
          }),
          autoApprovedAt: nowIso,
        });
        if (!next) continue;
        summary.approved += 1;
        await store.logEvent({
          ownerId,
          postId: next.id,
          accountId: account.id,
          action: "post_auto_approved",
          detail: { scheduledAt: next.scheduledAt, noticeAt: next.autopilotNoticeAt },
        });
      }
    }
  }

  // 2) O e-mail do dia (no máximo um por dia local, a partir das 8 h) e o plano do mês seguinte.
  if (!digestDue(settings.autopilotDigestAt, now, tz)) return;

  let planNote: string | null = null;
  let forceDigest = false;
  const month = monthToPlan(settings, now, tz);
  if (month) {
    const { fromIso, toIso } = monthRangeUtc(month, tz);
    const hasPlan = (await store.listPosts(ownerId, fromIso, toIso)).some(
      (post) => post.scheduledAt !== null,
    );
    if (hasPlan) {
      // O dono já planejou (ou criou posts): nada a fazer neste mês.
      await store.upsertSettings(ownerId, {
        autopilotPlanMonth: month,
        autopilotPlanStatus: "planned",
        autopilotPlanAt: nowIso,
      });
    } else {
      // Sem vaga para planejar nesta rodada: o e-mail espera a próxima (para levar a nota do plano).
      if (ctx.plansLeft <= 0) return;
      ctx.plansLeft -= 1;
      const result = await ctx.planMonth(user, {
        month,
        postsPerWeek: postsPerWeekFor(settings.postDays),
      });
      const status = result.ok ? "planned" : await failureStatus(result);
      await store.upsertSettings(ownerId, {
        autopilotPlanMonth: month,
        autopilotPlanStatus: status,
        autopilotPlanAt: nowIso,
      });
      if (result.ok) {
        summary.planned += 1;
        forceDigest = result.posts.length > 0;
        planNote = `Autopilot planned your ${monthName(month)} posts: ${result.posts.length} draft${result.posts.length === 1 ? "" : "s"}. As always, you get a heads-up the day before each one goes out, and you can edit or skip any of them.`;
      } else if (status === "out_of_credits") {
        summary.outOfCredits += 1;
        planNote = `Autopilot couldn't plan your ${monthName(month)} posts because you're out of AI credits. Get more credits or plan the month yourself from your social calendar.`;
        // Avisa por e-mail na primeira vez; nos dias seguintes a nota só vai junto com um aviso.
        forceDigest = !(
          settings.autopilotPlanMonth === month && settings.autopilotPlanStatus === "out_of_credits"
        );
      }
    }
  }

  const horizon = noticeHorizon(now, tz);
  const horizonMs = Date.parse(horizon);
  const upcoming = canPublish
    ? (await store.listPosts(ownerId, nowIso, horizon)).filter(
        (post) => post.status === "draft" && post.scheduledAt !== null,
      )
    : [];
  const toNotice = upcoming.filter((post) => needsNotice(post, nowMs, horizonMs));
  const noticed = new Set(toNotice.map((post) => post.id));
  // Rascunhos de hoje/amanhã que não saem sozinhos ("Skip" é escolha do dono: não conta).
  const needsYou = upcoming.filter(
    (post) =>
      !post.autopilotSkip &&
      !noticed.has(post.id) &&
      (!isAutopilotCandidate(post, nowMs) || post.autopilotNoticeAt === null),
  ).length;

  if (toNotice.length === 0 && !forceDigest) return;

  const sent = await ctx.sendDigest(ownerId, {
    timezone: tz,
    goingOut: toNotice.map((post) => ({
      scheduledAt: post.scheduledAt ?? nowIso,
      caption: post.caption,
    })),
    needsYou,
    planNote,
  });
  // Sem e-mail, sem aviso: os posts continuam rascunho e NÃO são aprovados.
  if (!sent) return;

  for (const post of toNotice) {
    const saved = await store.updatePost(post.id, { autopilotNoticeAt: nowIso }, ["draft"]);
    if (saved) summary.noticed += 1;
  }
  await store.upsertSettings(ownerId, { autopilotDigestAt: nowIso });
  summary.digests += 1;
}
