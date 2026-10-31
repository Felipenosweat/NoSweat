import { randomBytes } from "node:crypto";
import type { ProspectView } from "@/lib/prospects";
import { generateSiteSpec, getSiteGenerator } from "../ai";
import type { CurrentUser } from "../auth/session";
import { fitDesignToPhoto } from "../design";
import { hasImageProvider, resolveHeroImage } from "../images";
import { refundUse, reserveUse } from "../quota";
import { getSiteStore } from "../store";
import { buildPreviewBrief, tradeFromSearch } from "./brief";
import { MockPlacesClient, mockWebsiteFetch } from "./mock";
import { citiesByPopulation } from "../places";
import { ANY_TRADE, OverpassClient } from "./osm";
import { GooglePlacesClient, textQueryFor, type PlacesClient, type PlacesSource } from "./places";
import { getProspectStore } from "./store";
import type { PlaceBusiness, ProspectRecord, ProspectUpsert } from "./types";
import { checkWebsite } from "./website";

// Regras da prospecção (/admin/prospects). Só o admin chega aqui.
//
// Fontes das empresas (getPlacesClient):
// - GOOGLE_MAPS_API_KEY definida → Google Places (pago, mais completo, com nota e avaliações);
// - sem ela → OpenStreetMap pela Overpass API (grátis, ODbL, cobertura menor; ver osm.ts);
// - PROSPECTS_SOURCE=mock → empresas de mentira (testes e dev sem internet).
//
// Dados do Google Places (termos do Google): o place_id pode ser guardado sem prazo; o resto do
// que veio do Places (nome, endereço, telefone, site, nota, horário) é um cache de no máximo 30
// dias. `last_fetched_at` marca quando veio, e antes de USAR um prospect (criar a prévia,
// exportar a lista) o que passou de 30 dias é buscado de novo no Places (`ensureFresh`). Se o
// Places não conhece mais a empresa, ela vira "do_not_contact" (não dá para confirmar os dados).
// Linhas do OSM ("osm:node/123") não têm esse prazo (a licença ODbL permite guardar, com
// atribuição). E-mail e website_* vêm do site da própria empresa (ou do e-mail listado no OSM).

export const PLACES_MAX_AGE_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;
/** Sites conferidos ao mesmo tempo numa busca (cada um até ~6 s). */
const CHECK_CONCURRENCY = 6;

/** Fonte das buscas: Google (com chave), mock (PROSPECTS_SOURCE=mock) ou OpenStreetMap. */
export function getPlacesClient(): PlacesClient {
  const key = process.env.GOOGLE_MAPS_API_KEY?.trim();
  if (key) return new GooglePlacesClient(key);
  if (process.env.PROSPECTS_SOURCE === "mock") return new MockPlacesClient();
  return new OverpassClient();
}

/** De onde veio um place_id. */
export function placeSource(placeId: string): PlacesSource {
  if (placeId.startsWith("osm:")) return "osm";
  if (placeId.startsWith("mock_")) return "mock";
  return "google";
}

/** fetch usado na conferência dos sites: o de mentira junto com a fonte de mentira. */
function websiteFetch(client: PlacesClient): typeof fetch {
  return client.mock ? mockWebsiteFetch : fetch;
}

