import { GetSiteResponse, UpdateSiteRequest, UpdateSiteResponse } from "@nosweat/schema";
import { handle, jsonResponse, notFound, readJson } from "@/server/http";
import { getSiteStore } from "@/server/store";

type Context = { params: Promise<{ id: string }> };

/** GET /api/sites/[id] → { siteId, spec, status } */
export async function GET(_request: Request, { params }: Context): Promise<Response> {
  return handle(async () => {
    const { id } = await params;
    const site = await getSiteStore().get(id);
    if (!site) return notFound();
    return jsonResponse(GetSiteResponse, { siteId: site.id, spec: site.spec, status: site.status });
  });
}

/** PATCH /api/sites/[id]: { spec } → { siteId, spec } */
export async function PATCH(request: Request, { params }: Context): Promise<Response> {
  return handle(async () => {
    const { id } = await params;
    const input = await readJson(request, UpdateSiteRequest);
    if (!input.ok) return input.response;

    const site = await getSiteStore().update(id, input.data.spec);
    if (!site) return notFound();
    return jsonResponse(UpdateSiteResponse, { siteId: site.id, spec: site.spec });
  });
}
