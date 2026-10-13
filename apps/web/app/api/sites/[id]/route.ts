import { GetSiteResponse, UpdateSiteRequest, UpdateSiteResponse } from "@nosweat/schema";
import { handle, jsonResponse, notFound, readJson, unauthorized } from "@/server/http";
import { hasUnpublishedChanges, requireOwnedSite } from "@/server/sites";
import { getSiteStore } from "@/server/store";

type Context = { params: Promise<{ id: string }> };

/** GET /api/sites/[id] → { siteId, spec, status } */
export async function GET(_request: Request, { params }: Context): Promise<Response> {
  return handle(async () => {
    const { id } = await params;
    const { user, site } = await requireOwnedSite(id);
    if (!user) return unauthorized();
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
    const { user, site: current } = await requireOwnedSite(id);
    if (!user) return unauthorized();
    if (!current) return notFound();

    const input = await readJson(request, UpdateSiteRequest);
    if (!input.ok) return input.response;

    const site = await getSiteStore().update(id, input.data.spec, "edit");
    if (!site) return notFound();
    return jsonResponse(UpdateSiteResponse, { siteId: site.id, spec: site.spec });
  });
}
