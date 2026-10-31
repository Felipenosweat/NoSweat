import { fixtures } from "@nosweat/fixtures";
import { SiteSpec, type Section, type SiteImage } from "@nosweat/schema";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetUnsplashTracking } from "./providers";
import { sanitizeAiImages } from "./sanitize";
import {
  clearImageCache,
  MAX_SERVICE_IMAGES,
  resolveHeroImage,
  resolveServiceImages,
  resolveSiteImages,
  searchImages,
} from "./search";

const pexelsBody = {
  photos: [
    {
      width: 4000,
      height: 3000,
      alt: "Copper pipes and wrench",
      photographer: "Ana Lee",
      photographer_url: "https://www.pexels.com/@ana",
      src: { original: "https://images.pexels.com/photos/1/a.jpeg" },
    },
  ],
};

const unsplashBody = {
  results: [
    {
      width: 2000,
      height: 1000,
      alt_description: "clean kitchen",
      urls: { regular: "https://images.unsplash.com/photo-1?w=1080" },
      links: { download_location: "https://api.unsplash.com/photos/1/download" },
      user: { name: "Sam Roe", links: { html: "https://unsplash.com/@sam" } },
    },
  ],
};

function fakeFetch(handler: (url: string) => { status?: number; body?: unknown }) {
  return vi.fn(async (input: string | URL | Request, _init?: RequestInit) => {
    const url = input instanceof Request ? input.url : String(input);
    const { status = 200, body = {} } = handler(url);
    return new Response(JSON.stringify(body), { status });
  });
}

const ownerPhoto: SiteImage = {
  url: "https://example.supabase.co/storage/v1/object/public/site-images/a.jpg",
  alt: "Our van",
  source: "upload",
  kind: "owner",
};

const stockPhoto: SiteImage = {
  url: "https://images.pexels.com/photos/9/x.jpeg",
  alt: "Pipes",
  source: "pexels",
  kind: "scene",
  credit: { name: "Ana Lee", url: "https://www.pexels.com/@ana" },
};

const gallery: Section = { type: "gallery", title: "Our work", images: [ownerPhoto] };

/** Fixture com o hero trocado (e seções extras opcionais). */
function specWith(hero: Partial<Extract<Section, { type: "hero" }>>, extra?: Section[]): SiteSpec {
  const base = structuredClone(fixtures["joes-plumbing"]);
  const [first, ...rest] = base.sections;
  if (first?.type !== "hero") throw new Error("fixture must start with a hero");
  // O exemplo já vem com foto e busca; os testes partem de um topo sem nenhuma das duas.
  const plainHero = { ...first };
  delete plainHero.image;
  delete plainHero.imageQuery;
  return { ...base, sections: [{ ...plainHero, ...hero }, ...(extra ?? rest)] };
}

function heroOf(spec: SiteSpec) {
  const hero = spec.sections.find((section) => section.type === "hero");
  if (hero?.type !== "hero") throw new Error("no hero");
  return hero;
}

