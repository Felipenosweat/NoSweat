import { UploadSocialMediaResponse } from "@nosweat/schema";
import { errorResponse, handle, jsonResponse } from "@/server/http";
import { appOrigin } from "@/server/notify";
import { requireSocialUser } from "@/server/social/api";
import { MAX_SOCIAL_MEDIA_BYTES, checkSocialPhoto, storeSocialPhoto } from "@/server/social/media";

/** Folga para os cabeçalhos do multipart além do arquivo. */
const MULTIPART_OVERHEAD = 64 * 1024;

/**
 * POST /api/social/media (multipart, campo "file"; "alt" opcional): foto de um post. Só JPEG até
 * 4 MB, entre 4:5 e 1,91:1 (o navegador já recorta e comprime em lib/social-image.ts).
 */
export async function POST(request: Request): Promise<Response> {
  return handle(async () => {
    const { user, response } = await requireSocialUser();
    if (!user) return response;

    const declared = Number(request.headers.get("content-length") ?? 0);
    if (declared > MAX_SOCIAL_MEDIA_BYTES + MULTIPART_OVERHEAD) {
      return errorResponse(413, "invalid_request", "Photos can be up to 4 MB.");
    }
    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return errorResponse(400, "invalid_request", "Send the photo as multipart/form-data.");
    }
    const file = form.get("file");
    if (!(file instanceof File)) {
      return errorResponse(400, "invalid_request", "Please choose a photo to upload.");
    }
    if (file.size > MAX_SOCIAL_MEDIA_BYTES) {
      return errorResponse(413, "invalid_request", "Photos can be up to 4 MB.");
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    const check = checkSocialPhoto(bytes);
    if (!check.ok) return errorResponse(check.status, "invalid_request", check.message);

    const rawAlt = form.get("alt");
    const alt = (typeof rawAlt === "string" ? rawAlt : "").trim().slice(0, 300);
    const media = await storeSocialPhoto(
      user.id,
      bytes,
      { width: check.width, height: check.height },
      appOrigin(request.url),
      alt || undefined,
    );
    return jsonResponse(UploadSocialMediaResponse, { media }, 201);
  }, "/api/social/media");
}
