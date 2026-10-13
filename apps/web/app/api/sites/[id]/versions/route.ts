import { VersionsResponse } from "@nosweat/schema";
import { handle, jsonResponse, notFound, unauthorized } from "@/server/http";
import { requireSiteAccess } from "@/server/sites";
import { getSiteStore } from "@/server/store";

type Context = { params: Promise<{ id: string }> };

/** GET /api/sites/[id]/versions → versões salvas (mais recentes primeiro, sem o conteúdo). */
export async function GET(_request: Request, { params }: Context): Promise<Response> {
  return handle(async () => {
    const { id } = await params;
    const { actor, site } = await requireSiteAccess(id);
    if (!actor) return unauthorized();
    if (!site) return notFound();
    const versions = await getSiteStore().listVersions(site.id);
    return jsonResponse(VersionsResponse, {
      versions: versions.map(({ id: versionId, source, createdAt }) => ({
        id: versionId,
        source,
        createdAt,
      })),
    });
  });
}
