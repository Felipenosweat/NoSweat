import { SiteImage } from "@nosweat/schema";

// Clientes dos bancos de imagens (Pexels e Unsplash), só com fetch.
// Sem chave configurada, cada cliente devolve `null` ("não configurado") e ninguém vê erro.

export type Orientation = "landscape" | "portrait" | "square";

/** Tempo máximo de uma busca: o gerador não pode ficar preso esperando foto. */
export const SEARCH_TIMEOUT_MS = 4000;

/** Largura pedida às CDNs: suficiente para um topo de página em tela grande. */
const TARGET_WIDTH = 1920;

const PER_PAGE = 12;

type FetchLike = typeof fetch;

export type ProviderOptions = { fetch?: FetchLike; signal?: AbortSignal };

function truncate(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}…`;
}

/** Mantém só as fotos que respeitam o contrato (https, tamanhos de texto etc.). */
function onlyValid(images: unknown[]): SiteImage[] {
  return images.flatMap((image) => {
    const parsed = SiteImage.safeParse(image);
    return parsed.success ? [parsed.data] : [];
  });
}

/** Altura proporcional quando a CDN reduz a foto para TARGET_WIDTH. */
function scaledSize(width: number, height: number): { width: number; height: number } {
  if (!(width > 0 && height > 0)) return { width: TARGET_WIDTH, height: TARGET_WIDTH };
  if (width <= TARGET_WIDTH) return { width, height };
  return { width: TARGET_WIDTH, height: Math.round((height * TARGET_WIDTH) / width) };
}

// ---------------------------------------------------------------------------------------------
// Pexels — https://www.pexels.com/api/documentation/
// Regras: mostrar crédito ao fotógrafo e ao Pexels; pode hotlinkar as URLs de `src`.

type PexelsPhoto = {
  width: number;
  height: number;
  alt?: string | null;
  photographer: string;
  photographer_url: string;
  src: { original: string; large2x?: string; landscape?: string };
};

export async function searchPexels(
  query: string,
  orientation: Orientation,
  options: ProviderOptions = {},
): Promise<SiteImage[] | null> {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return null;

  const url = new URL("https://api.pexels.com/v1/search");
  url.searchParams.set("query", query);
  url.searchParams.set("orientation", orientation);
  url.searchParams.set("per_page", String(PER_PAGE));

  const response = await (options.fetch ?? fetch)(url, {
    headers: { Authorization: key },
    signal: options.signal,
  });
  if (!response.ok) throw new Error(`Pexels search failed with status ${response.status}`);
  const body = (await response.json()) as { photos?: PexelsPhoto[] };

  return onlyValid(
    (body.photos ?? []).map((photo) => {
      // A URL original aceita parâmetros de redimensionamento da CDN do Pexels.
      const sized = `${photo.src.original}?auto=compress&cs=tinysrgb&w=${TARGET_WIDTH}`;
      return {
        url: photo.src.original ? sized : (photo.src.large2x ?? photo.src.landscape),
        alt: truncate(photo.alt || query, 160),
        source: "pexels",
        kind: "scene",
        credit: { name: truncate(photo.photographer, 80), url: photo.photographer_url },
        ...scaledSize(photo.width, photo.height),
      };
    }),
  );
}

// ---------------------------------------------------------------------------------------------
// Unsplash — https://unsplash.com/documentation
// Regras: hotlinkar `urls.*` (nunca baixar e hospedar), avisar o `download_location` quando a
// foto é ESCOLHIDA, e creditar "Photo by X on Unsplash" com links que levam utm_source/utm_medium.

const UNSPLASH_UTM = "utm_source=nosweat&utm_medium=referral";

type UnsplashPhoto = {
  width: number;
  height: number;
  alt_description?: string | null;
  description?: string | null;
  urls: { regular: string; raw?: string };
  links: { download_location: string };
  user: { name: string; links: { html: string } };
};

/**
 * `download_location` de cada foto do Unsplash já mostrada numa busca (por URL da foto),
 * para avisar o Unsplash quando ela for escolhida. Fica só na memória deste servidor.
 */
const unsplashDownloadLocations = new Map<string, string>();
const MAX_TRACKED = 2000;

function withUtm(link: string): string {
  return `${link}${link.includes("?") ? "&" : "?"}${UNSPLASH_UTM}`;
}

export async function searchUnsplash(
  query: string,
  orientation: Orientation,
  options: ProviderOptions = {},
): Promise<SiteImage[] | null> {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return null;

  const url = new URL("https://api.unsplash.com/search/photos");
  url.searchParams.set("query", query);
  url.searchParams.set("orientation", orientation === "square" ? "squarish" : orientation);
  url.searchParams.set("per_page", String(PER_PAGE));
  url.searchParams.set("content_filter", "high");

  const response = await (options.fetch ?? fetch)(url, {
    headers: { Authorization: `Client-ID ${key}`, "Accept-Version": "v1" },
    signal: options.signal,
  });
  if (!response.ok) throw new Error(`Unsplash search failed with status ${response.status}`);
  const body = (await response.json()) as { results?: UnsplashPhoto[] };

  const images = onlyValid(
    (body.results ?? []).map((photo) => {
      if (unsplashDownloadLocations.size >= MAX_TRACKED) unsplashDownloadLocations.clear();
      unsplashDownloadLocations.set(photo.urls.regular, photo.links.download_location);
      return {
        url: photo.urls.regular,
        alt: truncate(photo.alt_description || photo.description || query, 160),
        source: "unsplash",
        kind: "scene",
        // O template mostra "Photo by <name> on Unsplash"; o link já leva os parâmetros utm.
        credit: { name: truncate(photo.user.name, 80), url: withUtm(photo.user.links.html) },
        // `urls.regular` tem 1080 px de largura.
        width: 1080,
        height:
          photo.width > 0 && photo.height > 0
            ? Math.round((photo.height * 1080) / photo.width)
            : 1080,
      };
    }),
  );
  return images;
}

/**
 * Avisa o Unsplash que a foto foi usada (exigência da API). Chamar quando a foto entra no site.
 * Fotos de outros bancos (ou que este servidor não buscou) são ignoradas. Nunca lança erro.
 */
export async function trackImageChosen(
  image: SiteImage,
  options: { fetch?: FetchLike } = {},
): Promise<void> {
  if (image.source !== "unsplash") return;
  const key = process.env.UNSPLASH_ACCESS_KEY;
  const location = unsplashDownloadLocations.get(image.url);
  if (!key || !location) return;
  try {
    await (options.fetch ?? fetch)(location, {
      headers: { Authorization: `Client-ID ${key}`, "Accept-Version": "v1" },
      signal: AbortSignal.timeout(SEARCH_TIMEOUT_MS),
    });
  } catch (error) {
    console.warn("[images] unsplash download ping failed", error);
  }
}

/** Só para testes. */
export function resetUnsplashTracking(): void {
  unsplashDownloadLocations.clear();
}
