import { PlaceSearchQuery, PlaceSearchResponse } from "@nosweat/schema";
import { errorResponse, handle, jsonResponse } from "@/server/http";
import { searchPlaces } from "@/server/places";

/**
 * GET /api/places?q=&state= → { places: [{ name, state, population }] }
 * Sugestões de cidade para o /create. Público (o /create funciona sem conta) e sem custo:
 * os dados ficam no servidor, nada de serviço externo. Resposta pode ficar em cache.
 */
export async function GET(request: Request): Promise<Response> {
  return handle(async () => {
    const params = new URL(request.url).searchParams;
    const input = PlaceSearchQuery.safeParse({
      q: params.get("q") ?? "",
      state: params.get("state") || undefined,
    });
    if (!input.success) {
      return errorResponse(400, "invalid_request", "Use a city name and a two-letter state.");
    }
    const response = jsonResponse(PlaceSearchResponse, {
      places: searchPlaces(input.data.q, input.data.state),
    });
    response.headers.set("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
    return response;
  }, "/api/places");
}
