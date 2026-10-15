import type { SocialMedia } from "@nosweat/schema";
import { detectImageFormat, getStorageConfig, imageSize, type StorageConfig } from "../storage";

// Fotos dos posts (bucket público `social-media`, migration 0014). O navegador já entrega JPEG
// comprimido (lib/social-image.ts); aqui conferimos de novo os bytes, o tamanho e a proporção que o
// Instagram aceita. Sem Supabase (dev local e testes), as fotos ficam na memória e são servidas por
// /api/social/media/dev/<caminho>.

export const SOCIAL_MEDIA_BUCKET = "social-media";
/** Abaixo do limite de 4,5 MB do corpo das funções da Vercel. */
export const MAX_SOCIAL_MEDIA_BYTES = 4 * 1024 * 1024;
/** Proporções aceitas pelo Instagram no feed: de 4:5 (retrato) até 1,91:1 (paisagem). */
export const MIN_RATIO = 0.8;
export const MAX_RATIO = 1.91;

export type MediaCheck =
  | { ok: true; width: number; height: number }
  | { ok: false; status: 400 | 413; message: string };

export function checkSocialPhoto(bytes: Uint8Array): MediaCheck {
  if (bytes.byteLength === 0) return { ok: false, status: 400, message: "The file is empty." };
  if (bytes.byteLength > MAX_SOCIAL_MEDIA_BYTES) {
    return { ok: false, status: 413, message: "Photos can be up to 4 MB." };
  }
  const format = detectImageFormat(bytes);
  if (!format || format.mime !== "image/jpeg") {
    return { ok: false, status: 400, message: "Instagram only accepts JPG photos." };
  }
  const { width, height } = imageSize(bytes, format);
  if (!width || !height) {
    return { ok: false, status: 400, message: "We couldn't read this photo. Try another one." };
  }
  const ratio = width / height;
  // Pequena folga para arredondamentos (ex.: 1080x1351).
  if (ratio < MIN_RATIO - 0.01 || ratio > MAX_RATIO + 0.01) {
    return {
      ok: false,
      status: 400,
      message: "Instagram needs a photo between portrait 4:5 and landscape 1.91:1.",
    };
  }
  return { ok: true, width, height };
}

/** Caminho no bucket: `<dono>/<aleatório>.jpg`. */
export function socialMediaPath(ownerId: string): string {
  const owner = ownerId.replace(/[^A-Za-z0-9_-]/g, "") || "owner";
  return `${owner}/${crypto.randomUUID().replaceAll("-", "")}.jpg`;
}

export function publicSocialMediaUrl(config: StorageConfig, path: string): string {
  return `${config.url}/storage/v1/object/public/${SOCIAL_MEDIA_BUCKET}/${path}`;
}

// ---------- dev sem Supabase ----------

const globalForMedia = globalThis as typeof globalThis & {
  __nosweatSocialMedia?: Map<string, Uint8Array>;
};

function devFiles(): Map<string, Uint8Array> {
  globalForMedia.__nosweatSocialMedia ??= new Map();
  return globalForMedia.__nosweatSocialMedia;
}

/** Bytes de uma foto guardada na memória (só dev). */
export function getDevSocialMedia(path: string): Uint8Array | null {
  return devFiles().get(path) ?? null;
}

/**
 * Guarda a foto já conferida e devolve o SocialMedia. `origin` é o endereço do app (para montar a
 * URL de dev quando não há Supabase).
 */
export async function storeSocialPhoto(
  ownerId: string,
  bytes: Uint8Array,
  size: { width: number; height: number },
  origin: string,
  alt?: string,
  fetchImpl: typeof fetch = fetch,
): Promise<SocialMedia> {
  const path = socialMediaPath(ownerId);
  const config = getStorageConfig();
  let url: string;
  if (config) {
    const res = await fetchImpl(`${config.url}/storage/v1/object/${SOCIAL_MEDIA_BUCKET}/${path}`, {
      method: "POST",
      cache: "no-store",
      headers: {
        apikey: config.serviceKey,
        Authorization: `Bearer ${config.serviceKey}`,
        "Content-Type": "image/jpeg",
        "Cache-Control": "31536000",
        "x-upsert": "false",
      },
      body: new Blob([bytes as BlobPart], { type: "image/jpeg" }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) throw new Error(`Storage upload failed (${res.status}): ${await res.text()}`);
    url = publicSocialMediaUrl(config, path);
  } else {
    devFiles().set(path, bytes);
    url = `${origin.replace(/\/+$/, "")}/api/social/media/dev/${path}`;
  }
  return {
    path,
    url,
    width: size.width,
    height: size.height,
    mime: "image/jpeg",
    ...(alt ? { alt: alt.slice(0, 300) } : {}),
  };
}

/** A foto pertence ao dono? (o caminho começa com o id dele; evita usar fotos de outra conta). */
export function mediaBelongsTo(ownerId: string, media: SocialMedia): boolean {
  const owner = ownerId.replace(/[^A-Za-z0-9_-]/g, "") || "owner";
  return media.path.startsWith(`${owner}/`);
}
