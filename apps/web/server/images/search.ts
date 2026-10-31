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

/** Máximo de fotos de serviço buscadas numa geração ou edição (limite dos bancos de imagens). */
export const MAX_SERVICE_IMAGES = 8;

/** Chave para comparar buscas de foto ("Clean  Kitchen" = "clean kitchen"). */
const queryKey = (query: string) => query.trim().toLowerCase().replace(/\s+/g, " ");

/**
 * Preenche a foto de cada serviço (`services[].items[].image`) a partir do `imageQuery` dele:
 * buscas em paralelo, no máximo MAX_SERVICE_IMAGES, sem repetir a mesma foto no site. Nunca
 * lança erro: sem chave, sem resultado, erro ou demora, o serviço segue sem foto.
 * - Portfólio fica sem: foto de banco num portfólio pareceria trabalho do dono.
 * - Com `previous` (edição), só busca para buscas que não existiam antes (a IA mudou ou criou
 *   o `imageQuery` do item). Assim uma foto que o dono tirou no editor não volta sozinha.
 */
export async function resolveServiceImages(
  spec: SiteSpec,
  options: ProviderOptions & { previous?: SiteSpec; max?: number } = {},
): Promise<SiteSpec> {
  if (spec.template === "portfolio" || !hasImageProvider()) return spec;

  const before = new Set(
    (options.previous?.sections ?? []).flatMap((section) =>
      section.type === "services"
        ? section.items.flatMap((item) => (item.imageQuery ? [queryKey(item.imageQuery)] : []))
        : [],
    ),
  );
  const targets: { section: number; item: number; query: string }[] = [];
  spec.sections.forEach((section, sectionIndex) => {
    if (section.type !== "services") return;
    section.items.forEach((item, itemIndex) => {
      const query = item.imageQuery?.trim();
      if (!query || item.image || before.has(queryKey(query))) return;
      targets.push({ section: sectionIndex, item: itemIndex, query });
    });
  });
  const picked = targets.slice(0, options.max ?? MAX_SERVICE_IMAGES);
  if (picked.length === 0) return spec;

  const found = await Promise.all(
    picked.map(async (target) => {
      try {
        return await searchImages(target.query, "landscape", options);
      } catch (error) {
        console.warn("[images] service image lookup failed; continuing without it", error);
        return [];
      }
    }),
  );

  // Fotos já usadas no site (topo e outros serviços) não se repetem.
  const used = new Set<string>();
  for (const section of spec.sections) {
    if (section.type === "hero" && section.image) used.add(section.image.url);
    if (section.type === "services") {
      for (const item of section.items) if (item.image) used.add(item.image.url);
    }
  }

  const sections = spec.sections.slice();
  const chosen: SiteImage[] = [];
  picked.forEach((target, i) => {
    const image = (found[i] ?? []).find((candidate) => !used.has(candidate.url));
    const section = sections[target.section];
    if (!image || section?.type !== "services") return;
    used.add(image.url);
    chosen.push(image);
    const items = section.items.slice();
    const item = items[target.item];
    if (!item) return;
    items[target.item] = { ...item, image };
    sections[target.section] = { ...section, items };
  });
  if (chosen.length === 0) return spec;
  await Promise.all(chosen.map((image) => trackImageChosen(image, options)));
  return { ...spec, sections };
}

/**
 * Todas as fotos que a plataforma busca para o site (topo + serviços), em paralelo. Nunca
 * lança erro. Com `previous` (edição), só busca o que mudou (ver as duas funções acima).
 */
export async function resolveSiteImages(
  spec: SiteSpec,
  options: ProviderOptions & { previous?: SiteSpec } = {},
): Promise<SiteSpec> {
  const [withHero, withServices] = await Promise.all([
    resolveHeroImage(spec, options),
    resolveServiceImages(spec, options),
  ]);
  if (withServices === spec) return withHero;
  if (withHero === spec) return withServices;
  // As duas só trocam elementos da lista (mesmos índices): o topo de uma, os serviços da outra.
  return {
    ...withHero,
    sections: withHero.sections.map((section, i) =>
      section.type === "services" ? (withServices.sections[i] ?? section) : section,
    ),
  };
}
