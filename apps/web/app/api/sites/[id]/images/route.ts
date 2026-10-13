import { UploadImageResponse, type SiteImage } from "@nosweat/schema";
import { errorResponse, handle, jsonResponse, notFound, unauthorized } from "@/server/http";
import { requireOwnedSite } from "@/server/sites";
import {
  MAX_IMAGE_BYTES,
  checkImageUpload,
  getStorageConfig,
  imagePath,
  uploadImage,
} from "@/server/storage";

type Context = { params: Promise<{ id: string }> };

/** Folga para os cabeçalhos do multipart além do arquivo em si. */
const MULTIPART_OVERHEAD = 64 * 1024;

/**
 * POST /api/sites/[id]/images: o dono envia uma foto (multipart, campo "file"; "alt" opcional).
 * Aceita JPG, PNG e WebP até 8 MB (confere o MIME e os bytes). Grava no bucket `site-images`
 * do Supabase Storage e devolve a SiteImage (source "upload", kind "owner").
 * Só salva o arquivo: quem coloca a foto no site é o editor (PATCH do SiteSpec).
 */
export async function POST(request: Request, { params }: Context): Promise<Response> {
  return handle(async () => {
    const { id } = await params;
    const { user, site } = await requireOwnedSite(id);
    if (!user) return unauthorized();
    if (!site) return notFound();

    const storage = getStorageConfig();
    if (!storage) {
      return errorResponse(501, "not_implemented", "Photo uploads need storage to be configured.");
    }

    const declaredLength = Number(request.headers.get("content-length") ?? 0);
    if (declaredLength > MAX_IMAGE_BYTES + MULTIPART_OVERHEAD) {
      return errorResponse(413, "invalid_request", "Photos can be up to 8 MB.");
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
    if (file.size > MAX_IMAGE_BYTES) {
      return errorResponse(413, "invalid_request", "Photos can be up to 8 MB.");
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const check = checkImageUpload(file.type, bytes);
    if (!check.ok) return errorResponse(check.status, "invalid_request", check.message);

    const rawAlt = form.get("alt");
    const alt = (typeof rawAlt === "string" ? rawAlt : "").trim().slice(0, 160);

    let url: string;
    try {
      url = await uploadImage(storage, imagePath(site.id, check.format), bytes, check.format);
    } catch (error) {
      console.error("[images] upload failed", error);
      return errorResponse(502, "image_error", "We couldn't save your photo. Please try again.");
    }

    const image: SiteImage = {
      url,
      alt,
      source: "upload",
      kind: "owner",
      ...(check.width && check.height ? { width: check.width, height: check.height } : {}),
    };
    return jsonResponse(UploadImageResponse, { image }, 201);
  });
}
