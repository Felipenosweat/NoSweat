import { notFound } from "@/server/http";
import { getDevSocialMedia } from "@/server/social/media";
import { getStorageConfig } from "@/server/storage";

type Context = { params: Promise<{ path: string[] }> };

/** GET /api/social/media/dev/<caminho>: fotos guardadas na memória (só dev, sem Supabase). */
export async function GET(_request: Request, { params }: Context): Promise<Response> {
  if (getStorageConfig()) return notFound("Photo");
  const { path } = await params;
  const bytes = getDevSocialMedia(path.join("/"));
  if (!bytes) return notFound("Photo");
  return new Response(new Blob([bytes as BlobPart], { type: "image/jpeg" }), {
    headers: { "Content-Type": "image/jpeg", "Cache-Control": "private, max-age=3600" },
  });
}
