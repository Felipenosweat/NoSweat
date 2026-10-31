import { ProspectSearchRequest, ProspectSearchResponse } from "@/lib/prospects";
import { errorResponse, handle, jsonResponse, readJson } from "@/server/http";
import { requireAdminApi } from "@/server/models/http";
import { PlacesError } from "@/server/prospects/places";
import { searchProspects } from "@/server/prospects/service";

// Até 60 empresas, cada site conferido em até ~6 s (6 ao mesmo tempo).
export const maxDuration = 300;

/**
 * POST /api/admin/prospects/search: { trade, city, state } → { query, found, added, updated, mock }
 * Busca no Google Places (com GOOGLE_MAPS_API_KEY) ou no OpenStreetMap (grátis), confere os sites
 * e grava.
 */
export async function POST(request: Request): Promise<Response> {
  return handle(async () => {
    const admin = await requireAdminApi();
    if (!admin.ok) return admin.response;
    const input = await readJson(request, ProspectSearchRequest);
    if (!input.ok) return input.response;
    try {
      const result = await searchProspects(input.data);
      return jsonResponse(ProspectSearchResponse, result);
    } catch (error) {
      if (!(error instanceof PlacesError)) throw error;
      // Pedido que a fonte não atende (ramo sem tag no OSM, cidade desconhecida): 400.
      if (error.status === 400) return errorResponse(400, "invalid_request", error.message);
      console.error("[prospects] places search failed", error);
      return errorResponse(error.status === 429 ? 429 : 502, "places_error", error.message);
    }
  }, "/api/admin/prospects/search");
}
