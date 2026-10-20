import { ImageSearchQuery, ImageSearchResponse } from "@nosweat/schema";
import { errorResponse, handle, jsonResponse, unauthorized } from "@/server/http";
import { searchImages } from "@/server/images";
import { getActor } from "@/server/sites";

/**
 * GET /api/images/search?q=&orientation= → { results: SiteImage[] }
 * Fotos genéricas (Pexels/Unsplash) para o editor. Precisa de conta OU de visitante (cookie
 * `ns_guest`): quem cria sem conta também troca a foto do topo. As buscas ficam em cache por 24 h
 * (server/images/search.ts), então visitantes não gastam a cota do banco de imagens à toa.
 * Sem chave de banco de imagens configurada: 501 not_implemented (o editor mostra "ainda não configurado").
 */
export async function GET(request: Request): Promise<Response> {
  return handle(async () => {
    const actor = await getActor();
    if (!actor) return unauthorized();

    const params = new URL(request.url).searchParams;
    const input = ImageSearchQuery.safeParse({
      q: params.get("q") ?? "",
      orientation: params.get("orientation") ?? undefined,
    });
    if (!input.success) {
      const message = input.error.issues
        .map((issue) =>
          issue.path.length ? `${issue.path.join(".")}: ${issue.message}` : issue.message,
        )
        .join("; ");
      return errorResponse(400, "invalid_request", message);
    }

    if (!process.env.PEXELS_API_KEY && !process.env.UNSPLASH_ACCESS_KEY) {
      return errorResponse(501, "not_implemented", "Photo search isn’t set up yet.");
    }

    try {
      const results = await searchImages(input.data.q, input.data.orientation);
      return jsonResponse(ImageSearchResponse, { results });
    } catch (error) {
      console.error("[api] image search failed", error);
      return errorResponse(
        502,
        "image_error",
        "We couldn't search for photos right now. Please try again.",
      );
    }
  });
}
