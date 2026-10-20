import { NearbyPlacesQuery, NearbyPlacesResponse } from "@nosweat/schema";
import { errorResponse, handle, jsonResponse } from "@/server/http";
import { nearbyPlaces } from "@/server/places";

/**
 * GET /api/places/nearby?city=&state= → { places: [{ name, state, population, miles }] }
 * Cidades vizinhas para sugerir na área atendida do /create. Cidade desconhecida = lista vazia.
 */
export async function GET(request: Request): Promise<Response> {
  return handle(async () => {
    const params = new URL(request.url).searchParams;
    const input = NearbyPlacesQuery.safeParse({
      city: params.get("city") ?? "",
      state: params.get("state") ?? "",
    });
    if (!input.success) {
      return errorResponse(400, "invalid_request", "Use a city name and a two-letter state.");
    }
    const response = jsonResponse(NearbyPlacesResponse, {
      places: nearbyPlaces(input.data.city, input.data.state),
    });
    response.headers.set("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
    return response;
  }, "/api/places/nearby");
}
