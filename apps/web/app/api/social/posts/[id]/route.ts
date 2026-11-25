import { SocialPostResponse, UpdateSocialPostRequest } from "@nosweat/schema";
import { errorResponse, handle, jsonResponse, notFound, readJson } from "@/server/http";
import {
  EDITABLE_STATUSES,
  claimsFlag,
  invalidMedia,
  requireSocialUser,
} from "@/server/social/api";
import { toPublicPost } from "@/server/social/service";
import { getSocialStore } from "@/server/social/store";
import type { SocialPostPatch } from "@/server/social/types";

type Context = { params: Promise<{ id: string }> };

/** Mesmo instante (o banco devolve "+00:00" e o pedido vem com "Z"). */
function sameInstant(a: string | null, b: string | null): boolean {
  if (a === null || b === null) return a === b;
  return Date.parse(a) === Date.parse(b);
}

/** GET /api/social/posts/[id]: um post do dono (de outra pessoa = 404). */
export async function GET(_request: Request, { params }: Context): Promise<Response> {
  return handle(async () => {
    const { user, response } = await requireSocialUser();
    if (!user) return response;
    const { id } = await params;
    const post = await getSocialStore().getPost(user.id, id);
    if (!post) return notFound("Post");
    return jsonResponse(SocialPostResponse, { post: toPublicPost(post) });
  }, "/api/social/posts/[id]");
}

/**
 * PATCH /api/social/posts/[id]: muda legenda, fotos ou data. Post aprovado continua aprovado (o
 * próprio dono editou); post que deu problema (falhou, pausou, perdeu a hora) volta a rascunho
 * e precisa de nova aprovação. Mudança de verdade em texto, fotos ou data marca `ownerEditedAt`
 * (o Piloto automático deixa a aprovação com o dono). `autopilotSkip` liga/desliga o "Skip" do
 * Piloto automático (só rascunhos) e não conta como edição.
 */
export async function PATCH(request: Request, { params }: Context): Promise<Response> {
  return handle(async () => {
    const { user, response } = await requireSocialUser();
    if (!user) return response;
    const { id } = await params;
    const input = await readJson(request, UpdateSocialPostRequest);
    if (!input.ok) return input.response;

    const store = getSocialStore();
    const post = await store.getPost(user.id, id);
    if (!post) return notFound("Post");
    if (!EDITABLE_STATUSES.includes(post.status)) {
      return errorResponse(409, "invalid_request", "This post can't be changed anymore.");
    }

    const { caption, media, scheduledAt, autopilotSkip } = input.data;
    if (autopilotSkip !== undefined && post.status !== "draft") {
      return errorResponse(409, "invalid_request", "Only drafts can be skipped.");
    }
    if (media) {
      const badMedia = invalidMedia(user, media);
      if (badMedia) return badMedia;
    }
    const patch: SocialPostPatch = {};
    if (caption !== undefined) {
      patch.caption = caption;
      patch.claimsFlagged = await claimsFlag(user.id, caption);
    }
    if (media !== undefined) patch.media = media;
    if (scheduledAt !== undefined) {
      patch.scheduledAt = scheduledAt ? new Date(scheduledAt).toISOString() : null;
    }

    if (autopilotSkip !== undefined) patch.autopilotSkip = autopilotSkip;

    // Edição de verdade do dono (o editor manda os três campos mesmo sem mudar todos).
    const edited =
      (caption !== undefined && caption !== post.caption) ||
      (media !== undefined &&
        (media.length !== post.media.length ||
          media.some((item, index) => item.path !== post.media[index]?.path))) ||
      (patch.scheduledAt !== undefined && !sameInstant(patch.scheduledAt, post.scheduledAt));
    if (edited) patch.ownerEditedAt = new Date().toISOString();

    const when = patch.scheduledAt !== undefined ? patch.scheduledAt : post.scheduledAt;
    const queued = post.status === "scheduled" || post.status === "approved";
    if (queued && (!when || (patch.media && patch.media.length === 0))) {
      // Sem data ou sem foto não dá para publicar: volta a rascunho.
      Object.assign(patch, {
        status: "draft",
        approvedAt: null,
        approvedBy: null,
        nextAttemptAt: null,
      });
    } else if (post.status === "scheduled") {
      patch.nextAttemptAt = when;
    } else if (post.status === "failed" || post.status === "paused" || post.status === "missed") {
      Object.assign(patch, {
        status: "draft",
        approvedAt: null,
        approvedBy: null,
        nextAttemptAt: null,
        lastError: null,
        igContainerId: null,
      });
    }

    const updated = await store.updatePost(post.id, patch, [post.status]);
    if (!updated) {
      return errorResponse(409, "invalid_request", "This post changed. Reload and try again.");
    }
    return jsonResponse(SocialPostResponse, { post: toPublicPost(updated) });
  }, "/api/social/posts/[id]");
}

/** DELETE /api/social/posts/[id]: apaga. Post já publicado só some do calendário (fica no Instagram). */
export async function DELETE(_request: Request, { params }: Context): Promise<Response> {
  return handle(async () => {
    const { user, response } = await requireSocialUser();
    if (!user) return response;
    const { id } = await params;
    const store = getSocialStore();
    const post = await store.getPost(user.id, id);
    if (!post) return notFound("Post");
    if (post.status === "publishing" || post.status === "needs_check") {
      return errorResponse(409, "invalid_request", "This post is being published right now.");
    }
    if (post.status === "published" || post.status === "manual_published") {
      await store.updatePost(post.id, { status: "canceled" }, [post.status]);
    } else {
      await store.deletePost(user.id, post.id);
    }
    return Response.json({ ok: true });
  }, "/api/social/posts/[id]");
}
