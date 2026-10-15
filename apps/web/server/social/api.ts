import type {
  SocialMedia,
  SocialPostStatus,
  SocialSettings,
  SocialStateResponse,
} from "@nosweat/schema";
import type { CurrentUser } from "../auth/session";
import { getCurrentUser } from "../auth/session";
import { socialBlocked, socialMonthlyCap } from "../billing";
import { errorResponse, unauthorized } from "../http";
import { remainingUses } from "../quota";
import { toPublicAccount } from "./accounts";
import { buildBusinessContext, isOwnerPhotoUrl } from "./context";
import { hasUnverifiedClaims } from "./claims";
import { socialCapability } from "./config";
import { mediaBelongsTo } from "./media";
import { currentMonth, monthOf, monthRangeUtc } from "./service";
import { getSocialStore } from "./store";
import type { SocialPostRecord, SocialSettingsRecord } from "./types";

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
  };
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
  const [capability, cap, used, plans, captions] = await Promise.all([
    socialCapability(user, settings),
    socialMonthlyCap(user),
    store.countCountedInRange(user.id, fromIso, toIso),
    remainingUses(actor, "social_plan"),
    remainingUses(actor, "social_caption"),
  ]);
  return {
    account: account ? toPublicAccount(account) : null,
    settings: toPublicSettings(settings),
    capability,
    usage: { used, cap },
    aiRemaining: { plans, captions },
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
      {
        status: auto ? "scheduled" : "approved",
        scheduledAt: post.scheduledAt,
        nextAttemptAt: auto ? post.scheduledAt : null,
        accountId: auto && account ? account.id : post.accountId,
        approvedAt,
        approvedBy: user.id,
        attempts: 0,
        lastError: null,
        igContainerId: null,
      },
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
