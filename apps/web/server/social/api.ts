import type {
  ApproveAllDraftsResponse,
  SocialMedia,
  SocialPostStatus,
  SocialSettings,
  SocialStateResponse,
} from "@nosweat/schema";
import type { CurrentUser } from "../auth/session";
import { getCurrentUser } from "../auth/session";
import { ownerHasFeature, socialBlocked, socialMonthlyCap, type PlanFeature } from "../billing";
import { errorResponse, unauthorized } from "../http";
import { remainingUses } from "../quota";
import { toPublicAccount } from "./accounts";
import { draftCheck, pickWithinCap } from "./autopilot-rules";
import { buildBusinessContext, isOwnerPhotoUrl } from "./context";
import { hasUnverifiedClaims } from "./claims";
import { socialCapability } from "./config";
import { mediaBelongsTo } from "./media";
import { currentMonth, monthOf, monthRangeUtc } from "./service";
import { getSocialStore } from "./store";
import type { SocialPostPatch, SocialPostRecord, SocialSettingsRecord } from "./types";

// Regras de negócio das rotas /api/social/* (as rotas só leem o pedido e chamam isto).
// Toda função recebe o usuário já logado: visitante sem conta não usa o módulo.

/** Usuário logado ou a resposta 401 pronta. */
export async function requireSocialUser(): Promise<
  { user: CurrentUser; response?: undefined } | { user?: undefined; response: Response }
> {
  const user = await getCurrentUser();
  return user ? { user } : { response: unauthorized() };
}

export function toPublicSettings(settings: SocialSettingsRecord): SocialSettings {
  return {
    timezone: settings.timezone,
    defaultSiteId: settings.defaultSiteId,
    postDays: settings.postDays,
    postTime: settings.postTime,
    autopilot: settings.autopilot,
  };
}

/** Recurso do plano; erro no banco = desligado (a tela continua abrindo). */
async function hasFeature(ownerId: string, feature: PlanFeature): Promise<boolean> {
  try {
    return await ownerHasFeature(ownerId, feature);
  } catch (error) {
    console.error(`[social] could not check the plan feature ${feature}`, error);
    return false;
  }
}

/** Tudo que a tela /social precisa numa chamada só. */
export async function getSocialState(user: CurrentUser): Promise<SocialStateResponse> {
  const store = getSocialStore();
  const [settings, account] = await Promise.all([
    store.getSettings(user.id),
    store.getAccountForOwner(user.id, "instagram"),
  ]);
  const { fromIso, toIso } = monthRangeUtc(currentMonth(settings.timezone), settings.timezone);
  const actor = { kind: "user" as const, user };
  const [capability, cap, used, plans, captions, bulkApprove, autopilot] = await Promise.all([
    socialCapability(user, settings),
    socialMonthlyCap(user),
    store.countCountedInRange(user.id, fromIso, toIso),
    remainingUses(actor, "social_plan"),
    remainingUses(actor, "social_caption"),
    hasFeature(user.id, "socialBulkApprove"),
    hasFeature(user.id, "socialAutopilot"),
  ]);
  return {
    account: account ? toPublicAccount(account) : null,
    settings: toPublicSettings(settings),
    capability,
    usage: { used, cap },
    aiRemaining: { plans, captions },
    features: { bulkApprove, autopilot },
  };
}

/** Fotos aceitas num post: enviadas pelo dono (bucket social-media) ou fotos do site dele. */
export function invalidMedia(user: CurrentUser, media: SocialMedia[]): Response | null {
  for (const item of media) {
    const own = mediaBelongsTo(user.id, item) && item.url.includes(`/${item.path}`);
    const sitePhoto = isOwnerPhotoUrl(item.url) && /\.jpe?g$/i.test(new URL(item.url).pathname);
    if (!own && !sitePhoto) {
      return errorResponse(400, "invalid_request", "Please upload this photo again.");
    }
  }
  return null;
}

/** Marca de afirmação sem prova (regra 8), com os diferenciais que o dono informou no site. */
export async function claimsFlag(ownerId: string, caption: string): Promise<boolean> {
  if (!caption.trim()) return false;
  const ctx = await buildBusinessContext(ownerId);
  return hasUnverifiedClaims(caption, ctx?.highlights ?? []);
}

/** Status em que o dono ainda pode mexer no post. */
export const EDITABLE_STATUSES: SocialPostStatus[] = [
  "draft",
  "approved",
  "scheduled",
  "failed",
  "paused",
  "missed",
];

