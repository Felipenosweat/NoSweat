// EXPERIMENTO "caminho A": fotos do Unsplash para a página livre.
// Site de nível "awwwards" quase sempre vive de fotografia; sem foto, a IA só tem tipografia.
// Regras do Unsplash (as mesmas de server/images/providers.ts): hotlink das URLs da API (nunca
// baixar e hospedar), crédito "Photo by X on Unsplash" e aviso no `download_location` de cada foto
// que de fato entrou na página (`pingUsedPhotos`). Roda direto no Node: só fetch, sem imports.

import type { FreeformPhoto } from "./prompt.ts";

export type FreeformStockPhoto = FreeformPhoto & {
  /** Versão menor (1080 px) que vai para a IA VER a foto e escolher o recorte. */
  previewUrl: string;
  width: number;
  height: number;
  downloadLocation: string;
};

type UnsplashPhoto = {
  width: number;
  height: number;
  alt_description?: string | null;
  description?: string | null;
  urls: { raw: string; regular: string };
  links: { download_location: string };
  user: { name: string };
};

const API = "https://api.unsplash.com";

function headers(): Record<string, string> {
  const key = process.env.UNSPLASH_ACCESS_KEY?.trim() || "proxy-injected";
  return { Authorization: `Client-ID ${key}`, "Accept-Version": "v1" };
}

/** URL grande e nítida para a página (a CDN do Unsplash corta e comprime pela URL). */
function pageUrl(raw: string): string {
  return `${raw}${raw.includes("?") ? "&" : "?"}w=2400&q=80&auto=format&fit=max`;
}

/**
 * Busca `perQuery` fotos para cada termo (na ordem dada; sem repetir foto) e devolve no máximo
 * `max`. Termos concretos funcionam melhor ("straight razor shave", não "barber quality").
 */
export async function findFreeformPhotos(
  queries: string[],
  options: { perQuery?: number; max?: number; fetch?: typeof fetch } = {},
): Promise<FreeformStockPhoto[]> {
  const perQuery = options.perQuery ?? 2;
  const max = options.max ?? 7;
  const doFetch = options.fetch ?? fetch;
  const seen = new Set<string>();
  const photos: FreeformStockPhoto[] = [];

  for (const query of queries) {
    const url = new URL(`${API}/search/photos`);
    url.searchParams.set("query", query);
    url.searchParams.set("per_page", "10");
    url.searchParams.set("content_filter", "high");
    const response = await doFetch(url, { headers: headers() });
    if (!response.ok) throw new Error(`Unsplash search "${query}" failed: ${response.status}`);
    const body = (await response.json()) as { results?: UnsplashPhoto[] };
    let taken = 0;
    for (const photo of body.results ?? []) {
      if (taken >= perQuery || photos.length >= max) break;
      if (seen.has(photo.urls.raw)) continue;
      seen.add(photo.urls.raw);
      taken++;
      const alt = (photo.alt_description || photo.description || query).replace(/\s+/g, " ").trim();
      photos.push({
        url: pageUrl(photo.urls.raw),
        previewUrl: photo.urls.regular,
        alt: alt.length > 140 ? `${alt.slice(0, 139)}…` : alt,
        credit: `Photo by ${photo.user.name} on Unsplash`,
        width: photo.width,
        height: photo.height,
        downloadLocation: photo.links.download_location,
      });
    }
    if (photos.length >= max) break;
  }
  return photos;
}

/** Avisa o Unsplash das fotos que a página final usa (exigência da API). Nunca lança erro. */
export async function pingUsedPhotos(
  html: string,
  photos: FreeformStockPhoto[],
  doFetch: typeof fetch = fetch,
): Promise<number> {
  const used = photos.filter(
    (photo) => html.includes(photo.url) || html.includes(photo.url.replace(/&/g, "&amp;")),
  );
  await Promise.all(
    used.map((photo) =>
      doFetch(photo.downloadLocation, { headers: headers() }).catch(() => undefined),
    ),
  );
  return used.length;
}
