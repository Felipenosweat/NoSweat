import { UpdateSiteResponse } from "@nosweat/schema";
import { handle, jsonResponse, notFound, unauthorized } from "@/server/http";
import { savesExceeded } from "@/server/quota";
import { requireSiteAccess } from "@/server/sites";
import { getSiteStore } from "@/server/store";

type Context = { params: Promise<{ id: string; versionId: string }> };

/**
 * POST /api/sites/[id]/versions/[versionId]/restore → { siteId, spec }
 * Traz uma versão antiga de volta para o RASCUNHO (vira uma versão nova "restore").
 * Para ir ao ar, o cliente publica depois, como qualquer mudança.
 */
export async function POST(_request: Request, { params }: Context): Promise<Response> {
  return handle(async () => {
    const { id, versionId } = await params;
    const { actor, site } = await requireSiteAccess(id);
    if (!actor) return unauthorized();
    if (!site) return notFound();

    const tooFast = await savesExceeded(site.id);
    if (tooFast) return tooFast;

    const store = getSiteStore();
    const version = await store.getVersion(site.id, versionId);
    if (!version) return notFound("Version");

    const restored = await store.update(site.id, version.spec, "restore");
    if (!restored) return notFound();
    return jsonResponse(UpdateSiteResponse, { siteId: restored.id, spec: restored.spec });
  }, "/api/sites/[id]/versions/[versionId]/restore");
}
