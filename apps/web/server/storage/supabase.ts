import { normalizeSupabaseUrl } from "../store/supabase";
import type { ImageFormat } from "./images";

// Supabase Storage via API REST (fetch), com a chave secreta: só roda no servidor.
// Bucket criado em supabase/migrations/0008_site_images_bucket.sql (público para leitura;
// gravação só pela service role).

export const SITE_IMAGES_BUCKET = "site-images";

export type StorageConfig = { url: string; serviceKey: string };

/** Configuração do Storage, ou `null` sem Supabase (dev local com store em memória). */
export function getStorageConfig(): StorageConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return { url: normalizeSupabaseUrl(url), serviceKey };
}

export class StorageError extends Error {}

/** Caminho do arquivo no bucket: `<siteId>/<aleatório>.<ext>`. */
export function imagePath(siteId: string, format: ImageFormat): string {
  return `${siteId}/${crypto.randomUUID().replaceAll("-", "")}.${format.ext}`;
}

export function publicImageUrl(config: StorageConfig, path: string): string {
  return `${config.url}/storage/v1/object/public/${SITE_IMAGES_BUCKET}/${path}`;
}

/** Envia os bytes para o bucket e devolve a URL pública. */
export async function uploadImage(
  config: StorageConfig,
  path: string,
  bytes: Uint8Array,
  format: ImageFormat,
  fetchImpl: typeof fetch = fetch,
): Promise<string> {
  const res = await fetchImpl(`${config.url}/storage/v1/object/${SITE_IMAGES_BUCKET}/${path}`, {
    method: "POST",
    cache: "no-store",
    headers: {
      apikey: config.serviceKey,
      Authorization: `Bearer ${config.serviceKey}`,
      "Content-Type": format.mime,
      "Cache-Control": "31536000",
      "x-upsert": "false",
    },
    body: new Blob([bytes as BlobPart], { type: format.mime }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) {
    throw new StorageError(`Storage upload failed (${res.status}): ${await res.text()}`);
  }
  return publicImageUrl(config, path);
}
