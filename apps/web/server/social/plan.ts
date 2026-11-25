import type { PlanMonthRequest, SocialMedia, SocialPlanItem } from "@nosweat/schema";
import type { CurrentUser } from "../auth/session";
import { errorResponse } from "../http";
import { refundUse, reserveUse } from "../quota";
import { SocialAiError, getPostPlanner } from "./ai";
import { hasUnverifiedClaims } from "./claims";
import { buildBusinessContext, type BusinessContext } from "./context";
import { zonedTimeToUtc } from "./service";
import { getSocialStore } from "./store";
import type { NewSocialPost, SocialPostRecord } from "./types";

// "Plan the month": a IA monta os posts do mês a partir do site do dono. Um caminho só para o
// botão (POST /api/social/plan) e para o Piloto automático (cron), com os mesmos créditos.
// Tudo vira RASCUNHO: aprovar é do dono (ou do Piloto automático, com o consentimento dele).

/** Foto do site virando foto de post. Instagram só aceita JPEG: as outras ficam de fora. */
function photoMedia(ctx: BusinessContext, index: number | null): SocialMedia[] {
  if (index === null) return [];
  const photo = ctx.photos[index];
  if (!photo) return [];
  const url = new URL(photo.url);
  if (!/\.jpe?g$/i.test(url.pathname)) return [];
  return [
    {
      path: url.pathname.replace(/^\/storage\/v1\/object\/public\//, ""),
      url: photo.url,
      // Tamanho real desconhecido aqui; o Instagram confere a proporção na hora de publicar.
      width: 1080,
      height: 1080,
      mime: "image/jpeg",
      ...(photo.alt ? { alt: photo.alt.slice(0, 300) } : {}),
    },
  ];
}

export type PlanMonthResult =
  | { ok: true; posts: SocialPostRecord[] }
  | {
      ok: false;
      /** no_site: sem site para a IA ler; limited: créditos/limite (402/429); ai_failed: a IA falhou. */
      reason: "no_site" | "limited" | "ai_failed";
      response: Response;
    };

/**
 * Gera os rascunhos do mês. Desconta os créditos antes da IA (`reserveUse`) e devolve se a IA
 * falhar. `via` só vai para o histórico (botão ou Piloto automático).
 */
export async function planMonthForOwner(
  user: CurrentUser,
  input: PlanMonthRequest,
  options: { via?: "button" | "autopilot" } = {},
): Promise<PlanMonthResult> {
  const { month, postsPerWeek, siteId } = input;
  const store = getSocialStore();
  const settings = await store.getSettings(user.id);
  const ctx = await buildBusinessContext(user.id, siteId ?? settings.defaultSiteId);
  if (!ctx) {
    return {
      ok: false,
      reason: "no_site",
      response: errorResponse(
        400,
        "invalid_request",
        "Create your website first: we use it to write your posts.",
      ),
    };
  }

  const actor = { kind: "user" as const, user };
  const limited = await reserveUse(actor, "social_plan", ctx.siteId);
  if (limited) return { ok: false, reason: "limited", response: limited };

  let items: SocialPlanItem[];
  try {
    items = await getPostPlanner().planMonth(ctx, {
      month,
      postsPerWeek,
      timezone: settings.timezone,
      postDays: settings.postDays,
      postTime: settings.postTime,
      maxPosts: 31,
    });
  } catch (error) {
    // A IA falhou: os créditos voltam para a conta.
    await refundUse(actor, "social_plan");
    if (error instanceof SocialAiError) {
      return {
        ok: false,
        reason: "ai_failed",
        response: errorResponse(
          502,
          "social_error",
          "We couldn't plan your month right now. Please try again.",
        ),
      };
    }
    throw error;
  }

  const now = Date.now();
  const drafts: NewSocialPost[] = items
    .map((item) => ({ item, at: zonedTimeToUtc(item.date, item.time, settings.timezone) }))
    .filter(({ at }) => Date.parse(at) > now)
    .map(({ item, at }) => ({
      ownerId: user.id,
      caption: item.caption,
      ownerNotePt: item.ownerNotePt || null,
      media: photoMedia(ctx, item.photoIndex),
      scheduledAt: at,
      siteId: ctx.siteId,
      source: "ai" as const,
      status: "draft" as const,
      claimsFlagged: hasUnverifiedClaims(item.caption, ctx.highlights),
    }));
  const created = await store.createPosts(drafts);
  await store.logEvent({
    ownerId: user.id,
    actorId: options.via === "autopilot" ? null : user.id,
    action: "ai_month_planned",
    detail: { month, posts: created.length, via: options.via ?? "button" },
  });
  return { ok: true, posts: created };
}
