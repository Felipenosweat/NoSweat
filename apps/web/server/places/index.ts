import type { NearbyPlace, PlaceSuggestion } from "@nosweat/schema";
import data from "./us-places.json";

// Cidades e towns dos EUA para as sugestões do /create (cidade, estado e área atendida).
// Dados: U.S. Census Bureau (Gazetteer 2023 e estimativas de população 2023, domínio público) e
// população de lugares não incorporados do GeoNames (CC BY 4.0, crédito em /credits).
// Para regerar: server/places/scripts/build-places.py (instruções no topo do script).
// Só no servidor: o arquivo (~700 KB) nunca vai para o navegador.

type Row = [name: string, state: number, lat: number, lon: number, population: number];

type Place = {
  name: string;
  state: string;
  lat: number;
  lon: number;
  population: number;
  /** Nome sem acento e em minúsculas, para comparar. */
  key: string;
};

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

let cache: Place[] | null = null;

/** Carrega (uma vez) a lista, já em ordem de população (maior primeiro). */
function places(): Place[] {
  if (cache) return cache;
  const states = data.states;
  cache = (data.places as Row[]).map(([name, state, lat, lon, population]) => ({
    name,
    state: states[state] ?? "",
    lat: lat / 1000,
    lon: lon / 1000,
    population,
    key: normalize(name),
  }));
  return cache;
}

const toSuggestion = (p: Place): PlaceSuggestion => ({
  name: p.name,
  state: p.state,
  population: p.population,
});

/**
 * Cidades que combinam com o que a pessoa digitou. Aceita "worcester", "worc" e "worcester, ma"
 * (o estado no fim filtra). Sem texto e com estado: as maiores cidades do estado.
 * Ordem: nome exato, depois começo do nome, depois começo de outra palavra; dentro de cada
 * grupo, as mais populosas primeiro.
 */
export function searchPlaces(query: string, state?: string, limit = 8): PlaceSuggestion[] {
  let q = normalize(query);
  let st = state?.toUpperCase();
  const tail = /^(.*?)[ ,]+([a-z]{2})$/.exec(q);
  if (!st && tail && tail[1] && STATE_CODES.has(tail[2]!.toUpperCase())) {
    q = tail[1].trim();
    st = tail[2]!.toUpperCase();
  }
  const pool = st ? places().filter((p) => p.state === st) : places();
  if (!q) return pool.slice(0, limit).map(toSuggestion);

  const exact: Place[] = [];
  const prefix: Place[] = [];
  const word: Place[] = [];
  for (const p of pool) {
    if (p.key === q) exact.push(p);
    else if (p.key.startsWith(q)) prefix.push(p);
    else if (p.key.includes(` ${q}`)) word.push(p);
    if (exact.length + prefix.length >= limit * 4) break;
  }
  return [...exact, ...prefix, ...word].slice(0, limit).map(toSuggestion);
}

const EARTH_MILES = 3958.8;

function miles(a: Place, b: Place): number {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLon = (b.lon - a.lon) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_MILES * Math.asin(Math.sqrt(h));
}

/** A cidade pelo nome e estado (sem diferenciar acento e maiúsculas). */
export function findPlace(city: string, state: string): PlaceSuggestion | null {
  const key = normalize(city);
  const st = state.toUpperCase();
  const place = places().find((p) => p.state === st && p.key === key);
  return place ? toSuggestion(place) : null;
}

/** Centro aproximado da cidade (lat/lon do Census) e o nome oficial. `null` se não conhece. */
export function cityCoordinates(
  city: string,
  state: string,
): { name: string; state: string; lat: number; lon: number } | null {
  const key = normalize(city);
  const st = state.toUpperCase();
  const place = places().find((p) => p.state === st && p.key === key);
  return place ? { name: place.name, state: place.state, lat: place.lat, lon: place.lon } : null;
}

/**
 * Cidades vizinhas para a área atendida: dentro de `radiusMiles`, inclusive de estados ao lado,
 * com pelo menos 2.000 moradores (para não sugerir povoados), da mais perto para a mais longe.
 */
export function nearbyPlaces(
  city: string,
  state: string,
  { radiusMiles = 25, limit = 12 } = {},
): NearbyPlace[] {
  const key = normalize(city);
  const st = state.toUpperCase();
  const origin = places().find((p) => p.state === st && p.key === key);
  if (!origin) return [];
  return places()
    .filter((p) => p !== origin && p.population >= 2000)
    .map((p) => ({ p, d: miles(origin, p) }))
    .filter(({ d }) => d <= radiusMiles)
    .sort((a, b) => a.d - b.d)
    .slice(0, limit)
    .map(({ p, d }) => ({ ...toSuggestion(p), miles: Math.round(d) }));
}

const STATE_CODES = new Set(data.states);

/** Cidades com pelo menos `minPopulation` moradores, da maior para a menor (prospecção). */
export function citiesByPopulation(minPopulation: number): PlaceSuggestion[] {
  const out: PlaceSuggestion[] = [];
  for (const p of places()) {
    if (p.population < minPopulation) break;
    out.push(toSuggestion(p));
  }
  return out;
}
