import { GetSiteResponse, UpdateSiteRequest, UpdateSiteResponse } from "@nosweat/schema";
import { getCurrentUser } from "@/server/auth/session";
import { handle, jsonResponse, notFound, readJson, unauthorized } from "@/server/http";
import { getSiteStore } from "@/server/store";

type Context = { params: Promise<{ id: string }> };

/** GET /api/sites/[id] → { siteId, spec, status } */
export async function GET(_request: Request, { params }: Context): Promise<Response> {
  return handle(async () => {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { id } = await params;
    const site = await getSiteStore().get(id);
    // Site de outra pessoa responde 404, igual a um que não existe.
    if (!site || site.ownerId !== user.id) return notFound();
    return jsonResponse(GetSiteResponse, { siteId: site.id, spec: site.spec, status: site.status });
  });
}

/** PATCH /api/sites/[id]: { spec } → { siteId, spec } */
export async function PATCH(request: Request, { params }: Context): Promise<Response> {
  return handle(async () => {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const { id } = await params;
    const input = await readJson(request, UpdateSiteRequest);
    if (!input.ok) return input.response;

    const store = getSiteStore();
    const current = await store.get(id);
    if (!current || current.ownerId !== user.id) return notFound();

    const site = await store.update(id, input.data.spec);
    if (!site) return notFound();
    return jsonResponse(UpdateSiteResponse, { siteId: site.id, spec: site.spec });
  });
}
