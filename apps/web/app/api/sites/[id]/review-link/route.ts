import { ReviewLinkResponse, UpdateReviewLinkRequest } from "@nosweat/schema";
import { handle, jsonResponse, notFound, readJson, unauthorized } from "@/server/http";
import { savesExceeded } from "@/server/quota";
import { saveReviewLink } from "@/server/reviews";
import { requireOwnedSite } from "@/server/sites";
import { revalidatePublicSite } from "@/server/store/revalidate";

type Context = { params: Promise<{ id: string }> };

/**
 * PUT /api/sites/[id]/review-link: { url } → { siteId, googleReviewUrl, live, updatedAt }.
 * Salva o link de avaliações do Google do dono (`url: null` tira o botão do site). Muda o
 * rascunho (com versão, como o editor) e, se o site estiver no ar, só este campo da versão
 * publicada (ver saveReviewLink). Só o dono (ou admin): visitantes sem conta não usam /reviews.
 */
export async function PUT(request: Request, { params }: Context): Promise<Response> {
  return handle(async () => {
    const { id } = await params;
    const { user, site } = await requireOwnedSite(id);
    if (!user) return unauthorized();
    if (!site) return notFound();

    const input = await readJson(request, UpdateReviewLinkRequest);
    if (!input.ok) return input.response;

    // Cada salvamento vira uma versão: o mesmo limite de salvamentos do editor.
    const tooFast = await savesExceeded(site.id);
    if (tooFast) return tooFast;

    const updated = await saveReviewLink(site, input.data.url);
    if (!updated) return notFound();
    // No ar, o botão "Review us on Google" muda já (só este campo vai para a versão publicada).
    if (updated.status === "published") revalidatePublicSite(updated);
    return jsonResponse(ReviewLinkResponse, {
      siteId: updated.id,
      googleReviewUrl: updated.spec.business.googleReviewUrl ?? null,
      live: updated.status === "published",
      updatedAt: updated.updatedAt,
    });
  }, "/api/sites/[id]/review-link");
}
