import { fixtures } from "@nosweat/fixtures";
import { SiteSpec, type Section, type SiteImage } from "@nosweat/schema";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetUnsplashTracking } from "./providers";
import { sanitizeAiImages } from "./sanitize";
import { clearImageCache, resolveHeroImage, searchImages } from "./search";

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
  return { ...base, sections: [{ ...first, ...hero }, ...(extra ?? rest)] };
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

describe("sanitizeAiImages", () => {
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
    const base = fixtures["joes-plumbing"];
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
