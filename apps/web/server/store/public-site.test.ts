import { fixtures } from "@nosweat/fixtures";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemorySiteStore } from "./memory";

const { revalidateTag } = vi.hoisted(() => ({ revalidateTag: vi.fn() }));
vi.mock("next/cache", () => ({ revalidateTag }));

const OWNER = "0b6a1f5e-2c3d-4e5f-8a9b-1c2d3e4f5a6b";

describe("MemorySiteStore: leituras das páginas públicas", () => {
  it("acha pelo endereço e só devolve a versão no ar de site publicado", async () => {
    const store = new MemorySiteStore();
    const draft = fixtures["joes-plumbing"];
    const live = fixtures["sparkle-cleaning"];
    const site = await store.create(draft, OWNER);
    const slug = `public-site-test-${site.id.slice(0, 8)}`;
    await store.updateMeta(site.id, { slug, customDomain: `${slug}.com` });

    expect(await store.findRef({ slug })).toEqual({ id: site.id, ownerId: OWNER });
    expect(await store.findRef({ domain: `${slug}.com` })).toEqual({
      id: site.id,
      ownerId: OWNER,
    });
    // Rascunho: a página pública não mostra.
    expect(await store.getPublished(site.id)).toBeNull();

    await store.updateMeta(site.id, { status: "published", publishedSpec: live });
    const published = await store.getPublished(site.id);
    expect(published).toMatchObject({ id: site.id, ownerId: OWNER, slug });
    expect(published?.liveSpec.business.name).toBe(live.business.name);
    expect(published).not.toHaveProperty("spec");
  });
});

describe("revalidate", () => {
  afterEach(() => revalidateTag.mockReset());

  it("expira as etiquetas do site, dos endereços atuais e dos antigos", async () => {
    const { revalidatePublicSite } = await import("./revalidate");
    revalidatePublicSite(
      { id: "a", slug: "joes", customDomain: "Joes.com" },
      { customDomain: "old.com" },
    );
    expect(revalidateTag.mock.calls).toEqual([
      ["site:a", { expire: 0 }],
      ["site-slug:joes", { expire: 0 }],
      ["site-host:joes.com", { expire: 0 }],
      ["site-host:old.com", { expire: 0 }],
    ]);
  });

  it("expira os sites do dono e ignora erro fora de um request do Next", async () => {
    const { revalidateOwnerSites } = await import("./revalidate");
    revalidateTag.mockImplementation(() => {
      throw new Error("Invariant: static generation store missing");
    });
    expect(() => revalidateOwnerSites(OWNER)).not.toThrow();
    expect(revalidateTag).toHaveBeenCalledWith(`owner:${OWNER}`, { expire: 0 });
    revalidateTag.mockClear();
    revalidateOwnerSites(null);
    expect(revalidateTag).not.toHaveBeenCalled();
  });
});
