import { z } from "zod";
import { cityCoordinates } from "../places";
import { PlacesError, type PlacesClient } from "./places";
import type { PlaceBusiness } from "./types";

// Fonte GRÁTIS de empresas: OpenStreetMap pela Overpass API (sem chave). É a fonte padrão quando
// não há GOOGLE_MAPS_API_KEY. Dados © OpenStreetMap contributors, licença ODbL: a atribuição
// aparece no /admin/prospects e no docs/prospecting.md.
// Boas maneiras com o servidor público: User-Agent nosso, UMA consulta por busca, timeout de 25 s
// e cache de 1 hora na memória para a mesma busca. A cobertura de pequenos negócios no OSM é
// incompleta: vêm menos empresas que no Google, e sem nota/avaliações.

export const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
export const OSM_USER_AGENT = "NoSweatBot/1.0 (+https://www.nosweatfd.com; prospecting)";
/** Raio em volta do centro da cidade. */
export const OSM_RADIUS_METERS = 15_000;
const QUERY_TIMEOUT_S = 25;
const MAX_RESULTS = 80;
const CACHE_MS = 60 * 60 * 1000;

/** Filtros do Overpass por ramo. Cada item vira um `nwr[...]` dentro do raio. */
type Trade = { label: string; filters: string[] };

const TRADES: { match: RegExp; trade: Trade }[] = [
  { match: /plumb/, trade: { label: "Plumber", filters: ['["craft"="plumber"]'] } },
  {
    match: /electric/,
    trade: { label: "Electrician", filters: ['["craft"="electrician"]'] },
  },
  { match: /paint/, trade: { label: "Painter", filters: ['["craft"="painter"]'] } },
  { match: /roof/, trade: { label: "Roofer", filters: ['["craft"="roofer"]'] } },
  {
    match: /\bhvac\b|heating|air ?condition|\bac\b/,
    trade: { label: "HVAC", filters: ['["craft"="hvac"]'] },
  },
  {
    match: /handy ?man/,
    trade: { label: "Handyman", filters: ['["craft"="handyman"]'] },
  },
  {
    match: /landscap|lawn|garden/,
    trade: {
      label: "Landscaping",
      filters: [
        '["craft"="gardener"]',
        '["craft"="landscaper"]',
        '["shop"="garden_centre"]["name"~"landscap",i]',
      ],
    },
  },
  {
    // "house cleaning": o OSM quase não tem; craft=cleaning existe e escritórios com "clean"/"maid"
    // no nome pegam o resto. Lavanderia (dry_cleaning) NÃO é limpeza de casas.
    match: /clean|maid|janitor/,
    trade: {
      label: "House cleaning",
      filters: ['["craft"="cleaning"]', '["office"]["name"~"clean|maid",i]'],
    },
  },
  {
    match: /auto|car repair|mechanic/,
    trade: { label: "Auto repair", filters: ['["shop"="car_repair"]'] },
  },
  {
    match: /barber|hair/,
    trade: { label: "Barber / hair salon", filters: ['["shop"="hairdresser"]'] },
  },
  {
    match: /nail/,
    trade: { label: "Nail salon", filters: ['["shop"="beauty"]["beauty"~"nails"]'] },
  },
  {
    match: /restaurant|diner/,
    trade: { label: "Restaurant", filters: ['["amenity"="restaurant"]'] },
  },
  { match: /bakery|bakeries/, trade: { label: "Bakery", filters: ['["shop"="bakery"]'] } },
  { match: /cafe|café|coffee/, trade: { label: "Cafe", filters: ['["amenity"="cafe"]'] } },
];

export const OSM_SUPPORTED_TRADES = TRADES.map(({ trade }) => trade.label.toLowerCase());

export function tradeFilters(trade: string): Trade | null {
  const text = trade.trim().toLowerCase();
  return TRADES.find(({ match }) => match.test(text))?.trade ?? null;
}

/** Consulta Overpass QL: todos os filtros do ramo, num raio em volta do centro da cidade. */
export function buildOverpassQuery(trade: Trade, lat: number, lon: number): string {
  const around = `(around:${OSM_RADIUS_METERS},${lat},${lon})`;
  const parts = trade.filters.map((filter) => `  nwr${filter}["name"]${around};`);
  return `[out:json][timeout:${QUERY_TIMEOUT_S}];\n(\n${parts.join("\n")}\n);\nout center tags ${MAX_RESULTS};`;
}

const Element = z.object({
  type: z.enum(["node", "way", "relation"]),
  id: z.number(),
  tags: z.record(z.string(), z.string()).optional(),
});
const OverpassJson = z.object({ elements: z.array(z.unknown()) });

/** "+1 512-555-0100" / "5125550100" → "(512) 555-0100"; outro formato fica como veio. */
export function formatUsPhone(raw: string | undefined): string | null {
  const first = raw?.split(/[;,]/)[0]?.trim();
  if (!first) return null;
  const digits = first.replace(/\D/g, "");
  const ten = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  if (ten.length !== 10) return first;
  return `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}`;
}

