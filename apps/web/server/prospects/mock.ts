import type { PlacesClient } from "./places";
import type { PlaceBusiness } from "./types";

// Fonte de mentira para os testes (e o dev offline, com PROSPECTS_SOURCE=mock): ~15 empresas claramente
// falsas para qualquer busca. Telefones 555-01xx (faixa reservada para ficção), sites em
// *.example.com (domínio reservado) e algumas sem site. O fetch de mentira (mockWebsiteFetch)
// responde pelos sites *.example.com, para a conferência de site rodar de verdade.

type MockSeed = {
  name: (trade: string, city: string) => string;
  /** "ok" | "weak-http" | "weak-viewport" | "parked" | "down" | "social" | null (sem site). */
  site: "ok" | "weak-http" | "weak-viewport" | "parked" | "down" | "social" | null;
  /** Site com e-mail público (no início ou só na página /contact). */
  email?: "home" | "contact";
  rating?: [number, number];
  hours?: boolean;
};

const SEEDS: MockSeed[] = [
  { name: (t, c) => `${c} ${t} Pros (Sample)`, site: null, rating: [4.8, 112], hours: true },
  { name: (t) => `Sample Family ${t}`, site: null, rating: [4.6, 37] },
  { name: (t) => `Lone Oak ${t} Co. (Sample)`, site: "weak-viewport", email: "home" },
  { name: (t) => `Test Street ${t}`, site: "ok", email: "contact", rating: [4.9, 210] },
  { name: (t) => `Example Brothers ${t}`, site: "weak-http", email: "home", hours: true },
  { name: (t) => `Fictional ${t} & Sons`, site: null, rating: [4.2, 9] },
  { name: (t, c) => `${c} Demo ${t}`, site: "parked" },
  { name: (t) => `Placeholder ${t} Services`, site: "ok", rating: [4.7, 58] },
  { name: (t) => `Mock Valley ${t}`, site: null, hours: true },
  { name: (t) => `Northside ${t} (Sample)`, site: "down", rating: [3.9, 14] },
  { name: (t) => `Dummy Creek ${t}`, site: "social", rating: [5, 6] },
  { name: (t) => `Sample & Co. ${t}`, site: "weak-viewport", email: "contact" },
  { name: (t) => `Pretend ${t} Experts`, site: null, rating: [4.5, 81], hours: true },
  { name: (t) => `Hypothetical ${t} LLC`, site: "ok", email: "home" },
  { name: (t) => `Imaginary ${t} Group`, site: null },
];

const HOURS = [
  "Monday: 8:00 AM – 5:00 PM",
  "Tuesday: 8:00 AM – 5:00 PM",
  "Wednesday: 8:00 AM – 5:00 PM",
  "Thursday: 8:00 AM – 5:00 PM",
  "Friday: 8:00 AM – 5:00 PM",
  "Saturday: 9:00 AM – 1:00 PM",
  "Sunday: Closed",
];

const titleCase = (text: string) =>
  text
    .trim()
    .split(/\s+/)
    .map((word) =>
      word.length <= 4 && word === word.toUpperCase()
        ? word
        : word[0]!.toUpperCase() + word.slice(1).toLowerCase(),
    )
    .join(" ");

const slug = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);

/** Tipo do site de mentira, guardado no próprio host: "<tipo>--<nome>.example.com". */
function siteUrl(kind: NonNullable<MockSeed["site"]>, name: string, email?: MockSeed["email"]) {
  if (kind === "social") return `https://www.facebook.com/${slug(name)}`;
  const tag = email ? `${kind}-${email}` : kind;
  const protocol = kind === "weak-http" ? "http" : "https";
  return `${protocol}://${tag}--${slug(name)}.example.com/`;
}

function parseQuery(textQuery: string): { trade: string; city: string; state: string } {
  const match = /^(.*?)\s+in\s+(.*?)(?:,\s*([A-Za-z]{2}))?$/i.exec(textQuery.trim());
  return {
    trade: match?.[1]?.trim() || "Business",
    city: match?.[2]?.trim() || "Springfield",
    state: (match?.[3] ?? "TX").toUpperCase(),
  };
}

