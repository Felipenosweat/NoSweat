import {
  ApiError,
  ImageSearchResponse,
  UploadImageResponse,
  type SiteImage,
} from "@nosweat/schema";

// Chamadas de fotos do editor (busca em banco de imagens e upload do dono).
// Sempre devolvem `{ ok, ... }` em vez de lançar erro, para a tela só mostrar a mensagem.

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const ACCEPT_ATTR = ACCEPTED_TYPES.join(",");
export const MAX_ALT = 160;
export const MAX_GALLERY_IMAGES = 12;

const NETWORK_ERROR = "We couldn't reach our servers. Please try again.";
/** Texto para o cliente quando o upload ainda não está ligado (501), seja qual for a mensagem do servidor. */
export const UPLOADS_UNAVAILABLE = "Photo uploads aren’t available yet. Please try again later.";

export type SearchResult =
  { ok: true; results: SiteImage[] } | { ok: false; notConfigured: boolean; message: string };

export type UploadResult =
  | { ok: true; image: SiteImage }
  /** `unavailable`: o upload não está ligado no servidor (501); não adianta tentar outro arquivo. */
  | { ok: false; message: string; unavailable?: boolean };

async function readError(
  res: Response,
  fallback: string,
): Promise<{ code: string; message: string }> {
  const body: unknown = await res.json().catch(() => null);
  const parsed = ApiError.safeParse(body);
  return parsed.success ? parsed.data.error : { code: "", message: fallback };
}

export async function searchImages(q: string): Promise<SearchResult> {
  const params = new URLSearchParams({ q, orientation: "landscape" });
  try {
    const res = await fetch(`/api/images/search?${params.toString()}`);
    if (!res.ok) {
      const error = await readError(res, "Photo search failed. Please try again.");
      const notConfigured = res.status === 501 || error.code === "not_implemented";
      return { ok: false, notConfigured, message: error.message };
    }
    const parsed = ImageSearchResponse.safeParse(await res.json().catch(() => null));
    if (!parsed.success) {
      return { ok: false, notConfigured: false, message: "Photo search failed. Please try again." };
    }
    return { ok: true, results: parsed.data.results };
  } catch {
    return { ok: false, notConfigured: false, message: NETWORK_ERROR };
  }
}

/** Confere tipo e tamanho antes de enviar (o servidor confere de novo). */
export function checkFile(file: File): string | null {
  if (!(ACCEPTED_TYPES as readonly string[]).includes(file.type)) {
    return `“${file.name}” isn't a JPG, PNG or WebP photo.`;
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return `“${file.name}” is larger than 8 MB. Try a smaller photo.`;
  }
  return null;
}

export async function uploadImage(siteId: string, file: File, alt?: string): Promise<UploadResult> {
  const invalid = checkFile(file);
  if (invalid) return { ok: false, message: invalid };

  const form = new FormData();
  form.append("file", file);
  if (alt?.trim()) form.append("alt", alt.trim().slice(0, MAX_ALT));
  try {
    const res = await fetch(`/api/sites/${encodeURIComponent(siteId)}/images`, {
      method: "POST",
      body: form,
    });
    if (res.status === 501) {
      return { ok: false, message: UPLOADS_UNAVAILABLE, unavailable: true };
    }
    if (!res.ok) {
      const error = await readError(res, `We couldn't upload “${file.name}”. Please try again.`);
      return { ok: false, message: error.message };
    }
    const parsed = UploadImageResponse.safeParse(await res.json().catch(() => null));
    if (!parsed.success) {
      return { ok: false, message: `We couldn't upload “${file.name}”. Please try again.` };
    }
    // Foto enviada pelo dono é sempre "owner" (a galeria só aceita esse tipo).
    return { ok: true, image: { ...parsed.data.image, kind: "owner" } };
  } catch {
    return { ok: false, message: NETWORK_ERROR };
  }
}
