import {
  PlanMonthRequest,
  PlanMonthResponse,
  type SocialMedia,
  type SocialPlanItem,
} from "@nosweat/schema";
import { errorResponse, handle, jsonResponse, readJson } from "@/server/http";
import { reserveUse } from "@/server/quota";
import { requireSocialUser } from "@/server/social/api";
import { SocialAiError, getPostPlanner } from "@/server/social/ai";
import { hasUnverifiedClaims } from "@/server/social/claims";
import { buildBusinessContext, type BusinessContext } from "@/server/social/context";
import { toPublicPost, zonedTimeToUtc } from "@/server/social/service";
import { getSocialStore } from "@/server/social/store";
import type { NewSocialPost } from "@/server/social/types";

// A IA pode levar até ~1 min para montar o mês.
export const maxDuration = 300;

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

/**
 * POST /api/social/plan { month, postsPerWeek, siteId? }: a IA monta os posts do mês a partir do
 * site do dono. Tudo vira RASCUNHO: nada é aprovado nem publicado sem o dono.
 */
export async function POST(request: Request): Promise<Response> {
  return handle(async () => {
    const { user, response } = await requireSocialUser();
    if (!user) return response;
    const input = await readJson(request, PlanMonthRequest);
    if (!input.ok) return input.response;
    const { month, postsPerWeek, siteId } = input.data;

    const store = getSocialStore();
    const settings = await store.getSettings(user.id);
    const ctx = await buildBusinessContext(user.id, siteId ?? settings.defaultSiteId);
    if (!ctx) {
      return errorResponse(
        400,
        "invalid_request",
        "Create your website first: we use it to write your posts.",
      );
    }

    const limited = await reserveUse({ kind: "user", user }, "social_plan");
    if (limited) return limited;

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
      if (error instanceof SocialAiError) {
        return errorResponse(
          502,
          "social_error",
          "We couldn't plan your month right now. Please try again.",
        );
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
      actorId: user.id,
      action: "ai_month_planned",
      detail: { month, posts: created.length },
    });
    return jsonResponse(PlanMonthResponse, { posts: created.map(toPublicPost) }, 201);
  });
}
