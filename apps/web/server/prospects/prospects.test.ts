import { beforeEach, describe, expect, it, vi } from "vitest";
import { NO_INVENTION_NOTE, buildPreviewBrief } from "./brief";
import { prospectsToCsv } from "./csv";
import { MockPlacesClient, mockBusinesses } from "./mock";
import {
  OVERPASS_URL,
  OSM_USER_AGENT,
  OverpassClient,
  buildOverpassQuery,
  clearOverpassCache,
  formatUsPhone,
  tradeFilters,
} from "./osm";
import { GooglePlacesClient, SEARCH_FIELD_MASK, TEXT_SEARCH_URL, toPlaceBusiness } from "./places";
import {
  createPreview,
  ensureFresh,
  getPlacesClient,
  getPublicPreview,
  searchProspects,
  setProspectStatus,
} from "./service";
import { MemoryProspectStore, getProspectStore } from "./store";
import type { ProspectRecord, ProspectUpsert } from "./types";
import { checkWebsite, classifyPage, extractEmails, isFetchableUrl, pickEmail } from "./website";

const ADMIN = { id: "local-dev", email: "dev@localhost" };

beforeEach(() => {
  new MemoryProspectStore().clear();
  clearOverpassCache();
});

// ---------- Google Places ----------

function googlePlace(id: string, extra: Record<string, unknown> = {}) {
  return {
    id,
    displayName: { text: `Biz ${id}`, languageCode: "en" },
    formattedAddress: "1 Main St, Austin, TX 78701, USA",
    addressComponents: [
      { longText: "Austin", shortText: "Austin", types: ["locality", "political"] },
      { longText: "Texas", shortText: "TX", types: ["administrative_area_level_1"] },
    ],
    nationalPhoneNumber: "(512) 555-0100",
    rating: 4.5,
    userRatingCount: 20,
    primaryTypeDisplayName: { text: "Plumber" },
    regularOpeningHours: { weekdayDescriptions: ["Monday: 8:00 AM – 5:00 PM"] },
    ...extra,
  };
}

describe("GooglePlacesClient", () => {
  it("sends the Text Search request with key, field mask and body, and follows 3 pages max", async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    const fetchImpl = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), init: init ?? {} });
      const page = calls.length;
      return Response.json({
        places: [googlePlace(`p${page}a`), googlePlace(`p${page}b`)],
        // A 4ª página nunca deve ser pedida.
        nextPageToken: `token-${page}`,
      });
    }) as unknown as typeof fetch;

    const client = new GooglePlacesClient("test-key", fetchImpl);
    const results = await client.searchText("plumber in Austin, TX");

    expect(calls).toHaveLength(3);
    expect(results).toHaveLength(6);
    const first = calls[0]!;
    expect(first.url).toBe(TEXT_SEARCH_URL);
    expect(first.init.method).toBe("POST");
    const headers = first.init.headers as Record<string, string>;
    expect(headers["X-Goog-Api-Key"]).toBe("test-key");
    expect(headers["X-Goog-FieldMask"]).toBe(SEARCH_FIELD_MASK);
    expect(SEARCH_FIELD_MASK).toContain("places.websiteUri");
    expect(SEARCH_FIELD_MASK).toContain("nextPageToken");
    expect(JSON.parse(String(first.init.body))).toEqual({
      textQuery: "plumber in Austin, TX",
      pageSize: 20,
    });
    expect(JSON.parse(String(calls[1]!.init.body))).toMatchObject({ pageToken: "token-1" });
    expect(results[0]).toMatchObject({
      placeId: "p1a",
      name: "Biz p1a",
      city: "Austin",
      state: "TX",
      category: "Plumber",
      website: null,
      hours: ["Monday: 8:00 AM – 5:00 PM"],
    });
  });

  it("stops when there is no nextPageToken and turns HTTP errors into PlacesError", async () => {
    const one = vi.fn(async () =>
      Response.json({ places: [googlePlace("x")] }),
    ) as unknown as typeof fetch;
    expect(await new GooglePlacesClient("k", one).searchText("q in A, TX")).toHaveLength(1);
    expect(one).toHaveBeenCalledTimes(1);

    const bad = vi.fn(async () =>
      Response.json({ error: { message: "API key not valid" } }, { status: 403 }),
    ) as unknown as typeof fetch;
    await expect(new GooglePlacesClient("k", bad).searchText("q in A, TX")).rejects.toThrow(
      /API key not valid/,
    );
  });

  it("drops places without a name", () => {
    expect(toPlaceBusiness({ id: "x" })).toBeNull();
  });
});

