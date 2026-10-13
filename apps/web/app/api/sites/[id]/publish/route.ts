import { PublishSiteResponse } from "@nosweat/schema";
import { publishBlocked } from "@/server/billing";
import { makeSlug } from "@/server/domains";
import { placeholdersIn } from "@/lib/placeholders";
import { errorResponse, handle, jsonResponse, notFound, unauthorized } from "@/server/http";
import { freeUrl, requireOwnedSite } from "@/server/sites";
import { getSiteStore } from "@/server/store";

type Context = { params: Promise<{ id: string }> };

/**
 * POST /api/sites/[id]/publish → { siteId, status, url } (url = endereço grátis /s/<slug>).
 * Também serve para "publicar as mudanças" do rascunho de um site que já está no ar.
 */
export async function POST(request: Request, { params }: Context): Promise<Response> {
  return handle(async () => {
    const { id } = await params;
    const { user, site } = await requireOwnedSite(id);
    if (!user) return unauthorized();
    if (!site) return notFound();

    // Com a cobrança ligada, publicar exige um plano ativo (402 → tela de planos).
    const unpaid = await publishBlocked(user);
    if (unpaid) return unpaid;

    // Texto de exemplo do editor (ex.: depoimento de mentira) nunca vai ao ar.
    const leftovers = placeholdersIn(site.spec);
    if (leftovers.length > 0) {
      return errorResponse(
        400,
        "invalid_request",
        `Replace the example text before publishing: “${leftovers.join("”, “")}”.`,
      );
    }

    const published = await getSiteStore().updateMeta(site.id, {
      status: "published",
      // Publicar = copiar o rascunho atual para o que está no ar.
      publishedSpec: site.spec,
      slug: site.slug ?? makeSlug(site.spec.business.name, site.id),
      publishedAt: site.publishedAt ?? new Date().toISOString(),
    });
    if (!published) return notFound();

    const url = freeUrl(published, new URL(request.url).origin);
    return jsonResponse(PublishSiteResponse, {
      siteId: published.id,
      status: published.status,
      url: url ?? new URL(request.url).origin,
    });
  });
}
