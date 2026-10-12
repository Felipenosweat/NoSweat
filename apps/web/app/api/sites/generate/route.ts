import { GenerateSiteRequest, GenerateSiteResponse, type SiteSpec } from "@nosweat/schema";
import { generateSiteSpec } from "@/server/ai";
import { errorResponse, handle, jsonResponse, readJson } from "@/server/http";
import { getSiteStore } from "@/server/store";

/** POST /api/sites/generate: { brief } → { siteId, spec } */
export async function POST(request: Request): Promise<Response> {
  return handle(async () => {
    const input = await readJson(request, GenerateSiteRequest);
    if (!input.ok) return input.response;

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

    const site = await getSiteStore().create(spec);
    return jsonResponse(GenerateSiteResponse, { siteId: site.id, spec: site.spec }, 201);
  });
}
