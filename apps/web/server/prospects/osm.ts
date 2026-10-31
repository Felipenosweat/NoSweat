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

/**
 * Servidores públicos do Overpass, em ordem. z. e lz4. são as duas máquinas por trás do
 * overpass-api.de (o endereço principal às vezes responde 502 do balanceador, em produção);
 * cheio ou fora (429, 5xx, rede, demora) → a mesma consulta vai para o próximo.
 */
export const OVERPASS_URLS = [
  "https://z.overpass-api.de/api/interpreter",
  "https://lz4.overpass-api.de/api/interpreter",
  "https://overpass-api.de/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];
export const OVERPASS_URL = OVERPASS_URLS[0]!;
export const OSM_USER_AGENT = "NoSweatBot/1.0 (+https://www.nosweatfd.com; prospecting)";
/** Raio em volta do centro da cidade. */
export const OSM_RADIUS_METERS = 15_000;
const QUERY_TIMEOUT_S = 20;
const MAX_RESULTS = 80;
const CACHE_MS = 60 * 60 * 1000;

/**
 * Filtros do Overpass por ramo. Cada item vira um `nwr[...]` dentro do raio.
 * `any`: qualquer ramo (a categoria de cada empresa sai das tags dela) e só quem NÃO tem site.
 */
type Trade = {
  label: string;
  filters: string[];
  any?: boolean;
  radius?: number;
  /** Filtro feito aqui, depois da resposta (o que é caro de pedir ao Overpass). */
  keep?: (tags: Record<string, string>) => boolean;
};

/** O ramo da busca "qualquer empresa" (botão "Find leads" sem nada digitado). */
export const ANY_TRADE = "local businesses";
const ANY_MATCH = /^(any|all|any business(es)?|all business(es)?|local business(es)?|businesses)$/;

// Qualquer empresa pequena SEM site e COM telefone (dá para ligar ou mandar a prévia), fora redes
// (tag brand). A consulta é a mais barata possível para o servidor (empresas com telefone e sem
// site dentro de um retângulo, 2 linhas); o tipo de negócio é conferido aqui (keepAnyBusiness):
// governo, igreja, escola, banco, posto, supermercado... ficam de fora.
const NO_SITE = '[!"website"][!"contact:website"][!"url"][!"brand"]';
const ANY_TRADE_FILTERS = [`["phone"]${NO_SITE}`, `["contact:phone"]${NO_SITE}`];

const SKIP_SHOP =
  /^(vacant|yes|no|kiosk|mall|department_store|supermarket|convenience|gas|fuel|ticket|lottery|e-cigarette|tobacco|alcohol)$/;
const SKIP_OFFICE =
  /^(government|ngo|association|religion|political_party|diplomatic|educational_institution|union|yes|company)$/;
const SKIP_HEALTHCARE = /^(hospital|centre|blood_donation|laboratory)$/;
const AMENITY =
  /^(restaurant|cafe|fast_food|bar|pub|ice_cream|dentist|veterinary|clinic|doctors|car_wash|car_rental|childcare|driving_school|beauty|spa)$/;
const LEISURE = /^(fitness_centre|sports_centre|dance)$/;

/** Na busca "qualquer empresa": é um negócio local que pode comprar um site? */
export function keepAnyBusiness(tags: Record<string, string>): boolean {
  if (tags.shop) return !SKIP_SHOP.test(tags.shop);
  if (tags.craft) return tags.craft !== "yes";
  if (tags.healthcare) return !SKIP_HEALTHCARE.test(tags.healthcare);
  if (tags.amenity) return AMENITY.test(tags.amenity);
  if (tags.office) return !SKIP_OFFICE.test(tags.office);
  if (tags.leisure) return LEISURE.test(tags.leisure);
  return false;
}

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
  {
    match: /dentist|dental/,
    trade: { label: "Dentist", filters: ['["amenity"="dentist"]', '["healthcare"="dentist"]'] },
  },
  {
    match: /\bvet|veterinar|animal hospital/,
    trade: { label: "Veterinarian", filters: ['["amenity"="veterinary"]'] },
  },
  {
    match: /chiropract/,
    trade: {
      label: "Chiropractor",
      filters: ['["healthcare"="chiropractor"]', '["healthcare:speciality"~"chiropractic"]'],
    },
  },
  {
    match: /gym|fitness|crossfit|yoga|pilates/,
    trade: {
      label: "Gym / fitness",
      filters: ['["leisure"="fitness_centre"]', '["sport"~"yoga|pilates|crossfit"]'],
    },
  },
  { match: /tattoo/, trade: { label: "Tattoo studio", filters: ['["shop"="tattoo"]'] } },
  { match: /florist|flower/, trade: { label: "Florist", filters: ['["shop"="florist"]'] } },
  {
    match: /pet|groom/,
    trade: { label: "Pet grooming", filters: ['["shop"="pet_grooming"]', '["shop"="pet"]'] },
  },
  {
    match: /spa|massage|beauty|esthetic|lash|brow/,
    trade: {
      label: "Beauty / spa",
      filters: ['["shop"="beauty"]', '["shop"="massage"]', '["amenity"="spa"]'],
    },
  },
  {
    match: /lawyer|attorney|law firm|legal/,
    trade: { label: "Lawyer", filters: ['["office"="lawyer"]'] },
  },
  {
    match: /account|cpa|bookkeep|tax/,
    trade: {
      label: "Accountant",
      filters: ['["office"="accountant"]', '["office"="tax_advisor"]'],
    },
  },
  { match: /insurance/, trade: { label: "Insurance agent", filters: ['["office"="insurance"]'] } },
  {
    match: /real estate|realtor|realty/,
    trade: { label: "Real estate", filters: ['["office"="estate_agent"]'] },
  },
  {
    match: /locksmith/,
    trade: { label: "Locksmith", filters: ['["craft"="locksmith"]', '["shop"="locksmith"]'] },
  },
  {
    match: /carpent|cabinet|woodwork/,
    trade: { label: "Carpenter", filters: ['["craft"="carpenter"]', '["craft"="cabinet_maker"]'] },
  },
  {
    match: /floor|tile|carpet/,
    trade: {
      label: "Flooring",
      filters: [
        '["craft"="floorer"]',
        '["craft"="tiler"]',
        '["shop"="flooring"]',
        '["shop"="carpet"]',
      ],
    },
  },
  {
    match: /photograph/,
    trade: { label: "Photographer", filters: ['["craft"="photographer"]', '["shop"="photo"]'] },
  },
  {
    match: /tailor|alteration|seamstress/,
    trade: { label: "Tailor", filters: ['["craft"="tailor"]', '["shop"="tailor"]'] },
  },
  { match: /tire|tyre/, trade: { label: "Tire shop", filters: ['["shop"="tyres"]'] } },
  {
    match: /car wash|detail/,
    trade: { label: "Car wash / detailing", filters: ['["amenity"="car_wash"]'] },
  },
  {
    match: /daycare|child ?care|preschool/,
    trade: {
      label: "Childcare",
      filters: ['["amenity"="childcare"]', '["amenity"="kindergarten"]'],
    },
  },
  {
    match: /bar\b|pub|brewery/,
    trade: {
      label: "Bar",
      filters: ['["amenity"="bar"]', '["amenity"="pub"]', '["craft"="brewery"]'],
    },
  },
  {
    match: /food truck|taco|pizza|burger|fast food/,
    trade: { label: "Fast food", filters: ['["amenity"="fast_food"]'] },
  },
];