/** Status que podem ser aprovados (ou aprovados de novo depois de um problema). */
export const APPROVABLE_STATUSES: SocialPostStatus[] = [
  "draft",
  "approved",
  "failed",
  "paused",
  "missed",
];

/** Folga para "agora": aprovar para daqui a pouco não pode falhar por segundos. */
const NOW_SLACK_MS = 60_000;

/**
 * O que muda num post ao aprovar (clique do dono, "Approve all" ou Piloto automático). Com
 * publicação automática vai para a fila; sem, fica "approved". O container do Instagram é
 * sempre zerado: um post só ganha container dentro do publicador (nunca publicar duas vezes).
 */
export function approvalPatch(
  post: Pick<SocialPostRecord, "scheduledAt" | "accountId">,
  options: { auto: boolean; accountId: string | null; approvedAt: string; approvedBy: string },
): SocialPostPatch {
  return {
    status: options.auto ? "scheduled" : "approved",
    scheduledAt: post.scheduledAt,
    nextAttemptAt: options.auto ? post.scheduledAt : null,
    accountId: options.auto && options.accountId ? options.accountId : post.accountId,
    approvedAt: options.approvedAt,
    approvedBy: options.approvedBy,
    attempts: 0,
    lastError: null,
    igContainerId: null,
  };
}

type ApproveResult = { posts: SocialPostRecord[] } | { response: Response };

/**
 * Aprova posts do dono. Tudo ou nada: confere todos antes de mudar qualquer um.
 * Com publicação automática (conta ligada e permitida): vão para a fila ("scheduled").
 * Sem: ficam "approved" (o dono posta à mão com um toque).
 * `publishNow`: a data vira agora (usado por "Publish now", que exige publicação automática).
 */
export async function approvePosts(
  user: CurrentUser,
  ids: string[],
  options: { now?: Date; publishNow?: boolean } = {},
): Promise<ApproveResult> {
  const now = options.now ?? new Date();
  const store = getSocialStore();

  const blocked = await socialBlocked(user);
  if (blocked) return { response: blocked };

  const settings = await store.getSettings(user.id);
  const [account, capability, cap] = await Promise.all([
    store.getAccountForOwner(user.id, "instagram"),
    socialCapability(user, settings),
    socialMonthlyCap(user),
  ]);
  const auto = capability.publishMode === "auto" && account?.status === "active";
  if (options.publishNow && !auto) {
    return {
      response: errorResponse(
        409,
        "reconnect_required",
        "Connect your Instagram account to publish automatically.",
      ),
    };
  }

  const unique = [...new Set(ids)];
  const posts: SocialPostRecord[] = [];
  for (const id of unique) {
    const post = await store.getPost(user.id, id);
    if (!post) return { response: errorResponse(404, "not_found", "Post not found.") };
    if (!APPROVABLE_STATUSES.includes(post.status)) {
      return {
        response: errorResponse(409, "invalid_request", "This post can't be approved right now."),
      };
    }
    if (post.media.length === 0) {
      return {
        response: errorResponse(
          400,
          "invalid_request",
          "Add a photo before approving: Instagram posts need one.",
        ),
      };
    }
    if (!post.caption.trim()) {
      return { response: errorResponse(400, "invalid_request", "Write a caption first.") };
    }
    const when = options.publishNow ? now.toISOString() : post.scheduledAt;
    if (!when || (!options.publishNow && Date.parse(when) < now.getTime() - NOW_SLACK_MS)) {
      return {
        response: errorResponse(400, "invalid_request", "Pick a date and time in the future."),
      };
    }
    posts.push({ ...post, scheduledAt: when });
  }

  // Limite do plano: conta os já aprovados do mês + os novos deste pedido.
  if (cap !== null) {
    const byMonth = new Map<string, number>();
    for (const post of posts) {
      if (post.status === "approved") continue; // já contava antes
      const month = monthOf(post.scheduledAt ?? now.toISOString(), settings.timezone);
      byMonth.set(month, (byMonth.get(month) ?? 0) + 1);
    }
    for (const [month, adding] of byMonth) {
      const { fromIso, toIso } = monthRangeUtc(month, settings.timezone);
      const used = await store.countCountedInRange(user.id, fromIso, toIso);
      if (used + adding > cap) {
        return {
          response: errorResponse(
            402,
            "payment_required",
            `Your plan includes ${cap} posts a month. Upgrade to post more.`,
          ),
        };
      }
    }
  }

  const approvedAt = now.toISOString();
  const updated: SocialPostRecord[] = [];
  for (const post of posts) {
    const next = await store.updatePost(
      post.id,
      approvalPatch(post, {
        auto,
        accountId: account?.id ?? null,
        approvedAt,
        approvedBy: user.id,
      }),
      APPROVABLE_STATUSES,
    );
    if (next) {
      updated.push(next);
      await store.logEvent({
        ownerId: user.id,
        postId: next.id,
        actorId: user.id,
        action: "post_approved",
        detail: { status: next.status, publishNow: Boolean(options.publishNow) },
      });
    }
  }
  return { posts: updated };
}

