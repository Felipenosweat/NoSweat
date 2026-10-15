import { SocialPostResponse, type SocialPostStatus } from "@nosweat/schema";
import { errorResponse, handle, jsonResponse, notFound } from "@/server/http";
import { requireSocialUser } from "@/server/social/api";
import { toPublicPost } from "@/server/social/service";
import { getSocialStore } from "@/server/social/store";

type Context = { params: Promise<{ id: string }> };

const MANUAL_FROM: SocialPostStatus[] = ["draft", "approved", "failed", "paused", "missed"];

/** POST /api/social/posts/[id]/mark-posted: o dono postou à mão ("Post manually") e marcou. */
export async function POST(_request: Request, { params }: Context): Promise<Response> {
  return handle(async () => {
    const { user, response } = await requireSocialUser();
    if (!user) return response;
    const { id } = await params;
    const store = getSocialStore();
    const post = await store.getPost(user.id, id);
    if (!post) return notFound("Post");
    const now = new Date().toISOString();
    const updated = await store.updatePost(
      post.id,
      {
        status: "manual_published",
        publishedAt: now,
        // Sem data marcada, conta no mês em que foi postado.
        scheduledAt: post.scheduledAt ?? now,
        nextAttemptAt: null,
        lastError: null,
      },
      MANUAL_FROM,
    );
    if (!updated)
      return errorResponse(409, "invalid_request", "This post can't be marked as posted.");
    await store.logEvent({
      ownerId: user.id,
      postId: post.id,
      actorId: user.id,
      action: "manual_published",
    });
    return jsonResponse(SocialPostResponse, { post: toPublicPost(updated) });
  });
}