export const OSM_SUPPORTED_TRADES = TRADES.map(({ trade }) => trade.label.toLowerCase());

/** Ramo digitado → filtros. Vazio ou "any" = qualquer empresa sem site; desconhecido = pelo nome. */
export function tradeFilters(trade: string): Trade | null {
  const text = trade.trim().toLowerCase();
  if (!text || ANY_MATCH.test(text)) {
    // Raio menor: numa cidade grande, "todas as lojas em 15 km" estoura o tempo do Overpass.
    return {
      label: "Local business",
      filters: ANY_TRADE_FILTERS,
      any: true,
      radius: 6_000,
      keep: keepAnyBusiness,
    };
  }
  const known = TRADES.find(({ match }) => match.test(text))?.trade;
  if (known) return known;
  // Ramo que não tem tag certa no OSM: empresas com a palavra no nome ("pool" → "Blue Pool Care").
  const word = text
    .replace(/[^a-z0-9 ]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
  if (word.length < 3) return null;
  const name = `["name"~"${word}",i]`;
  return {
    label: word.replace(/\b\w/g, (c) => c.toUpperCase()),
    filters: ['["shop"]', '["craft"]', '["office"]', '["amenity"]', '["healthcare"]'].map(
      (kind) => `${kind}${name}`,
    ),
  };
}

const humanize = (value: string) =>
  value
    .replace(/[_;]+/g, " ")
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase());