/** Roda `task` em cada item com no máximo `limit` ao mesmo tempo, mantendo a ordem. */
async function mapLimit<T, R>(
  items: T[],
  limit: number,
  task: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await task(items[index]!);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

export type SearchResult = {
  query: string;
  found: number;
  added: number;
  updated: number;
  source: PlacesSource;
  mock: boolean;
};

/** Cidades que o "Find leads" sorteia: as com 50 mil moradores ou mais (~900 nos EUA). */
const AUTO_CITY_MIN_POPULATION = 50_000;
/** O sorteio é entre as N maiores ainda não buscadas: começa pelas grandes, sem repetir sempre a mesma. */
const AUTO_CITY_POOL = 40;

/** "... in Austin, TX" → "austin, tx" (para saber quais cidades já foram buscadas). */
function searchedCity(search: string | null): string | null {
  const match = /\s+in\s+(.+?),\s*([A-Za-z]{2})$/i.exec(search ?? "");
  return match ? `${match[1]!.trim().toLowerCase()}, ${match[2]!.toLowerCase()}` : null;
}

/** Escolhe uma cidade dos EUA que ainda não foi buscada (sorteio entre as maiores que faltam). */
export async function pickAutoCity(
  random: () => number = Math.random,
): Promise<{ city: string; state: string }> {
  const prospects = await getProspectStore().list();
  const done = new Set(prospects.map((p) => searchedCity(p.search)).filter(Boolean));
  const cities = citiesByPopulation(AUTO_CITY_MIN_POPULATION);
  const left = cities.filter((c) => !done.has(`${c.name.toLowerCase()}, ${c.state.toLowerCase()}`));
  const pool = (left.length ? left : cities).slice(0, AUTO_CITY_POOL);
  const pick = pool[Math.floor(random() * pool.length)] ?? cities[0]!;
  return { city: pick.name, state: pick.state };
}

/**
 * Busca na fonte, confere os sites e grava (sem mexer no status dos que já existiam).
 * Tudo opcional: sem ramo = qualquer empresa sem site; sem cidade = uma cidade dos EUA sorteada.
 */
export async function searchProspects(
  input: { trade?: string | undefined; city?: string | undefined; state?: string | undefined },
  client: PlacesClient = getPlacesClient(),
): Promise<SearchResult> {
  const where =
    input.city && input.state ? { city: input.city, state: input.state } : await pickAutoCity();
  const query = textQueryFor(input.trade?.trim() || ANY_TRADE, where.city, where.state);
  const businesses = await client.searchText(query);
  const fetchImpl = websiteFetch(client);
  const now = new Date().toISOString();
  const rows = await mapLimit(
    businesses,
    CHECK_CONCURRENCY,
    async (business): Promise<ProspectUpsert> => {
      const check = await checkWebsite(business.website, fetchImpl);
      return {
        ...business,
        websiteStatus: check.status,
        websiteNotes: check.notes,
        // Primeiro o e-mail do próprio site; senão o que a fonte lista (OSM).
        email: check.email ?? business.email ?? null,
        search: query,
        lastFetchedAt: now,
      };
    },
  );
  const { added, updated } = await getProspectStore().upsertMany(rows);
  return {
    query,
    found: businesses.length,
    added,
    updated,
    source: client.source,
    mock: client.mock,
  };
}

/** Dados do Google com mais de 30 dias (OSM nunca vence). */
export function isStale(
  prospect: Pick<ProspectRecord, "lastFetchedAt" | "placeId">,
  now = Date.now(),
): boolean {
  if (placeSource(prospect.placeId) === "osm") return false;
  if (!prospect.lastFetchedAt) return true;
  return now - Date.parse(prospect.lastFetchedAt) > PLACES_MAX_AGE_DAYS * DAY_MS;
}

/** Quem renova um place_id: o mock renova os dele; o Google só com a chave. */
function refreshClientFor(placeId: string): PlacesClient | null {
  if (placeSource(placeId) === "mock") return new MockPlacesClient();
  const key = process.env.GOOGLE_MAPS_API_KEY?.trim();
  return key ? new GooglePlacesClient(key) : null;
}

function placeFields(place: PlaceBusiness) {
  return {
    name: place.name,
    category: place.category,
    address: place.address,
    city: place.city,
    state: place.state,
    phone: place.phone,
    website: place.website,
    hours: place.hours,
    rating: place.rating,
    reviewCount: place.reviewCount,
  };
}

/**
 * Renova no Places os prospects com dados de mais de 30 dias (ver o topo do arquivo). Devolve a
 * lista na mesma ordem, já atualizada. Erro do Places num item: segue com o que tem e avisa no log.
 */
export async function ensureFresh(
  prospects: ProspectRecord[],
  client?: PlacesClient,
): Promise<ProspectRecord[]> {
  const stale = prospects.filter((prospect) => isStale(prospect));
  if (stale.length === 0) return prospects;
  const store = getProspectStore();
  const fresh = new Map<string, ProspectRecord>();
  await mapLimit(stale, 5, async (prospect) => {
    const places = client ?? refreshClientFor(prospect.placeId);
    if (!places) {
      console.error("[prospects] GOOGLE_MAPS_API_KEY missing: cannot refresh", prospect.placeId);
      return;
    }
    try {
      const place = await places.getPlace(prospect.placeId);
      const now = new Date().toISOString();
      const updated = place
        ? await store.update(prospect.id, { ...placeFields(place), lastFetchedAt: now })
        : await store.update(prospect.id, { status: "do_not_contact", lastFetchedAt: now });
      if (updated) fresh.set(updated.id, updated);
    } catch (error) {
      console.error("[prospects] could not refresh place", prospect.placeId, error);
    }
  });
  return prospects.map((prospect) => fresh.get(prospect.id) ?? prospect);
}

/** Link da prévia: 24 bytes aleatórios (192 bits) em base64url, impossível de adivinhar. */
export function newPreviewToken(): string {
  return randomBytes(24).toString("base64url");
}

export class ProspectError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

/**
 * Cria o site de prévia de um prospect: rascunho do admin, gerado pelo mesmo caminho do
 * POST /api/sites/generate (design → IA → SiteSpec.parse → foto do topo) a partir SÓ dos fatos do
 * Places. Conta como uma geração do admin no ai_usage (custo do /admin). Já tem prévia: devolve
 * como está (não gasta IA de novo).
 */
export async function createPreview(admin: CurrentUser, id: string): Promise<ProspectRecord> {
  const store = getProspectStore();
  const current = await store.get(id);
  if (!current) throw new ProspectError(404, "not_found", "Prospect not found.");
  if (current.status === "do_not_contact") {
    throw new ProspectError(409, "conflict", `${current.name} is marked do not contact.`);
  }
  if (current.siteId && current.previewToken) {
    const site = await getSiteStore().get(current.siteId);
    if (site) return current;
  }

  const [prospect] = await ensureFresh([current]);
  if (!prospect || prospect.status === "do_not_contact") {
    throw new ProspectError(409, "conflict", `${current.name} is no longer listed on Google.`);
  }

  const generator = getSiteGenerator();
  const actor = { kind: "user" as const, user: admin };
  const overLimit = await reserveUse(actor, "generate");
  if (overLimit) throw new ProspectError(429, "quota_exceeded", "AI limit reached. Try later.");

  const brief = buildPreviewBrief({ ...prospect, trade: tradeFromSearch(prospect.search) });
  let spec;
  try {
    spec = await generateSiteSpec(brief, generator, { photos: hasImageProvider() });
  } catch (error) {
    console.error("[prospects] preview generation failed", error);
    await refundUse(actor, "generate");
    throw new ProspectError(
      502,
      "generation_failed",
      `Couldn't create the preview for ${prospect.name}.`,
    );
  }
  spec = fitDesignToPhoto(await resolveHeroImage(spec));
  const site = await getSiteStore().create(spec, admin.id);

  const updated = await store.update(prospect.id, {
    siteId: site.id,
    previewToken: prospect.previewToken ?? newPreviewToken(),
    // Prévia nova não "desfaz" um contato que já aconteceu.
    status: prospect.status === "new" ? "preview_ready" : prospect.status,
  });
  if (!updated) throw new ProspectError(404, "not_found", "Prospect not found.");
  return updated;
}

/**
 * Muda o status de vários prospects. "Do not contact" é definitivo para os atalhos em massa:
 * marcar como contatado (ou qualquer outro status) pula quem pediu para não ser contatado; só
 * "new" tira alguém de lá (decisão explícita do admin).
 */
export async function setProspectStatus(
  ids: string[],
  status: ProspectRecord["status"],
): Promise<number> {
  const store = getProspectStore();
  let count = 0;
  for (const id of new Set(ids)) {
    const prospect = await store.get(id);
    if (!prospect) continue;
    if (prospect.status === "do_not_contact" && status !== "new" && status !== "do_not_contact") {
      continue;
    }
    if (prospect.status === status) continue;
    if (await store.update(id, { status })) count++;
  }
  return count;
}

export function previewPath(
  prospect: Pick<ProspectRecord, "previewToken" | "siteId">,
): string | null {
  return prospect.previewToken && prospect.siteId ? `/p/${prospect.previewToken}` : null;
}

export function toView(prospect: ProspectRecord): ProspectView {
  return {
    id: prospect.id,
    name: prospect.name,
    category: prospect.category,
    city: prospect.city,
    state: prospect.state,
    phone: prospect.phone,
    website: prospect.website,
    websiteStatus: prospect.websiteStatus,
    websiteNotes: prospect.websiteNotes,
    email: prospect.email,
    rating: prospect.rating,
    reviewCount: prospect.reviewCount,
    status: prospect.status,
    siteId: prospect.siteId,
    previewPath: previewPath(prospect),
  };
}

/** Prospect da prévia pública (/p/<token>) e o rascunho dele. `null` = 404. */
export async function getPublicPreview(token: string) {
  if (!/^[A-Za-z0-9_-]{16,128}$/.test(token)) return null;
  const prospect = await getProspectStore().getByToken(token);
  // Quem pediu para não ser contatado também não tem mais a prévia no ar.
  if (!prospect?.siteId || prospect.status === "do_not_contact") return null;
  const site = await getSiteStore().get(prospect.siteId);
  return site ? { prospect, site } : null;
}