beforeEach(() => {
  clearImageCache();
  resetUnsplashTracking();
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("searchImages", () => {
  it("returns [] without any key and never calls the network", async () => {
    vi.stubEnv("PEXELS_API_KEY", "");
    vi.stubEnv("UNSPLASH_ACCESS_KEY", "");
    const fetch = fakeFetch(() => ({ body: pexelsBody }));
    expect(await searchImages("plumber tools", "landscape", { fetch })).toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("maps Pexels photos to scene images with credit and caches the result", async () => {
    vi.stubEnv("PEXELS_API_KEY", "pexels-key");
    vi.stubEnv("UNSPLASH_ACCESS_KEY", "");
    const fetch = fakeFetch(() => ({ body: pexelsBody }));

    const [image] = await searchImages("plumber tools", "landscape", { fetch });
    expect(image).toEqual({
      url: "https://images.pexels.com/photos/1/a.jpeg?auto=compress&cs=tinysrgb&w=1920",
      alt: "Copper pipes and wrench",
      source: "pexels",
      kind: "scene",
      credit: { name: "Ana Lee", url: "https://www.pexels.com/@ana" },
      width: 1920,
      height: 1440,
    });
    const [url, init] = fetch.mock.calls[0] as unknown as [URL, RequestInit];
    expect(String(url)).toContain("api.pexels.com/v1/search?query=plumber+tools");
    expect(String(url)).toContain("orientation=landscape");
    expect(init.headers).toEqual({ Authorization: "pexels-key" });

    // Mesma busca (com outra caixa/espaços): vem do cache.
    await searchImages("  Plumber   TOOLS ", "landscape", { fetch });
    expect(fetch).toHaveBeenCalledTimes(1);
    // Outra orientação é outra busca.
    await searchImages("plumber tools", "portrait", { fetch });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("uses the query as alt text when the photo has none", async () => {
    vi.stubEnv("PEXELS_API_KEY", "k");
    const body = { photos: [{ ...pexelsBody.photos[0], alt: "" }] };
    const [image] = await searchImages("bakery counter", "landscape", {
      fetch: fakeFetch(() => ({ body })),
    });
    expect(image?.alt).toBe("bakery counter");
  });

  it("falls back to Unsplash when Pexels fails, with utm credit links", async () => {
    vi.stubEnv("PEXELS_API_KEY", "k");
    vi.stubEnv("UNSPLASH_ACCESS_KEY", "u-key");
    const fetch = fakeFetch((url) =>
      url.includes("pexels") ? { status: 500 } : { body: unsplashBody },
    );
    const [image] = await searchImages("clean kitchen", "square", { fetch });
    expect(image).toMatchObject({
      url: "https://images.unsplash.com/photo-1?w=1080",
      source: "unsplash",
      kind: "scene",
      credit: {
        name: "Sam Roe",
        url: "https://unsplash.com/@sam?utm_source=nosweat&utm_medium=referral",
      },
      width: 1080,
      height: 540,
    });
    const unsplashCall = fetch.mock.calls.find(([u]) => String(u).includes("unsplash"));
    expect(String(unsplashCall?.[0])).toContain("orientation=squarish");
  });

  it("throws when every configured provider fails (and does not cache it)", async () => {
    vi.stubEnv("PEXELS_API_KEY", "k");
    vi.stubEnv("UNSPLASH_ACCESS_KEY", "");
    const fetch = fakeFetch(() => ({ status: 429 }));
    await expect(searchImages("x y", "landscape", { fetch })).rejects.toThrow(/429/);
    await expect(searchImages("x y", "landscape", { fetch })).rejects.toThrow();
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});

describe("resolveHeroImage", () => {
  it("fills hero.image from imageQuery", async () => {
    vi.stubEnv("PEXELS_API_KEY", "k");
    const spec = specWith({ imageQuery: "plumber tools copper pipes" });
    const result = await resolveHeroImage(spec, { fetch: fakeFetch(() => ({ body: pexelsBody })) });
    expect(heroOf(result).image?.source).toBe("pexels");
    expect(SiteSpec.safeParse(result).success).toBe(true);
    expect(heroOf(spec).image).toBeUndefined(); // não altera o original
  });

  it("keeps an existing image and skips heroes without a query", async () => {
    vi.stubEnv("PEXELS_API_KEY", "k");
    const fetch = fakeFetch(() => ({ body: pexelsBody }));
    const withImage = specWith({ imageQuery: "pipes", image: ownerPhoto });
    expect(await resolveHeroImage(withImage, { fetch })).toBe(withImage);
    const noQuery = specWith({});
    expect(await resolveHeroImage(noQuery, { fetch })).toBe(noQuery);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("never throws: network errors and timeouts leave the site without a photo", async () => {
    vi.stubEnv("PEXELS_API_KEY", "k");
    const spec = specWith({ imageQuery: "pipes" });
    const fetch = vi.fn(async () => {
      throw new DOMException("The operation timed out.", "TimeoutError");
    });
    const result = await resolveHeroImage(spec, { fetch });
    expect(heroOf(result).image).toBeUndefined();
  });

  it("on edits only searches when imageQuery changed", async () => {
    vi.stubEnv("PEXELS_API_KEY", "k");
    const fetch = fakeFetch(() => ({ body: pexelsBody }));
    const previous = specWith({ imageQuery: "pipes" });
    const same = specWith({ imageQuery: "pipes" });
    expect(heroOf(await resolveHeroImage(same, { fetch, previous })).image).toBeUndefined();
    const changed = specWith({ imageQuery: "water heater basement" });
    expect(heroOf(await resolveHeroImage(changed, { fetch, previous })).image).toBeDefined();
  });

  it("pings Unsplash's download_location when an Unsplash photo is chosen", async () => {
    vi.stubEnv("UNSPLASH_ACCESS_KEY", "u-key");
    const fetch = fakeFetch(() => ({ body: unsplashBody }));
    await resolveHeroImage(specWith({ imageQuery: "clean kitchen" }), { fetch });
    const ping = fetch.mock.calls.find(([u]) => String(u).endsWith("/photos/1/download"));
    expect(ping).toBeDefined();
    expect(ping?.[1]?.headers).toMatchObject({ Authorization: "Client-ID u-key" });
  });
});

type ServiceItem = Extract<Section, { type: "services" }>["items"][number];

/** Fixture com a lista de serviços trocada (topo sem foto nem busca). */
function specWithServices(items: ServiceItem[], template?: SiteSpec["template"]): SiteSpec {
  const base = specWith({});
  return {
    ...base,
    ...(template ? { template } : {}),
    sections: base.sections.map((s) => (s.type === "services" ? { ...s, items } : s)),
  };
}

function servicesOf(spec: SiteSpec): ServiceItem[] {
  const services = spec.sections.find((s) => s.type === "services");
  if (services?.type !== "services") throw new Error("no services");
  return services.items;
}

/** Pexels de mentira: uma foto diferente por busca (a URL leva a busca). */
const perQueryFetch = () =>
  fakeFetch((url) => {
    const query = new URL(url).searchParams.get("query") ?? "x";
    const slug = query.replace(/\W+/g, "-");
    return {
      body: {
        photos: [{ ...pexelsBody.photos[0], src: { original: `https://images.pexels.com/${slug}.jpeg` } }],
      },
    };
  });

describe("resolveServiceImages", () => {
  const items = (queries: (string | undefined)[]): ServiceItem[] =>
    queries.map((imageQuery, i) => ({
      name: `Service ${i + 1}`,
      description: "Done right.",
      ...(imageQuery ? { imageQuery } : {}),
    }));

  it("fills each service photo from its imageQuery, in parallel and without repeats", async () => {
    vi.stubEnv("PEXELS_API_KEY", "k");
    const spec = specWithServices(items(["drain snake", "water heater tank", undefined]));
    const result = await resolveServiceImages(spec, { fetch: perQueryFetch() });
    const [first, second, third] = servicesOf(result);
    expect(first?.image?.url).toContain("drain-snake");
    expect(second?.image?.url).toContain("water-heater-tank");
    expect(first?.image?.credit?.name).toBe("Ana Lee");
    expect(third?.image).toBeUndefined();
    expect(SiteSpec.safeParse(result).success).toBe(true);
    expect(servicesOf(spec)[0]?.image).toBeUndefined(); // não altera o original
  });

  it("never uses the same photo twice on a site", async () => {
    vi.stubEnv("PEXELS_API_KEY", "k");
    const fetch = fakeFetch(() => ({ body: pexelsBody }));
    const spec = specWithServices(items(["pipes", "pipes"]));
    const [first, second] = servicesOf(await resolveServiceImages(spec, { fetch }));
    expect(first?.image).toBeDefined();
    expect(second?.image).toBeUndefined();
  });

  it(`searches at most ${MAX_SERVICE_IMAGES} photos`, async () => {
    vi.stubEnv("PEXELS_API_KEY", "k");
    const fetch = perQueryFetch();
    const spec = specWithServices(items(["a b", "c d", "e f", "g h"]));
    const result = await resolveServiceImages(spec, { fetch, max: 2 });
    expect(servicesOf(result).filter((item) => item.image)).toHaveLength(2);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("skips without image keys, for portfolios and on network errors", async () => {
    vi.stubEnv("PEXELS_API_KEY", "");
    vi.stubEnv("UNSPLASH_ACCESS_KEY", "");
    const fetch = perQueryFetch();
    const spec = specWithServices(items(["pipes"]));
    expect(await resolveServiceImages(spec, { fetch })).toBe(spec);
    expect(fetch).not.toHaveBeenCalled();

    vi.stubEnv("PEXELS_API_KEY", "k");
    const portfolio = specWithServices(items(["camera lens"]), "portfolio");
    expect(await resolveServiceImages(portfolio, { fetch })).toBe(portfolio);
    expect(fetch).not.toHaveBeenCalled();

    const failing = vi.fn(async () => {
      throw new DOMException("The operation timed out.", "TimeoutError");
    });
    const result = await resolveServiceImages(spec, { fetch: failing });
    expect(servicesOf(result)[0]?.image).toBeUndefined();
  });

  it("on edits only searches for new or changed queries", async () => {
    vi.stubEnv("PEXELS_API_KEY", "k");
    const fetch = perQueryFetch();
    const previous = specWithServices(items(["pipes", "water heater"]));
    const next = specWithServices(items(["pipes", "new faucet sink"]));
    const [same, changed] = servicesOf(await resolveServiceImages(next, { fetch, previous }));
    expect(same?.image).toBeUndefined();
    expect(changed?.image?.url).toContain("new-faucet-sink");
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("resolveSiteImages fills the hero and the services together", async () => {
    vi.stubEnv("PEXELS_API_KEY", "k");
    const base = specWithServices(items(["drain snake"]));
    const spec: SiteSpec = {
      ...base,
      sections: base.sections.map((s) =>
        s.type === "hero" ? { ...s, imageQuery: "plumber tools" } : s,
      ),
    };
    const result = await resolveSiteImages(spec, { fetch: perQueryFetch() });
    expect(heroOf(result).image?.url).toContain("plumber-tools");
    expect(servicesOf(result)[0]?.image?.url).toContain("drain-snake");
  });
});

describe("sanitizeAiImages", () => {
  it("drops service photos the AI wrote and keeps the platform's on edit", () => {
    const item = (extra: Partial<ServiceItem>): ServiceItem => ({
      name: "Drain cleaning",
      description: "Cleared.",
      imageQuery: "drain snake",
      ...extra,
    });
    // Geração: nenhuma foto de serviço vem da IA (só a busca).
    const generated = sanitizeAiImages(specWithServices([item({ image: stockPhoto })]));
    expect(servicesOf(generated)[0]?.image).toBeUndefined();
    expect(servicesOf(generated)[0]?.imageQuery).toBe("drain snake");

    const previous = specWithServices([item({ image: stockPhoto })]);
    // Edição: a IA trocou a foto ou a tirou → volta a anterior.
    const swapped = specWithServices([
      item({ image: { ...stockPhoto, url: "https://evil.example/x.jpg" } }),
    ]);
    expect(servicesOf(sanitizeAiImages(swapped, previous))[0]?.image).toEqual(stockPhoto);
    const dropped = specWithServices([item({ description: "Cleared fast." })]);
    expect(servicesOf(sanitizeAiImages(dropped, previous))[0]?.image).toEqual(stockPhoto);
    // A IA nunca põe foto num serviço que não tinha.
    const added = sanitizeAiImages(
      specWithServices([item({ image: stockPhoto })]),
      specWithServices([item({})]),
    );
    expect(servicesOf(added)[0]?.image).toBeUndefined();
    // Busca mudou: a foto antiga sai (a nova é buscada depois).
    const changed = specWithServices([item({ imageQuery: "clogged sink" })]);
    expect(servicesOf(sanitizeAiImages(changed, previous))[0]?.image).toBeUndefined();
    // Sem foto e sem busca: o dono pediu para tirar a foto.
    const removed = specWithServices([{ name: "Drain cleaning", description: "Cleared." }]);
    expect(servicesOf(sanitizeAiImages(removed, previous))[0]?.image).toBeUndefined();
  });

  it("on generate, strips hero images and gallery sections from the AI output", () => {
    const base = specWith({ imageQuery: "pipes", image: stockPhoto });
    const ai = {
      ...base,
      sections: [...base.sections.slice(0, 2), gallery, ...base.sections.slice(2)],
    };
    const result = sanitizeAiImages(ai);
    expect(heroOf(result).image).toBeUndefined();
    expect(heroOf(result).imageQuery).toBe("pipes");
    expect(result.sections.some((s) => s.type === "gallery")).toBe(false);
  });

  it("on edit, restores the previous hero image even if the AI changed or dropped it", () => {
    const previous = specWith({ imageQuery: "pipes", image: stockPhoto });
    const dropped = specWith({ imageQuery: "pipes" });
    expect(heroOf(sanitizeAiImages(dropped, previous)).image).toEqual(stockPhoto);
    const swapped = specWith({
      imageQuery: "pipes",
      image: { ...stockPhoto, url: "https://evil.example/x.jpg" },
    });
    expect(heroOf(sanitizeAiImages(swapped, previous)).image).toEqual(stockPhoto);
  });

  it("on edit, never lets the AI add a hero image", () => {
    const previous = specWith({ imageQuery: "pipes" });
    const added = specWith({ imageQuery: "pipes", image: stockPhoto });
    expect(heroOf(sanitizeAiImages(added, previous)).image).toBeUndefined();
  });

  it("allows removing the hero photo only when image and imageQuery are both cleared", () => {
    const previous = specWith({ imageQuery: "pipes", image: stockPhoto });
    const removed = sanitizeAiImages(specWith({}), previous);
    expect(heroOf(removed).image).toBeUndefined();
    expect(heroOf(removed).imageQuery).toBeUndefined();
  });

  it("clears the old photo when the AI changed imageQuery (a new one is fetched)", () => {
    const previous = specWith({ imageQuery: "pipes", image: stockPhoto });
    const result = sanitizeAiImages(
      specWith({ imageQuery: "water heater", image: stockPhoto }),
      previous,
    );
    expect(heroOf(result).image).toBeUndefined();
    expect(heroOf(result).imageQuery).toBe("water heater");
  });

  it("restores galleries in their original position and drops invented ones", () => {
    // Sem a galeria de fotos do modelo: o teste monta a dele.
    const model = fixtures["joes-plumbing"];
    const base: SiteSpec = {
      ...model,
      sections: model.sections.filter((section) => section.type !== "gallery"),
    };
    const [hero, services, ...rest] = base.sections as [Section, Section, ...Section[]];
    const previous: SiteSpec = { ...base, sections: [hero, services, gallery, ...rest] };

    // A IA apagou a galeria, inventou outra no fim e mudou a ordem do resto.
    const invented: Section = { type: "gallery", images: [stockPhoto] };
    const ai: SiteSpec = { ...base, sections: [hero, ...rest, services, invented] };
    const result = sanitizeAiImages(ai, previous);

    const types = result.sections.map((s) => s.type);
    expect(types.filter((t) => t === "gallery")).toHaveLength(1);
    expect(types.indexOf("gallery")).toBe(types.indexOf("services") + 1);
    expect(result.sections.find((s) => s.type === "gallery")).toEqual(gallery);
  });

  it("strips AI photos from the about section and keeps the owner's on edit", () => {
    const withAbout = (about: Extract<Section, { type: "about" }>): SiteSpec => {
      const base = structuredClone(fixtures["joes-plumbing"]);
      return {
        ...base,
        sections: base.sections.map((s) => (s.type === "about" ? about : s)),
      };
    };
    const aboutOf = (spec: SiteSpec) => {
      const about = spec.sections.find((s) => s.type === "about");
      if (about?.type !== "about") throw new Error("no about");
      return about;
    };

    // Geração: nenhuma foto no "quem somos".
    const generated = sanitizeAiImages(
      withAbout({
        type: "about",
        body: "We fix pipes.",
        image: stockPhoto,
        people: [{ name: "Joe", image: stockPhoto }],
      }),
    );
    expect(aboutOf(generated).image).toBeUndefined();
    expect(aboutOf(generated).people).toEqual([{ name: "Joe" }]);

    // Edição: as fotos do dono voltam (a IA tirou uma e trocou a outra), nada novo entra.
    const previous = withAbout({
      type: "about",
      body: "We fix pipes.",
      image: ownerPhoto,
      people: [
        { name: "Joe", image: ownerPhoto },
        { name: "Maria", role: "Office" },
      ],
    });
    const edited = sanitizeAiImages(
      withAbout({
        type: "about",
        body: "We fix pipes and drains.",
        people: [
          { name: "Maria", role: "Office", image: stockPhoto },
          { name: "Joe", image: stockPhoto },
        ],
      }),
      previous,
    );
    expect(aboutOf(edited).body).toBe("We fix pipes and drains.");
    expect(aboutOf(edited).image).toEqual(ownerPhoto);
    expect(aboutOf(edited).people).toEqual([
      { name: "Maria", role: "Office" },
      { name: "Joe", image: ownerPhoto },
    ]);
  });

  it("puts a gallery whose anchor section disappeared before contact", () => {
    const base = fixtures["joes-plumbing"];
    const previous: SiteSpec = {
      ...base,
      sections: base.sections.flatMap((s): Section[] =>
        s.type === "services" ? [s, gallery] : [s],
      ),
    };
    const ai: SiteSpec = { ...base, sections: base.sections.filter((s) => s.type !== "services") };
    const types = sanitizeAiImages(ai, previous).sections.map((s) => s.type);
    expect(types.at(-1)).toBe("contact");
    expect(types.at(-2)).toBe("gallery");
  });
});
