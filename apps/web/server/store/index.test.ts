import { afterEach, describe, expect, it, vi } from "vitest";

// O store fica em cache no módulo: cada teste carrega uma cópia nova.
async function freshGetSiteStore() {
  vi.resetModules();
  return (await import("./index")).getSiteStore;
}

describe("getSiteStore", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("uses memory in dev when Supabase is not configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    vi.stubEnv("VERCEL_ENV", "");
    const getSiteStore = await freshGetSiteStore();
    const { MemorySiteStore } = await import("./memory");
    expect(getSiteStore()).toBeInstanceOf(MemorySiteStore);
  });

  it("refuses the memory store in Vercel production", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    vi.stubEnv("VERCEL_ENV", "production");
    vi.spyOn(console, "error").mockImplementation(() => {});
    const getSiteStore = await freshGetSiteStore();
    expect(() => getSiteStore()).toThrow(/Supabase is not configured in production/);
  });
});