type ApproveAllResult =
  | { result: Omit<ApproveAllDraftsResponse, "posts"> & { posts: SocialPostRecord[] } }
  | { response: Response };

/**
 * "Approve all drafts" (Pro e Premium): aprova de uma vez os rascunhos prontos do mês, do mais
 * cedo para o mais tarde, até o limite do plano. Diferente de `approvePosts` não é tudo ou nada:
 * o que não dá (sem foto/legenda/data, hora passada, "Skip", afirmação a conferir, acima do
 * limite) fica como rascunho e volta contado na resposta. Continua sendo um clique do dono.
 */
export async function approveAllDrafts(
  user: CurrentUser,
  month: string,
  options: { now?: Date } = {},
): Promise<ApproveAllResult> {
  const now = options.now ?? new Date();
  const nowMs = now.getTime();
  const store = getSocialStore();

  const blocked = await socialBlocked(user);
  if (blocked) return { response: blocked };
  if (!(await ownerHasFeature(user.id, "socialBulkApprove"))) {
    return {
      response: errorResponse(
        402,
        "payment_required",
        "Approving all drafts at once is part of the Pro and Premium plans.",
      ),
    };
  }

  const settings = await store.getSettings(user.id);
  const [account, capability, cap] = await Promise.all([
    store.getAccountForOwner(user.id, "instagram"),
    socialCapability(user, settings),
    socialMonthlyCap(user),
  ]);
  const auto = capability.publishMode === "auto" && account?.status === "active";

  const { fromIso, toIso } = monthRangeUtc(month, settings.timezone);
  const drafts = (await store.listPosts(user.id, fromIso, toIso))
    .filter((post) => post.status === "draft" && post.scheduledAt !== null)
    .sort((a, b) => (a.scheduledAt ?? "").localeCompare(b.scheduledAt ?? ""));

  const leftAsDrafts = { incomplete: 0, past: 0, flagged: 0, skipped: 0, overCap: 0 };
  const ready: SocialPostRecord[] = [];
  for (const post of drafts) {
    const check = draftCheck(post, nowMs + NOW_SLACK_MS);
    if (check === "ready") ready.push(post);
    else leftAsDrafts[check] += 1;
  }

  const used = new Map<string, number>();
  if (cap !== null && ready.length > 0) {
    used.set(month, await store.countCountedInRange(user.id, fromIso, toIso));
  }
  const { approve, overCap } = pickWithinCap(ready, cap, used, () => month);
  leftAsDrafts.overCap = overCap.length;

  const approvedAt = now.toISOString();
  const posts: SocialPostRecord[] = [];
  for (const post of approve) {
    const next = await store.updatePost(
      post.id,
      approvalPatch(post, {
        auto,
        accountId: account?.id ?? null,
        approvedAt,
        approvedBy: user.id,
      }),
      ["draft"],
    );
    if (next) posts.push(next);
  }
  if (posts.length > 0) {
    await store.logEvent({
      ownerId: user.id,
      actorId: user.id,
      action: "posts_bulk_approved",
      detail: { month, approved: posts.length, leftAsDrafts },
    });
  }
  return { result: { posts, leftAsDrafts } };
}

/** Intervalo pedido em ?from=&to= (ISO); sem eles, o mês atual no fuso da empresa. */
export function rangeFromQuery(
  url: URL,
  timeZone: string,
): { fromIso: string; toIso: string } | null {
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  if (!from && !to) return monthRangeUtc(currentMonth(timeZone), timeZone);
  if (!from || !to || Number.isNaN(Date.parse(from)) || Number.isNaN(Date.parse(to))) return null;
  const fromIso = new Date(from).toISOString();
  const toIso = new Date(to).toISOString();
  // No máximo ~3 meses por pedido (a tela pede um mês).
  if (
    Date.parse(toIso) <= Date.parse(fromIso) ||
    Date.parse(toIso) - Date.parse(fromIso) > 95 * 86_400_000
  ) {
    return null;
  }
  return { fromIso, toIso };
}
