import { GenerateSiteRequest, GenerateSiteResponse, type SiteSpec } from "@nosweat/schema";
import { generateSiteSpec } from "@/server/ai";
import { getCurrentUser } from "@/server/auth/session";
import { resolveHeroImage } from "@/server/images";
import { errorResponse, handle, jsonResponse, readJson, unauthorized } from "@/server/http";
import { quotaExceeded, recordUse } from "@/server/quota";
import { getSiteStore } from "@/server/store";

// A IA de verdade leva alguns segundos (às vezes dezenas) para montar o site.
export const maxDuration = 60;

/** POST /api/sites/generate: { brief } → { siteId, spec } */
export async function POST(request: Request): Promise<Response> {
  return handle(async () => {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const input = await readJson(request, GenerateSiteRequest);
    if (!input.ok) return input.response;

    const overLimit = await quotaExceeded(user, "generate");
    if (overLimit) return overLimit;

    let spec: SiteSpec;
    try {
      spec = await generateSiteSpec(input.data.brief);
    } catch (error) {
      console.error("[api] site generation failed", error);
      return errorResponse(
        502,
        "generation_failed",
        "We couldn't generate your site right now. Please try again.",
      );
    }

    // Foto do topo a partir de hero.imageQuery (sem chave, erro ou demora: segue sem foto).
    spec = await resolveHeroImage(spec);

    await recordUse(user, "generate");
    const site = await getSiteStore().create(spec, user.id);
    return jsonResponse(GenerateSiteResponse, { siteId: site.id, spec: site.spec }, 201);
  });
}
