import { z } from "zod";
import type { PlaceBusiness } from "./types";

// Cliente do Google Places API (New): Text Search ("plumber in Austin, TX") e Place Details
// (para renovar o cache de 30 dias, ver service.ts). Sem SDK: fetch puro.
// Só com GOOGLE_MAPS_API_KEY (pago). Sem ela, a fonte é o OpenStreetMap (osm.ts, grátis); nos
// testes, o cliente de mentira (mock.ts). Quem escolhe: getPlacesClient (service.ts).

export const TEXT_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";
export const PLACE_DETAILS_URL = "https://places.googleapis.com/v1/places";

/** Campos pedidos ao Places. Cada campo pesa no preço (SKU): só o que a tela usa. */
const PLACE_FIELDS = [
  "id",
  "displayName",
  "formattedAddress",
  "addressComponents",
  "nationalPhoneNumber",
  "websiteUri",
  "rating",
  "userRatingCount",
  "primaryTypeDisplayName",
  "regularOpeningHours",
] as const;

export const SEARCH_FIELD_MASK = [
  ...PLACE_FIELDS.map((field) => `places.${field}`),
  "nextPageToken",
].join(",");
export const DETAILS_FIELD_MASK = PLACE_FIELDS.join(",");

/** 20 por página, até 3 páginas: o máximo que o Text Search devolve (60). */
export const PAGE_SIZE = 20;
export const MAX_PAGES = 3;
const TIMEOUT_MS = 10_000;

export class PlacesError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "PlacesError";
  }
}

export type PlacesSource = "google" | "osm" | "mock";

export interface PlacesClient {
  readonly mock: boolean;
  readonly source: PlacesSource;
  /** Empresas para "<trade> in <city>, <state>" (até 60). */
  searchText(textQuery: string): Promise<PlaceBusiness[]>;
  /** Dados atuais de uma empresa pelo place_id. `null` se o Places não a conhece mais. */
  getPlace(placeId: string): Promise<PlaceBusiness | null>;
}

const LocalizedText = z.object({ text: z.string() }).partial();

const PlaceJson = z.object({
  id: z.string(),
  displayName: LocalizedText.nullish(),
  formattedAddress: z.string().nullish(),
  addressComponents: z
    .array(
      z.object({
        longText: z.string().nullish(),
        shortText: z.string().nullish(),
        types: z.array(z.string()).nullish(),
      }),
    )
    .nullish(),
  nationalPhoneNumber: z.string().nullish(),
  websiteUri: z.string().nullish(),
  rating: z.number().nullish(),
  userRatingCount: z.number().nullish(),
  primaryTypeDisplayName: LocalizedText.nullish(),
  regularOpeningHours: z
    .object({ weekdayDescriptions: z.array(z.string()).nullish() })
    .partial()
    .nullish(),
});
type PlaceJson = z.infer<typeof PlaceJson>;

const SearchJson = z.object({
  places: z.array(z.unknown()).nullish(),
  nextPageToken: z.string().nullish(),
});

/** "plumber in Austin, TX" (o mesmo texto vai para a coluna `search`). */
export function textQueryFor(trade: string, city: string, state: string): string {
  return `${trade.trim()} in ${city.trim()}, ${state.trim().toUpperCase()}`;
}

function component(place: PlaceJson, type: string, short = false): string | null {
  const match = place.addressComponents?.find((part) => part.types?.includes(type));
  const value = short ? match?.shortText : match?.longText;
  return value?.trim() || null;
}

/** JSON do Places → nosso formato. Lugar sem nome é descartado (`null`). */
export function toPlaceBusiness(raw: unknown): PlaceBusiness | null {
  const parsed = PlaceJson.safeParse(raw);
  if (!parsed.success) return null;
  const place = parsed.data;
  const name = place.displayName?.text?.trim();
  if (!name) return null;
  return {
    placeId: place.id,
    name,
    category: place.primaryTypeDisplayName?.text?.trim() || null,
    address: place.formattedAddress?.trim() || null,
    city:
      component(place, "locality") ??
      component(place, "sublocality") ??
      component(place, "postal_town") ??
      component(place, "administrative_area_level_3"),
    state: component(place, "administrative_area_level_1", true),
    phone: place.nationalPhoneNumber?.trim() || null,
    website: place.websiteUri?.trim() || null,
    rating: place.rating ?? null,
    reviewCount: place.userRatingCount ?? null,
    hours: (place.regularOpeningHours?.weekdayDescriptions ?? []).filter(Boolean).slice(0, 7),
  };
}

/** Mensagem de erro do Google ({ error: { message } }) sem vazar a chave. */
async function googleError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: { message?: unknown } };
    if (typeof body.error?.message === "string") return body.error.message.slice(0, 300);
  } catch {
    // corpo que não é JSON
  }
  return `HTTP ${res.status}`;
}

export class GooglePlacesClient implements PlacesClient {
  readonly mock = false;
  readonly source = "google" as const;

  constructor(
    private readonly apiKey: string,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  private async post(body: Record<string, unknown>): Promise<z.infer<typeof SearchJson>> {
    let res: Response;
    try {
      res = await this.fetchImpl(TEXT_SEARCH_URL, {
        method: "POST",
        cache: "no-store",
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": this.apiKey,
          "X-Goog-FieldMask": SEARCH_FIELD_MASK,
        },
        body: JSON.stringify(body),
      });
    } catch (error) {
      throw new PlacesError(
        error instanceof Error && error.name === "TimeoutError"
          ? "Google Places took too long to answer."
          : "Could not reach Google Places.",
      );
    }
    if (!res.ok) {
      throw new PlacesError(`Google Places error: ${await googleError(res)}`, res.status);
    }
    const parsed = SearchJson.safeParse(await res.json().catch(() => null));
    if (!parsed.success) throw new PlacesError("Google Places sent an unexpected answer.");
    return parsed.data;
  }

  async searchText(textQuery: string): Promise<PlaceBusiness[]> {
    const results: PlaceBusiness[] = [];
    const seen = new Set<string>();
    let pageToken: string | undefined;
    for (let page = 0; page < MAX_PAGES; page++) {
      const data = await this.post({
        textQuery,
        pageSize: PAGE_SIZE,
        ...(pageToken ? { pageToken } : {}),
      });
      for (const raw of data.places ?? []) {
        const business = toPlaceBusiness(raw);
        if (business && !seen.has(business.placeId)) {
          seen.add(business.placeId);
          results.push(business);
        }
      }
      pageToken = data.nextPageToken ?? undefined;
      if (!pageToken) break;
    }
    return results;
  }

  async getPlace(placeId: string): Promise<PlaceBusiness | null> {
    // place_id do Google: letras, números, "-" e "_" (nada de montar URL com lixo).
    if (!/^[A-Za-z0-9_-]{6,300}$/.test(placeId)) return null;
    let res: Response;
    try {
      res = await this.fetchImpl(`${PLACE_DETAILS_URL}/${placeId}`, {
        cache: "no-store",
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: { "X-Goog-Api-Key": this.apiKey, "X-Goog-FieldMask": DETAILS_FIELD_MASK },
      });
    } catch {
      throw new PlacesError("Could not reach Google Places.");
    }
    if (res.status === 404) return null;
    if (!res.ok) {
      throw new PlacesError(`Google Places error: ${await googleError(res)}`, res.status);
    }
    return toPlaceBusiness(await res.json().catch(() => null));
  }
}
