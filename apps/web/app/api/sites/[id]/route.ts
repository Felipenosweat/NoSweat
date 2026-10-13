import {
  DeleteSiteResponse,
  GetSiteResponse,
  UpdateSiteRequest,
  UpdateSiteResponse,
} from "@nosweat/schema";
import { getVercelConfig, removeDomain } from "@/server/domains";
import { handle, jsonResponse, notFound, readJson, unauthorized } from "@/server/http";
import { hasUnpublishedChanges, requireOwnedSite, requireSiteAccess } from "@/server/sites";
import { getSiteStore } from "@/server/store";

type Context = { params: Promise<{ id: string }> };

/** GET /api/sites/[id] → { siteId, spec, status } */
export async function GET(_request: Request, { params }: Context): Promise<Response> {
  return handle(async () => {
    const { id } = await params;
    const { actor, site } = await requireSiteAccess(id);
    if (!actor) return unauthorized();
    // Site de outra pessoa responde 404, igual a um que não existe.
    if (!site) return notFound();
    return jsonResponse(GetSiteResponse, {
      siteId: site.id,
      spec: site.spec,
      status: site.status,
      publishedSpec: site.publishedSpec,
      hasUnpublishedChanges: hasUnpublishedChanges(site),
    });
  });
}

/** PATCH /api/sites/[id]: { spec } → { siteId, spec }. Salva o RASCUNHO (o site no ar não muda). */
export async function PATCH(request: Request, { params }: Context): Promise<Response> {
  return handle(async () => {
    const { id } = await params;
    const { actor, site: current } = await requireSiteAccess(id);
    if (!actor) return unauthorized();
    if (!current) return notFound();

    const input = await readJson(request, UpdateSiteRequest);
    if (!input.ok) return input.response;

    const site = await getSiteStore().update(id, input.data.spec, "edit");
    if (!site) return notFound();
    return jsonResponse(UpdateSiteResponse, { siteId: site.id, spec: site.spec });
  });
}

/**
 * DELETE /api/sites/[id] → { siteId, deleted: true }. Apaga o site para sempre (sai do ar,
 * libera o domínio próprio e some com versões e mensagens). Não usa a IA: não gasta créditos.
 */
export async function DELETE(_request: Request, { params }: Context): Promise<Response> {
  return handle(async () => {
    const { id } = await params;
    const { user, site } = await requireOwnedSite(id);
    if (!user) return unauthorized();
    if (!site) return notFound();

    const vercel = getVercelConfig();
    if (vercel && site.customDomain) {
      // Se a Vercel falhar, o site é apagado mesmo assim; o domínio sobra no projeto (inofensivo).
      await removeDomain(vercel, site.customDomain).catch(() => undefined);
    }
    if (!(await getSiteStore().delete(site.id))) return notFound();
    return jsonResponse(DeleteSiteResponse, { siteId: site.id, deleted: true });
  });
}
