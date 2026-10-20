import {
  ApiError,
  ImageSearchResponse,
  UploadImageResponse,
  type SiteImage,
} from "@nosweat/schema";
import { resizePhoto } from "@/lib/image-resize";

// Chamadas de fotos do editor (busca em banco de imagens e upload do dono).
// Sempre devolvem `{ ok, ... }` em vez de lançar erro, para a tela só mostrar a mensagem.

/** Limite da foto ORIGINAL escolhida (conferido antes de reduzir no navegador). */
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
/**
 * Limite do que vai para o servidor: o mesmo MAX_IMAGE_BYTES de server/storage/images.ts (4 MB),
 * abaixo dos 4,5 MB que a Vercel aceita no corpo do pedido.
 */
export const MAX_SEND_BYTES = 4 * 1024 * 1024;
export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const ACCEPT_ATTR = ACCEPTED_TYPES.join(",");
export const MAX_ALT = 160;
export const MAX_GALLERY_IMAGES = 12;

const NETWORK_ERROR = "We couldn't reach our servers. Please try again.";
/** Texto para o cliente quando o upload ainda não está ligado (501), seja qual for a mensagem do servidor. */
export const UPLOADS_UNAVAILABLE = "Photo uploads aren’t available yet. Please try again later.";
/** Visitante (sem conta) tentou enviar foto: o upload é só para contas (custo de armazenamento). */
export const SIGNUP_FOR_UPLOADS = "Create a free account to upload your own photos.";
const SIGNUP_FOR_SEARCH = "Create a free account to search for photos.";
const TOO_LARGE = "This photo is too large. Try a smaller one.";

export type SearchResult =
  | { ok: true; results: SiteImage[] }
  /** `signup`: precisa de conta (401); a tela mostra o link para criar uma. */
  | { ok: false; notConfigured: boolean; message: string; signup?: boolean };

export type UploadResult =
  | { ok: true; image: SiteImage }
  /** `unavailable`: o upload não está ligado no servidor (501); não adianta tentar outro arquivo. */
  /** `signup`: visitante sem conta (401); a tela mostra o link para criar uma. */
  | { ok: false; message: string; unavailable?: boolean; signup?: boolean };

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
    if (res.status === 401) {
      return { ok: false, notConfigured: false, message: SIGNUP_FOR_SEARCH, signup: true };
    }
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

/** Confere tipo e tamanho da foto original antes de reduzir e enviar (o servidor confere de novo). */
export function checkFile(file: File): string | null {
  if (!(ACCEPTED_TYPES as readonly string[]).includes(file.type)) {
    return `“${file.name}” isn't a JPG, PNG or WebP photo.`;
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return `“${file.name}” is larger than 25 MB. Try a smaller photo.`;
  }
  return null;
}

/**
 * Deixa a foto pronta para o envio: JPEG sempre passa pelo canvas (lado maior até 2400 px, rotação
 * do celular aplicada, sem a localização GPS) e sai abaixo de 4 MB; PNG/WebP até 4 MB vão como estão,
 * e maiores viram JPEG. Se o navegador não conseguir ler a foto, ela vai como está quando cabe.
 */
async function prepareUpload(
  file: File,
): Promise<{ ok: true; file: File } | { ok: false; message: string }> {
  if (file.type !== "image/jpeg" && file.size <= MAX_SEND_BYTES) return { ok: true, file };
  try {
    const resized = await resizePhoto(file, { maxBytes: MAX_SEND_BYTES });
    return { ok: true, file: resized.file };
  } catch {
    if (file.size <= MAX_SEND_BYTES) return { ok: true, file };
    return { ok: false, message: `“${file.name}” is too large. Try a smaller photo.` };
  }
}

export async function uploadImage(siteId: string, file: File, alt?: string): Promise<UploadResult> {
  const invalid = checkFile(file);
  if (invalid) return { ok: false, message: invalid };

  const prepared = await prepareUpload(file);
  if (!prepared.ok) return prepared;

  const form = new FormData();
  form.append("file", prepared.file);
  if (alt?.trim()) form.append("alt", alt.trim().slice(0, MAX_ALT));
  try {
    const res = await fetch(`/api/sites/${encodeURIComponent(siteId)}/images`, {
      method: "POST",
      body: form,
    });
    if (res.status === 501) {
      return { ok: false, message: UPLOADS_UNAVAILABLE, unavailable: true };
    }
    if (res.status === 401) {
      return { ok: false, message: SIGNUP_FOR_UPLOADS, signup: true };
    }
    // A Vercel responde 413 fora do formato da API quando o corpo passa de 4,5 MB.
    if (res.status === 413) {
      return { ok: false, message: TOO_LARGE };
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