/** Categoria de uma empresa pelas tags ("shop=hairdresser" → "Hairdresser"). */
export function categoryFromTags(tags: Record<string, string>): string | null {
  for (const key of ["craft", "healthcare", "shop", "amenity", "office", "leisure"]) {
    const value = tags[key];
    if (!value || value === "yes") continue;
    if (key === "office" && value === "company") continue;
    return humanize(value.split(";")[0]!);
  }
  return null;
}

/** Retângulo em volta do centro (s,w,n,e), com `meters` para cada lado. */
export function boundingBox(lat: number, lon: number, meters: number): string {
  const dLat = meters / 111_320;
  const dLon = meters / (111_320 * Math.cos((lat * Math.PI) / 180));
  const f = (n: number) => n.toFixed(4);
  return [f(lat - dLat), f(lon - dLon), f(lat + dLat), f(lon + dLon)].join(",");
}

/**
 * Consulta Overpass QL: os filtros do ramo dentro de um retângulo em volta do centro da cidade.
 * Retângulo global ([bbox:...]) em vez de "around": o servidor usa o índice de área e responde
 * bem mais rápido. Na busca "qualquer empresa" vêm mais linhas, porque parte sai no keep().
 */
export function buildOverpassQuery(trade: Trade, lat: number, lon: number): string {
  const bbox = boundingBox(lat, lon, trade.radius ?? OSM_RADIUS_METERS);
  const parts = trade.filters.map((filter) => `  nw${filter}["name"];`);
  const limit = trade.keep ? MAX_RESULTS * 4 : MAX_RESULTS;
  return `[out:json][timeout:${QUERY_TIMEOUT_S}][bbox:${bbox}];\n(\n${parts.join("\n")}\n);\nout center tags ${limit};`;
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
  context: { label: string; city: string; state: string; any?: boolean },
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
    // Busca de qualquer ramo: a categoria é a da própria empresa.
    category: (context.any ? categoryFromTags(tags) : null) ?? context.label,
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
        `OpenStreetMap can't search “${parts.trade}”. Try: ${OSM_SUPPORTED_TRADES.slice(0, 12).join(", ")}…`,
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

    const res = await this.fetchFirstAnswer(query);
    const parsed = OverpassJson.safeParse(await res.json().catch(() => null));
    if (!parsed.success) throw new PlacesError("OpenStreetMap sent an unexpected answer.");

    const context = { label: trade.label, city: place.name, state: place.state, any: trade.any };
    const seen = new Set<string>();
    const results: PlaceBusiness[] = [];
    for (const element of parsed.data.elements) {
      if (results.length >= MAX_RESULTS) break;
      if (trade.keep) {
        const tags = Element.safeParse(element).data?.tags ?? {};
        if (!trade.keep(tags)) continue;
      }
      const business = toBusiness(element, context);
      if (!business || seen.has(business.placeId)) continue;
      seen.add(business.placeId);
      results.push(business);
    }
    cache.set(query, { at: Date.now(), results });
    return results;
  }

  /**
   * Manda a consulta para o primeiro servidor; se ele estiver cheio ou fora (429, 5xx, rede,
   * demora), tenta o próximo. Erro de pedido (400) não adianta repetir.
   */
  private async fetchFirstAnswer(query: string): Promise<Response> {
    let last: PlacesError | null = null;
    for (const url of OVERPASS_URLS) {
      let res: Response;
      try {
        res = await this.fetchImpl(url, {
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
        last = new PlacesError(
          error instanceof Error && error.name === "TimeoutError"
            ? "OpenStreetMap took too long to answer. Try again in a minute."
            : "Could not reach OpenStreetMap.",
        );
        console.warn(`[prospects] ${url} failed: ${last.message}`);
        continue;
      }
      if (res.ok) return res;
      if (res.status === 400)
        throw new PlacesError("OpenStreetMap could not read the search.", 400);
      last =
        res.status === 429 || res.status === 504
          ? new PlacesError("OpenStreetMap is busy right now. Try again in a minute.", res.status)
          : new PlacesError(`OpenStreetMap error: HTTP ${res.status}`, res.status);
      console.warn(`[prospects] ${url} answered HTTP ${res.status}`);
    }
    throw last ?? new PlacesError("Could not reach OpenStreetMap.");
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