describe("source selection", () => {
  it("uses the mock in tests, OpenStreetMap without a key and Google with a key", () => {
    expect(getPlacesClient().source).toBe("mock");
    vi.stubEnv("PROSPECTS_SOURCE", "");
    try {
      expect(getPlacesClient().source).toBe("osm");
      vi.stubEnv("GOOGLE_MAPS_API_KEY", "abc");
      expect(getPlacesClient().source).toBe("google");
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("the mock returns ~15 clearly fake businesses, some without a website", () => {
    const list = mockBusinesses("plumber in Austin, TX");
    expect(list.length).toBeGreaterThanOrEqual(12);
    expect(list.every((b) => b.phone?.includes("555-01"))).toBe(true);
    expect(list.some((b) => b.website === null)).toBe(true);
    expect(
      list.filter((b) => b.website).every((b) => /example\.com|facebook\.com/.test(b.website!)),
    ).toBe(true);
  });
});

// ---------- OpenStreetMap ----------

describe("OverpassClient", () => {
  it("maps trades to OSM tags", () => {
    expect(tradeFilters("Plumber")?.filters).toEqual(['["craft"="plumber"]']);
    expect(tradeFilters("auto repair")?.filters).toEqual(['["shop"="car_repair"]']);
    expect(tradeFilters("nail salon")?.filters).toEqual(['["shop"="beauty"]["beauty"~"nails"]']);
    expect(tradeFilters("barber")?.filters).toEqual(['["shop"="hairdresser"]']);
    expect(tradeFilters("HVAC")?.filters).toEqual(['["craft"="hvac"]']);
    expect(tradeFilters("underwater basket weaving")).toBeNull();
  });

  it("sends one polite query around the city and reads the tags", async () => {
    const calls: RequestInit[] = [];
    const fetchImpl = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      expect(String(url)).toBe(OVERPASS_URL);
      calls.push(init ?? {});
      return Response.json({
        elements: [
          {
            type: "node",
            id: 123,
            tags: {
              name: "Real Plumbing",
              craft: "plumber",
              "contact:phone": "+1 512-555-0100",
              website: "realplumbing.example.org",
              email: "Office@RealPlumbing.example.org",
              "addr:housenumber": "12",
              "addr:street": "Oak St",
              "addr:city": "Austin",
              "addr:state": "TX",
              "addr:postcode": "78701",
              opening_hours: "Mo-Fr 08:00-17:00",
            },
          },
          { type: "way", id: 9, tags: { craft: "plumber" } },
        ],
      });
    }) as unknown as typeof fetch;

    const client = new OverpassClient(fetchImpl);
    const results = await client.searchText("plumber in Austin, TX");
    // A mesma busca de novo vem do cache (uma consulta só).
    await client.searchText("plumber in Austin, TX");
    expect(calls).toHaveLength(1);

    const headers = calls[0]!.headers as Record<string, string>;
    expect(headers["User-Agent"]).toBe(OSM_USER_AGENT);
    const query = new URLSearchParams(String(calls[0]!.body)).get("data")!;
    expect(query).toContain('nwr["craft"="plumber"]["name"](around:15000,');
    expect(query).toContain("[timeout:25]");

    expect(results).toEqual([
      {
        placeId: "osm:node/123",
        name: "Real Plumbing",
        category: "Plumber",
        address: "12 Oak St, Austin, TX 78701",
        city: "Austin",
        state: "TX",
        phone: "(512) 555-0100",
        website: "https://realplumbing.example.org",
        rating: null,
        reviewCount: null,
        hours: ["Mo-Fr 08:00-17:00"],
        email: "office@realplumbing.example.org",
      },
    ]);
  });

  it("refuses unknown trades and cities without calling the API", async () => {
    const fetchImpl = vi.fn() as unknown as typeof fetch;
    const client = new OverpassClient(fetchImpl);
    await expect(client.searchText("astronaut in Austin, TX")).rejects.toThrow(/can't search/);
    await expect(client.searchText("plumber in Nowheresville, TX")).rejects.toThrow(/don't know/);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("builds the query and formats phones", () => {
    expect(buildOverpassQuery({ label: "X", filters: ['["a"="b"]'] }, 30.1, -97.7)).toContain(
      "out center tags",
    );
    expect(formatUsPhone("5125550100")).toBe("(512) 555-0100");
    expect(formatUsPhone("+44 20 7946 0000")).toBe("+44 20 7946 0000");
  });
});

// ---------- Conferência do site ----------

const VIEWPORT = '<meta name="viewport" content="width=device-width">';
const CONTENT = `<p>${"We fix leaks, install water heaters and clear drains. ".repeat(8)}</p>`;

describe("website check", () => {
  it("classifies weak and ok pages", () => {
    expect(
      classifyPage("https://a.com/", `<html><head>${VIEWPORT}</head><body>${CONTENT}</body></html>`)
        .status,
    ).toBe("ok");
    const http = classifyPage("http://a.com/", `<head>${VIEWPORT}</head>${CONTENT}`);
    expect(http).toEqual({ status: "weak", notes: ["not https"] });
    expect(classifyPage("https://a.com/", `<body>${CONTENT}</body>`).notes).toContain(
      "no mobile viewport",
    );
    expect(
      classifyPage("https://a.com/", `${VIEWPORT}<h1>This domain is for sale</h1>`).notes,
    ).toContain("parked or placeholder page");
    expect(classifyPage("https://a.com/", `${VIEWPORT}<p>Hi</p>`).notes).toContain(
      "almost no content",
    );
    // Copyright antigo é só observação.
    const old = classifyPage("https://a.com/", `${VIEWPORT}${CONTENT}<footer>© 2012 Joe</footer>`);
    expect(old.status).toBe("ok");
    expect(old.notes).toEqual(["copyright 2012"]);
  });

  it("extracts public emails from mailto links and visible text, never guessing", () => {
    const html = `
      <a href="mailto:Info@JoesPlumbing.com?subject=Hi">Email</a>
      <p>Or write to joe.smith&#64;gmail.com</p>
      <img src="logo@2x.png">
      <script>var x = "tracker@sentry.io";</script>
      <p>noreply@joesplumbing.com</p>`;
    expect(extractEmails(html, "https://www.joesplumbing.com")).toEqual([
      "info@joesplumbing.com",
      "joe.smith@gmail.com",
    ]);
    expect(pickEmail("<p>Call us!</p>")).toBeNull();
    expect(pickEmail('<a href="mailto:you@example.com">x</a>')).toBeNull();
  });

  it("blocks private and odd addresses", () => {
    expect(isFetchableUrl("https://joes.com")).toBe(true);
    expect(isFetchableUrl("http://localhost:3000")).toBe(false);
    expect(isFetchableUrl("http://10.0.0.1/")).toBe(false);
    expect(isFetchableUrl("http://printer.local/")).toBe(false);
    expect(isFetchableUrl("ftp://joes.com")).toBe(false);
  });

  it("checks a site: follows redirects, tries the contact page once for an email", async () => {
    const seen: string[] = [];
    const fetchImpl = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      seen.push(url);
      expect((init?.headers as Record<string, string>)["User-Agent"]).toMatch(/^NoSweatBot\/1\.0/);
      if (url === "http://joes.com/") {
        return new Response(null, { status: 301, headers: { location: "https://joes.com/" } });
      }
      if (url === "https://joes.com/") {
        return new Response(`<head>${VIEWPORT}</head>${CONTENT}<a href="/contact-us">Contact</a>`, {
          headers: { "content-type": "text/html" },
        });
      }
      if (url === "https://joes.com/contact-us") {
        return new Response("<p>Email: hello@joes.com</p>", {
          headers: { "content-type": "text/html" },
        });
      }
      return new Response("nope", { status: 404 });
    }) as unknown as typeof fetch;

    expect(await checkWebsite("http://joes.com/", fetchImpl)).toEqual({
      status: "ok",
      notes: null,
      email: "hello@joes.com",
    });
    expect(seen).toEqual(["http://joes.com/", "https://joes.com/", "https://joes.com/contact-us"]);
  });

  it("no website = none; social profile = weak; failures = unknown", async () => {
    const fail = vi.fn(async () => {
      throw new TypeError("fetch failed");
    }) as unknown as typeof fetch;
    expect((await checkWebsite(null, fail)).status).toBe("none");
    expect((await checkWebsite("https://facebook.com/joes", fail)).status).toBe("weak");
    expect(await checkWebsite("https://joes.com", fail)).toEqual({
      status: "unknown",
      notes: "could not open",
      email: null,
    });
  });
});

// ---------- Store, busca e regras ----------

function upsert(placeId: string, extra: Partial<ProspectUpsert> = {}): ProspectUpsert {
  return {
    placeId,
    name: `Biz ${placeId}`,
    category: "Plumber",
    address: null,
    city: "Austin",
    state: "TX",
    phone: "(512) 555-0100",
    website: null,
    rating: null,
    reviewCount: null,
    hours: [],
    websiteStatus: "none",
    websiteNotes: null,
    email: null,
    search: "plumber in Austin, TX",
    lastFetchedAt: new Date().toISOString(),
    ...extra,
  };
}

describe("prospect store", () => {
  it("inserts new rows and updates existing ones without touching status", async () => {
    const store = getProspectStore();
    expect(await store.upsertMany([upsert("a"), upsert("b")])).toEqual({ added: 2, updated: 0 });
    const [a] = (await store.list()).filter((p) => p.placeId === "a");
    await store.update(a!.id, { status: "contacted", notes: "called" });

    expect(await store.upsertMany([upsert("a", { name: "Renamed" }), upsert("c")])).toEqual({
      added: 1,
      updated: 1,
    });
    const after = await store.get(a!.id);
    expect(after).toMatchObject({ name: "Renamed", status: "contacted", notes: "called" });
    expect(await store.list()).toHaveLength(3);
  });

  it("searches with the mock source, checks the mock websites and finds emails", async () => {
    const result = await searchProspects({ trade: "plumber", city: "Austin", state: "TX" });
    expect(result).toMatchObject({ query: "plumber in Austin, TX", source: "mock", mock: true });
    expect(result.added).toBe(result.found);
    const all = await getProspectStore().list();
    const statuses = new Set(all.map((p) => p.websiteStatus));
    expect(statuses).toEqual(new Set(["none", "weak", "ok", "unknown"]));
    expect(all.some((p) => p.email?.endsWith(".example.com"))).toBe(true);
    // A mesma busca de novo só atualiza.
    const again = await searchProspects({ trade: "plumber", city: "Austin", state: "TX" });
    expect(again.added).toBe(0);
  });

  it("do-not-contact sticks for bulk actions", async () => {
    const store = getProspectStore();
    await store.upsertMany([upsert("a"), upsert("b")]);
    const [a, b] = await store.list();
    await setProspectStatus([a!.id], "do_not_contact");
    expect(await setProspectStatus([a!.id, b!.id], "contacted")).toBe(1);
    expect((await store.get(a!.id))?.status).toBe("do_not_contact");
    expect((await store.get(b!.id))?.status).toBe("contacted");
  });

  it("refreshes Google data older than 30 days, never OSM rows", async () => {
    const store = getProspectStore();
    const old = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString();
    await store.upsertMany([
      upsert("ChIJgoogle1", { lastFetchedAt: old, name: "Old name" }),
      upsert("osm:node/1", { lastFetchedAt: old }),
    ]);
    const client = {
      mock: false,
      source: "google" as const,
      searchText: vi.fn(),
      getPlace: vi.fn(async (placeId: string) => ({ ...upsert(placeId), name: "Fresh name" })),
    };
    const fresh = await ensureFresh(await store.list(), client);
    expect(client.getPlace).toHaveBeenCalledTimes(1);
    expect(client.getPlace).toHaveBeenCalledWith("ChIJgoogle1");
    expect(fresh.find((p) => p.placeId === "ChIJgoogle1")?.name).toBe("Fresh name");
  });
});

describe("preview brief", () => {
  const prospect: ProspectRecord = {
    id: "1",
    placeId: "p",
    name: "Lone Oak Plumbing",
    category: "Plumber",
    address: "12 Oak St, Austin, TX 78701",
    city: "Austin",
    state: "TX",
    phone: "(512) 555-0100",
    website: "http://lone-oak.example.com",
    hours: ["Monday: 8:00 AM – 5:00 PM", "Sunday: Closed"],
    websiteStatus: "weak",
    websiteNotes: "no mobile viewport",
    email: "office@lone-oak.example.com",
    rating: 4.9,
    reviewCount: 212,
    search: "plumber in Austin, TX",
    status: "new",
    siteId: null,
    previewToken: null,
    notes: "owner is nice",
    lastFetchedAt: null,
    createdAt: "",
    updatedAt: "",
  };

  it("contains only the public facts (no rating, reviews, email, old site or notes)", () => {
    const brief = buildPreviewBrief(prospect);
    expect(brief).toBe(
      [
        "Lone Oak Plumbing is a plumber business based in Austin, TX. Phone: (512) 555-0100. Address: 12 Oak St, Austin, TX 78701.",
        "Hours: Monday: 8:00 AM – 5:00 PM; Sunday: Closed.",
        NO_INVENTION_NOTE,
      ].join("\n\n"),
    );
    for (const leaked of ["4.9", "212", "office@", "example.com", "owner is nice", "viewport"]) {
      expect(brief).not.toContain(leaked);
    }
  });

  it("leaves out what is missing", () => {
    const brief = buildPreviewBrief({ ...prospect, phone: null, address: null, hours: [] });
    expect(brief).not.toMatch(/Phone|Address|Hours/);
  });
});

describe("preview sites", () => {
  it("creates a draft owned by the admin with an unguessable token, opened by /p/<token>", async () => {
    await searchProspects({ trade: "plumber", city: "Austin", state: "TX" });
    const target = (await getProspectStore().list()).find((p) => p.websiteStatus === "none")!;
    const done = await createPreview(ADMIN, target.id);
    expect(done.status).toBe("preview_ready");
    expect(done.previewToken).toMatch(/^[A-Za-z0-9_-]{32}$/);
    const preview = await getPublicPreview(done.previewToken!);
    expect(preview?.site.ownerId).toBe(ADMIN.id);
    expect(preview?.site.status).toBe("draft");
    expect(preview?.site.spec.business.name).toBe(target.name);
    // De novo: não gasta IA, devolve a mesma prévia.
    expect((await createPreview(ADMIN, target.id)).siteId).toBe(done.siteId);

    expect(await getPublicPreview("not-a-real-token-at-all-123456")).toBeNull();
    expect(await getPublicPreview("../etc")).toBeNull();
    // "Do not contact" tira a prévia do ar.
    await setProspectStatus([target.id], "do_not_contact");
    expect(await getPublicPreview(done.previewToken!)).toBeNull();
  });

  it("exports CSVs: email rows only with email, call list without, never do-not-contact", async () => {
    const store = getProspectStore();
    await store.upsertMany([
      upsert("a", { email: "a@a.com", name: "=cmd()" }),
      upsert("b"),
      upsert("c", { email: "c@c.com" }),
    ]);
    const all = await store.list();
    const c = all.find((p) => p.placeId === "c")!;
    await setProspectStatus([c.id], "do_not_contact");
    const rows = await store.list();
    const email = prospectsToCsv(rows, "email", "https://www.nosweatfd.com").split("\r\n");
    expect(email[0]).toBe("email,business,trade,city,state,preview_url,website_status");
    expect(email).toHaveLength(3);
    expect(email[1]).toBe("a@a.com,'=cmd(),plumber,Austin,TX,,none");
    const calls = prospectsToCsv(rows, "calls", "https://x").split("\r\n");
    expect(calls[0]).toBe("name,phone,city,preview_url");
    expect(calls[1]).toContain("Biz b");
    expect(calls).toHaveLength(3);
  });
});

describe("mock client details", () => {
  it("finds a mock place again by id", async () => {
    const [first] = mockBusinesses("roofer in Miami, FL");
    expect((await new MockPlacesClient().getPlace(first!.placeId))?.name).toBe(first!.name);
  });
});
