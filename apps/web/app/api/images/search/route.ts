import { ImageSearchQuery, ImageSearchResponse } from "@nosweat/schema";
import { getCurrentUser } from "@/server/auth/session";
import { errorResponse, handle, jsonResponse, unauthorized } from "@/server/http";
import { searchImages } from "@/server/images";

/**
 * GET /api/images/search?q=&orientation= → { results: SiteImage[] }
 * Fotos genéricas (Pexels/Unsplash) para o editor. Precisa de login.
 * Sem chave de banco de imagens configurada: { results: [] } com 200.
 */
export async function GET(request: Request): Promise<Response> {
  return handle(async () => {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

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