export function mockBusinesses(textQuery: string): PlaceBusiness[] {
  const { trade, city, state } = parseQuery(textQuery);
  const tradeName = titleCase(trade);
  const cityName = titleCase(city);
  return SEEDS.map((seed, index) => {
    const name = seed.name(tradeName, cityName);
    const n = String(index + 1).padStart(2, "0");
    return {
      // O id guarda a busca (para o getPlace de mentira refazer a lista).
      placeId: `mock_${n}_${Buffer.from(textQuery.trim()).toString("base64url")}`,
      name,
      category: tradeName,
      address: `${100 + index * 7} Sample St, ${cityName}, ${state} 00000, USA`,
      city: cityName,
      state,
      phone: `(555) 555-01${n}`,
      website: seed.site ? siteUrl(seed.site, name, seed.email) : null,
      rating: seed.rating?.[0] ?? null,
      reviewCount: seed.rating?.[1] ?? null,
      hours: seed.hours ? [...HOURS] : [],
    };
  });
}

export class MockPlacesClient implements PlacesClient {
  readonly mock = true;
  readonly source = "mock" as const;

  async searchText(textQuery: string): Promise<PlaceBusiness[]> {
    return mockBusinesses(textQuery);
  }

  async getPlace(placeId: string): Promise<PlaceBusiness | null> {
    const match = /^mock_(\d{2})_([A-Za-z0-9_-]+)$/.exec(placeId);
    if (!match) return null;
    const textQuery = Buffer.from(match[2]!, "base64url").toString("utf8");
    const found = mockBusinesses(textQuery)[Number(match[1]) - 1];
    return found ? { ...found, placeId } : null;
  }
}

// ---------- Sites de mentira (*.example.com) ----------

const page = (body: string, { viewport = true, title = "Home" } = {}) =>
  `<!doctype html><html><head><title>${title}</title>${
    viewport ? '<meta name="viewport" content="width=device-width, initial-scale=1">' : ""
  }</head><body>${body}</body></html>`;

const filler =
  "<p>Family owned and serving the area. We handle repairs, installs and maintenance for homes and small businesses. Call us to schedule a visit or ask for a quote. We answer the phone ourselves and show up when we say we will.</p>".repeat(
    3,
  );

/**
 * fetch de mentira para os sites *.example.com do mock. Outros endereços: erro de rede (nos testes
 * e no dev nada sai para a internet por causa do mock).
 */
export const mockWebsiteFetch: typeof fetch = async (input) => {
  const url = new URL(typeof input === "string" ? input : input instanceof URL ? input : input.url);
  const match = /^([a-z-]+?)--([a-z0-9-]+)\.example\.com$/.exec(url.hostname);
  if (!match) throw new TypeError("fetch failed");
  const tag = match[1]!;
  const email = /-(home|contact)$/.exec(tag)?.[1];
  const kind = email ? tag.slice(0, -(email.length + 1)) : tag;
  const address = `office@${match[2]}.example.com`;
  const html = (body: string, options?: { viewport?: boolean }) =>
    new Response(page(body, options), { headers: { "content-type": "text/html; charset=utf-8" } });

  if (kind === "down") return new Response("Service Unavailable", { status: 503 });
  if (url.pathname.startsWith("/contact")) {
    return email === "contact"
      ? html(`<h1>Contact</h1><p>Email us: <a href="mailto:${address}">${address}</a></p>`)
      : new Response("Not found", { status: 404 });
  }
  const mail = email === "home" ? `<p>Questions? <a href="mailto:${address}">Email us</a></p>` : "";
  const contactLink = '<a href="/contact">Contact</a>';
  if (kind === "parked") {
    return html("<h1>This domain is parked</h1><p>Buy this domain today.</p>");
  }
  if (kind === "weak-viewport")
    return html(`<h1>Welcome</h1>${filler}${mail}${contactLink}`, { viewport: false });
  return html(`<h1>Welcome</h1>${filler}${mail}${contactLink}`);
};
