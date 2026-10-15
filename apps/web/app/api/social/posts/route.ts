import { CreateSocialPostRequest, SocialPostResponse, SocialPostsResponse } from "@nosweat/schema";
import { errorResponse, handle, jsonResponse, readJson } from "@/server/http";
import { claimsFlag, invalidMedia, rangeFromQuery, requireSocialUser } from "@/server/social/api";
import { toPublicPost } from "@/server/social/service";
import { getSocialStore } from "@/server/social/store";
import { getSiteStore } from "@/server/store";

/** GET /api/social/posts?from=&to= (ISO): posts do dono no período + rascunhos sem data. */
export async function GET(request: Request): Promise<Response> {
  return handle(async () => {
    const { user, response } = await requireSocialUser();
    if (!user) return response;
    const store = getSocialStore();
    const settings = await store.getSettings(user.id);
    const range = rangeFromQuery(new URL(request.url), settings.timezone);
    if (!range) return errorResponse(400, "invalid_request", "Invalid date range.");
    const posts = await store.listPosts(user.id, range.fromIso, range.toIso);
    return jsonResponse(SocialPostsResponse, { posts: posts.map(toPublicPost) });
  });
}

/** POST /api/social/posts: novo rascunho (o dono aprova depois). */
export async function POST(request: Request): Promise<Response> {
  return handle(async () => {
    const { user, response } = await requireSocialUser();
    if (!user) return response;
    const input = await readJson(request, CreateSocialPostRequest);
    if (!input.ok) return input.response;
    const { caption, media, scheduledAt, siteId } = input.data;

    const badMedia = invalidMedia(user, media);
    if (badMedia) return badMedia;
    if (siteId) {
      const site = await getSiteStore().get(siteId);
      if (!site || site.ownerId !== user.id)
        return errorResponse(404, "not_found", "Site not found.");
    }

    const post = await getSocialStore().createPost({
      ownerId: user.id,
      caption,
      media,
      scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      siteId: siteId ?? null,
      source: "manual",
      claimsFlagged: await claimsFlag(user.id, caption),
    });
    return jsonResponse(SocialPostResponse, { post: toPublicPost(post) }, 201);
  });
}
