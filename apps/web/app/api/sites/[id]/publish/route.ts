import { PublishSiteResponse } from "@nosweat/schema";
import { publishBlocked } from "@/server/billing";
import { makeSlug } from "@/server/domains";
import { placeholdersIn } from "@/lib/placeholders";
import { errorResponse, handle, jsonResponse, notFound, unauthorized } from "@/server/http";
import { freeUrl, requireOwnedSite } from "@/server/sites";
import { getSiteStore } from "@/server/store";
import { revalidatePublicSite } from "@/server/store/revalidate";

type Context = { params: Promise<{ id: string }> };

/**
 * POST /api/sites/[id]/publish → { siteId, status, url, updatedAt } (url = endereço grátis
 * /s/<slug>).
 * Também serve para "publicar as mudanças" do rascunho de um site que já está no ar.
 */
export async function POST(request: Request, { params }: Context): Promise<Response> {
  return handle(async () => {
    const { id } = await params;
    const { user, site } = await requireOwnedSite(id);
    if (!user) return unauthorized();
    if (!site) return notFound();

    // Site sem nome ou sem título não vai ao ar (o schema aceita vazio; o servidor é quem barra).
    // Antes da cobrança: o dono não deve pagar para depois descobrir que falta o nome.
    const hero = site.spec.sections.find((section) => section.type === "hero");
    if (!site.spec.business.name.trim() || (hero?.type === "hero" && !hero.title.trim())) {
      return errorResponse(
        400,
        "invalid_request",
        "Add your business name and headline before publishing.",
      );
    }

    // Texto de exemplo do editor (ex.: depoimento de mentira) nunca vai ao ar.
    const leftovers = placeholdersIn(site.spec);
    if (leftovers.length > 0) {
      return errorResponse(
        400,
        "invalid_request",
        `Replace the example text before publishing: “${leftovers.join("”, “")}”.`,
      );
    }

    // Com a cobrança ligada, publicar exige um plano ativo e respeita o limite de sites no ar
    // do plano (402 → tela de planos). Republicar um site que já está no ar não conta.
    const unpaid = await publishBlocked(user, site);
    if (unpaid) return unpaid;

    const published = await getSiteStore().updateMeta(site.id, {
      status: "published",
      // Publicar = copiar o rascunho atual para o que está no ar.
      publishedSpec: site.spec,
      slug: site.slug ?? makeSlug(site.spec.business.name, site.id),
      publishedAt: site.publishedAt ?? new Date().toISOString(),
    });
    if (!published) return notFound();
    // A página pública (/s/<slug> e o domínio) mostra a versão nova já na próxima visita.
    revalidatePublicSite(published);

    const url = freeUrl(published, new URL(request.url).origin);
    return jsonResponse(PublishSiteResponse, {
      siteId: published.id,
      status: published.status,
      url: url ?? new URL(request.url).origin,
      updatedAt: published.updatedAt,
    });
  }, "/api/sites/[id]/publish");
}