function normalizeWebsite(raw: string | undefined): string | null {
  const value = raw?.split(";")[0]?.trim();
  if (!value) return null;
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

const STATE = /^[A-Za-z]{2}$/;

/** Elemento do OSM → nosso formato. Sem nome = descartado. */
export function toBusiness(
  raw: unknown,
  context: { label: string; city: string; state: string },
): (PlaceBusiness & { email: string | null }) | null {
  const parsed = Element.safeParse(raw);
  if (!parsed.success) return null;
  const tags = parsed.data.tags ?? {};
  const name = tags.name?.trim();
  if (!name) return null;
  const street = [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" ");
  const city = tags["addr:city"]?.trim() || null;
  const state = tags["addr:state"]?.trim();
  const address =
    [street, city, [state, tags["addr:postcode"]].filter(Boolean).join(" ")]
      .filter(Boolean)
      .join(", ") || null;
  const email = (tags.email ?? tags["contact:email"])?.split(";")[0]?.trim().toLowerCase() || null;
  return {
    placeId: `osm:${parsed.data.type}/${parsed.data.id}`,
    name,
    category: context.label,
    // Sem addr:city no OSM, a cidade é a da busca (a empresa está a até 15 km do centro dela).
    address: street ? address : null,
    city: city ?? context.city,
    state: state && STATE.test(state) ? state.toUpperCase() : context.state,
    phone: formatUsPhone(tags.phone ?? tags["contact:phone"]),
    website: normalizeWebsite(tags.website ?? tags["contact:website"] ?? tags.url),
    rating: null,
    reviewCount: null,
    hours: tags.opening_hours ? [tags.opening_hours.trim()] : [],
    email: email && /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/.test(email) ? email : null,
  };
}

/** "plumber in Austin, TX" → partes. */
function parseQuery(textQuery: string): { trade: string; city: string; state: string } | null {
  const match = /^(.*?)\s+in\s+(.+?),\s*([A-Za-z]{2})$/i.exec(textQuery.trim());
  if (!match) return null;
  return { trade: match[1]!, city: match[2]!, state: match[3]!.toUpperCase() };
}

const cache = new Map<string, { at: number; results: PlaceBusiness[] }>();

export class OverpassClient implements PlacesClient {
  readonly mock = false;
  readonly source = "osm" as const;

  constructor(private readonly fetchImpl: typeof fetch = fetch) {}

  async searchText(textQuery: string): Promise<PlaceBusiness[]> {
    const parts = parseQuery(textQuery);
    if (!parts) throw new PlacesError("Use “trade in City, ST”.", 400);
    const trade = tradeFilters(parts.trade);
    if (!trade) {
      throw new PlacesError(
        `OpenStreetMap can't search “${parts.trade}” yet. Try: ${OSM_SUPPORTED_TRADES.join(", ")}.`,
        400,
      );
    }
    const place = cityCoordinates(parts.city, parts.state);
    if (!place) {
      throw new PlacesError(
        `We don't know ${parts.city}, ${parts.state}. Pick a city from the list.`,
        400,
      );
    }
    const query = buildOverpassQuery(trade, place.lat, place.lon);
    const cached = cache.get(query);
    if (cached && Date.now() - cached.at < CACHE_MS) return cached.results.map((r) => ({ ...r }));

    let res: Response;
    try {
      res = await this.fetchImpl(OVERPASS_URL, {
        method: "POST",
        cache: "no-store",
        signal: AbortSignal.timeout((QUERY_TIMEOUT_S + 5) * 1000),
        headers: {
          "User-Agent": OSM_USER_AGENT,
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ data: query }).toString(),
      });
    } catch (error) {
      throw new PlacesError(
        error instanceof Error && error.name === "TimeoutError"
          ? "OpenStreetMap took too long to answer. Try again in a minute."
          : "Could not reach OpenStreetMap.",
      );
    }
    if (res.status === 429 || res.status === 504) {
      throw new PlacesError("OpenStreetMap is busy right now. Try again in a minute.", res.status);
    }
    if (!res.ok) throw new PlacesError(`OpenStreetMap error: HTTP ${res.status}`, res.status);
    const parsed = OverpassJson.safeParse(await res.json().catch(() => null));
    if (!parsed.success) throw new PlacesError("OpenStreetMap sent an unexpected answer.");

    const context = { label: trade.label, city: place.name, state: place.state };
    const seen = new Set<string>();
    const results: PlaceBusiness[] = [];
    for (const element of parsed.data.elements) {
      const business = toBusiness(element, context);
      if (!business || seen.has(business.placeId)) continue;
      seen.add(business.placeId);
      results.push(business);
    }
    cache.set(query, { at: Date.now(), results });
    return results;
  }

  /** O OSM não tem prazo de cache (licença ODbL): nada a renovar. */
  async getPlace(): Promise<PlaceBusiness | null> {
    return null;
  }
}

/** Só para testes. */
export function clearOverpassCache(): void {
  cache.clear();
}
