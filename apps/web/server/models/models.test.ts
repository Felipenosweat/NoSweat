import { fixtures } from "@nosweat/fixtures";
import { SiteSpec } from "@nosweat/schema";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CreateModelRequest, ModelKeywords, UpdateModelKeywordsRequest } from "@/lib/model-studio";
import {
  ALL_MODELS,
  clearModelPoolCache,
  loadModelPool,
  mergeModelPool,
  modelFor,
  pickModel,
} from "../ai/models";
import {
  createModel,
  getModel,
  listModels,
  ModelStudioError,
  resetModel,
  sameModelSpec,
  saveModel,
  setKeywords,
  setStatus,
} from "./index";
import { MemoryModelStore, getModelStore, parseRows, type ModelRecord } from "./store";

const ADMIN = "00000000-0000-4000-8000-000000000001";

function renamed(spec: SiteSpec, name: string): SiteSpec {
  return SiteSpec.parse({ ...structuredClone(spec), business: { ...spec.business, name } });
}

beforeEach(() => {
  new MemoryModelStore().clear();
  clearModelPoolCache();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("model studio", () => {
  it("lists every code model, grouped by category, as unedited drafts", async () => {
    const models = await listModels();
    expect(models).toHaveLength(ALL_MODELS.length);
    expect(models.every((model) => model.source === "code" && !model.edited)).toBe(true);
    expect(models.every((model) => model.status === "draft" && model.inUse)).toBe(true);
    // Categorias juntas (cada uma aparece num bloco só).
    const order = models.map((model) => model.category);
    const blocks = order.filter((category, index) => category !== order[index - 1]);
    expect(new Set(blocks).size).toBe(blocks.length);
  });

  it("saves an edit as a draft and resets back to the code version", async () => {
    const edited = renamed(fixtures["joes-plumbing"], "Joe's Plumbing & Drains");
    const saved = await saveModel("joes-plumbing", edited, { userId: ADMIN });
    expect(saved?.edited).toBe(true);
    expect(saved?.status).toBe("draft");
    expect(saved?.usesStudioVersion).toBe(false);
    expect((await getModel("joes-plumbing"))?.spec.business.name).toBe("Joe's Plumbing & Drains");

    const reset = await resetModel("joes-plumbing");
    expect(reset && "slug" in reset ? reset.spec : null).toBe(fixtures["joes-plumbing"]);
    expect((await getModel("joes-plumbing"))?.updatedAt).toBeNull();
  });

  it("returns null for unknown or malformed slugs", async () => {
    expect(await getModel("nope-not-a-model")).toBeNull();
    expect(await getModel("../etc")).toBeNull();
    expect(await saveModel("nope-not-a-model", fixtures["joes-plumbing"])).toBeNull();
    expect(await setStatus("nope-not-a-model", "approved")).toBeNull();
    expect(await resetModel("nope-not-a-model")).toBeNull();
  });

  it("detects a conflicting save from another tab", async () => {
    const first = await saveModel("glow-salon", renamed(fixtures["glow-salon"], "Glow One"));
    expect(first?.updatedAt).toBeTruthy();
    await expect(
      saveModel("glow-salon", renamed(fixtures["glow-salon"], "Glow Two"), {
        baseUpdatedAt: "2000-01-01T00:00:00.000Z",
      }),
    ).rejects.toBeInstanceOf(ModelStudioError);
  });

  it("approving an unedited code model keeps it marked as not edited", async () => {
    const approved = await setStatus("rosas-kitchen", "approved", ADMIN);
    expect(approved?.status).toBe("approved");
    expect(approved?.edited).toBe(false);
    // Voltar para rascunho sem versão salva não grava nada.
    await resetModel("rosas-kitchen");
    const draft = await setStatus("rosas-kitchen", "draft");
    expect(draft?.updatedAt).toBeNull();
  });

  it("saving an approved model sends it back to draft", async () => {
    await setStatus("hale-ortiz", "approved");
    const saved = await saveModel("hale-ortiz", renamed(fixtures["hale-ortiz"], "Hale Ortiz CPA"));
    expect(saved?.status).toBe("draft");
  });

  it("duplicates a model into a new studio draft with a free slug", async () => {
    const copy = await createModel("beauty", "glow-salon", { userId: ADMIN });
    expect(copy.slug).toBe("glow-salon-copy");
    expect(copy.source).toBe("studio");
    expect(copy.status).toBe("draft");
    expect(copy.inUse).toBe(false);
    const second = await createModel("professional", "glow-salon");
    expect(second.slug).toBe("glow-salon-copy-2");
    expect(second.spec.template).toBe("professional");
    expect(second.category).toBe("professional");

    await expect(createModel("beauty", "glow-salon", { slug: "vega-photo" })).rejects.toThrow(
      /already exists/,
    );
    await expect(createModel("beauty", "missing-model")).rejects.toBeInstanceOf(ModelStudioError);
    expect((await listModels()).filter((model) => model.source === "studio")).toHaveLength(2);

    // Modelo do estúdio: "reset" apaga.
    expect(await resetModel("glow-salon-copy")).toEqual({ deleted: true });
    expect(await getModel("glow-salon-copy")).toBeNull();
  });

  it("updates keywords without changing the status", async () => {
    await setStatus("vega-photo", "approved");
    const updated = await setKeywords("vega-photo", ["newborn", "family portrait"]);
    expect(updated?.keywords).toEqual(["newborn", "family portrait"]);
    expect(updated?.status).toBe("approved");
  });

  it("compares specs regardless of key order", () => {
    const spec = fixtures["vega-photo"];
    const reordered = JSON.parse(
      JSON.stringify(Object.fromEntries(Object.entries(spec).reverse())),
    ) as SiteSpec;
    expect(sameModelSpec(spec, reordered)).toBe(true);
    expect(sameModelSpec(spec, renamed(spec, "Other"))).toBe(false);
  });
});

describe("model pool (generation)", () => {
  function record(partial: Partial<ModelRecord> & Pick<ModelRecord, "slug" | "spec">): ModelRecord {
    return {
      status: "approved",
      category: null,
      keywords: null,
      updatedAt: "2026-10-01T00:00:00.000Z",
      updatedBy: null,
      ...partial,
    };
  }

  it("replaces a code model only when its studio version is approved", () => {
    const edited = renamed(fixtures["joes-plumbing"], "Joe's Approved");
    const draftPool = mergeModelPool(ALL_MODELS, [
      record({ slug: "joes-plumbing", spec: edited, status: "draft" }),
    ]);
    expect(pickModel(draftPool, "home-services", "Roofing contractor")).toBe(
      fixtures["joes-plumbing"],
    );

    const pool = mergeModelPool(ALL_MODELS, [record({ slug: "joes-plumbing", spec: edited })]);
    expect(pool).toHaveLength(ALL_MODELS.length);
    // Continua sendo o padrão da categoria (mesmo lugar na lista).
    expect(pickModel(pool, "home-services", "Roofing contractor").business.name).toBe(
      "Joe's Approved",
    );
  });

  it("adds studio-only models to the pool only when approved", () => {
    const spec = renamed(fixtures["glow-salon"], "Brow Bar Studio");
    const draft = mergeModelPool(ALL_MODELS, [
      record({ slug: "brow-bar", spec, status: "draft", category: "beauty", keywords: ["brow"] }),
    ]);
    expect(draft).toHaveLength(ALL_MODELS.length);

    const pool = mergeModelPool(ALL_MODELS, [
      record({ slug: "brow-bar", spec, category: "beauty", keywords: ["brow", "threading"] }),
    ]);
    expect(pool).toHaveLength(ALL_MODELS.length + 1);
    expect(pickModel(pool, "beauty", "Brow threading studio in Houston").business.name).toBe(
      "Brow Bar Studio",
    );
  });

  it("keeps modelFor working on the code models only", () => {
    expect(modelFor("home-services", "Roofing contractor")).toBe(fixtures["joes-plumbing"]);
  });

  it("loadModelPool merges approved studio versions and caches them", async () => {
    const edited = renamed(fixtures["sparkle-cleaning"], "Sparkle Approved");
    await saveModel("sparkle-cleaning", edited);
    await setStatus("sparkle-cleaning", "approved");

    const pool = await loadModelPool();
    expect(pickModel(pool, "home-services", "House cleaning").business.name).toBe(
      "Sparkle Approved",
    );

    // Em cache: a mudança direto no store só aparece depois de limpar (ou de 60 s).
    await getModelStore().delete("sparkle-cleaning");
    expect(await loadModelPool()).toBe(pool);
    clearModelPoolCache();
    expect(pickModel(await loadModelPool(), "home-services", "House cleaning")).toBe(
      fixtures["sparkle-cleaning"],
    );
  });

  it("falls back to the code models when the store fails", async () => {
    const store = getModelStore();
    vi.spyOn(store, "list").mockRejectedValueOnce(new Error("relation does not exist"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await loadModelPool()).toBe(ALL_MODELS);
  });
});

describe("rows and requests", () => {
  it("skips rows that fail the schema", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const good = {
      slug: "brow-bar",
      spec: fixtures["glow-salon"],
      status: "approved",
      category: "beauty",
      keywords: ["brow"],
      updated_at: "2026-10-01T00:00:00.000Z",
      updated_by: null,
    };
    const rows = parseRows([good, { ...good, slug: "broken", spec: { nope: true } }]);
    expect(rows.map((row) => row.slug)).toEqual(["brow-bar"]);
  });

  it("validates studio requests", () => {
    expect(
      CreateModelRequest.safeParse({ category: "beauty", fromSlug: "Glow Salon" }).success,
    ).toBe(false);
    expect(
      CreateModelRequest.safeParse({ category: "bakery", fromSlug: "glow-salon" }).success,
    ).toBe(false);
    expect(ModelKeywords.parse([" Brow ", "brow", "Threading"])).toEqual(["brow", "threading"]);
    expect(UpdateModelKeywordsRequest.safeParse({ keywords: ["x"] }).success).toBe(false);
  });
});
