import { PublishSiteResponse } from "@nosweat/schema";
import { handle, jsonResponse, notFound, unauthorized } from "@/server/http";
import { freeUrl, requireOwnedSite } from "@/server/sites";
import { getSiteStore } from "@/server/store";
import { revalidatePublicSite } from "@/server/store/revalidate";

type Context = { params: Promise<{ id: string }> };

/**
 * POST /api/sites/[id]/unpublish → { siteId, status: "draft", url, updatedAt }.
 * Tira o site do ar sem apagar nada: o endereço grátis (slug), a versão publicada e o domínio
 * próprio ficam guardados, e publicar de novo volta tudo como estava. Enquanto isso, quem abre
 * o endereço vê "não encontrado" (as páginas públicas só mostram sites com status "published").
 * Só o dono (ou admin) pode; visitantes sem conta nunca publicaram.
 */
export async function POST(request: Request, { params }: Context): Promise<Response> {
  return handle(async () => {
    const { id } = await params;
    const { user, site } = await requireOwnedSite(id);
    if (!user) return unauthorized();
    if (!site) return notFound();

    // Já está fora do ar: responde o estado atual (clicar duas vezes não é erro).
    const updated =
      site.status === "draft"
        ? site
        : await getSiteStore().updateMeta(site.id, { status: "draft" });
    if (!updated) return notFound();
    if (updated !== site) revalidatePublicSite(updated);

    const origin = new URL(request.url).origin;
    return jsonResponse(PublishSiteResponse, {
      siteId: updated.id,
      status: updated.status,
      url: freeUrl(updated, origin) ?? origin,
      updatedAt: updated.updatedAt,
    });
  }, "/api/sites/[id]/unpublish");
}
