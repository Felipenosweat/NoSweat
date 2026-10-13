import type { SiteImage, SiteSpec } from "@nosweat/schema";
import {
  searchPexels,
  searchUnsplash,
  SEARCH_TIMEOUT_MS,
  trackImageChosen,
  type Orientation,
  type ProviderOptions,
} from "./providers";

// Busca de fotos genéricas ("scene") com cache em memória.
// Ordem: Pexels (PEXELS_API_KEY) e, se não houver chave, der erro ou vier vazio, Unsplash
// (UNSPLASH_ACCESS_KEY). Sem nenhuma chave: lista vazia, sem erro.

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const CACHE_MAX_ENTRIES = 500;

/** Cache por busca + orientação (respeita o limite de pedidos dos bancos de imagens). */
const cache = new Map<string, { expiresAt: number; results: SiteImage[] }>();

function cacheKey(query: string, orientation: Orientation): string {
  return `${orientation}:${query.trim().toLowerCase().replace(/\s+/g, " ")}`;
}

/** Algum banco de imagens configurado? */
export function hasImageProvider(): boolean {
  return Boolean(process.env.PEXELS_API_KEY || process.env.UNSPLASH_ACCESS_KEY);
}

/**
 * Busca fotos genéricas. Devolve `[]` sem chave configurada.
 * Lança erro só quando todos os bancos configurados falharam (a rota de busca vira 502).
 */
export async function searchImages(
  query: string,
  orientation: Orientation = "landscape",
  options: ProviderOptions = {},
): Promise<SiteImage[]> {
  if (!hasImageProvider()) return [];

  const key = cacheKey(query, orientation);
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.results;

  const signal = options.signal ?? AbortSignal.timeout(SEARCH_TIMEOUT_MS);
  const providerOptions = { ...options, signal };
  let lastError: unknown = null;
  let results: SiteImage[] | null = null;

  for (const provider of [searchPexels, searchUnsplash]) {
    try {
      const found = await provider(query, orientation, providerOptions);
      if (found === null) continue; // sem chave para este banco
      results = found;
      if (found.length > 0) break;
    } catch (error) {
      lastError = error;
      console.warn("[images] provider search failed", error);
    }
  }

  if (results === null) throw lastError ?? new Error("No image provider answered.");

  if (cache.size >= CACHE_MAX_ENTRIES) cache.clear();
  cache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, results });
  return results;
}

/** Só para testes. */
export function clearImageCache(): void {
  cache.clear();
}

/**
 * Preenche a foto do topo: se o hero tem `imageQuery` e não tem `image`, busca e usa a
 * primeira foto. Nunca lança erro: sem chave, sem resultado, erro ou demora, o site segue sem foto.
 *
 * Com `previous` (edição), só busca quando o `imageQuery` mudou (ou o hero é novo). Assim uma
 * foto que o dono tirou no editor não volta sozinha na próxima edição pela IA.
 */
export async function resolveHeroImage(
  spec: SiteSpec,
  options: ProviderOptions & { previous?: SiteSpec } = {},
): Promise<SiteSpec> {
  const index = spec.sections.findIndex((section) => section.type === "hero");
  const hero = spec.sections[index];
  if (!hero || hero.type !== "hero" || hero.image || !hero.imageQuery?.trim()) return spec;

  if (options.previous) {
    const before = options.previous.sections.find((section) => section.type === "hero");
    if (before?.type === "hero" && before.imageQuery === hero.imageQuery) return spec;
  }

  try {
    const [first] = await searchImages(hero.imageQuery, "landscape", options);
    if (!first) return spec;
    await trackImageChosen(first, options);
    const sections = spec.sections.slice();
    sections[index] = { ...hero, image: first };
    return { ...spec, sections };
  } catch (error) {
    console.warn("[images] hero image lookup failed; continuing without a photo", error);
    return spec;
  }
}
