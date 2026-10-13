import { fixtures } from "@nosweat/fixtures";
import { describe, expect, it, vi } from "vitest";
import { normalizeSupabaseUrl, SupabaseSiteStore } from "./supabase";

const ID = "6f1c2a3b-4d5e-4f60-8a9b-0c1d2e3f4a5b";
const row = {
  id: ID,
  spec: fixtures["joes-plumbing"],
  status: "draft",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

function storeWith(response: unknown, status = 200) {
  const fetchMock = vi.fn(async () => Response.json(response, { status }));
  const store = new SupabaseSiteStore({
    url: "https://demo.supabase.co/",
    serviceKey: "secret",
    fetch: fetchMock as unknown as typeof fetch,
  });
  return { store, fetchMock };
}

describe("SupabaseSiteStore", () => {
  it("creates a site through the REST API", async () => {
    const { store, fetchMock } = storeWith([row], 201);
    const site = await store.create(fixtures["joes-plumbing"]);
    expect(site).toMatchObject({ id: ID, status: "draft", createdAt: row.created_at });

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://demo.supabase.co/rest/v1/sites");
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({ apikey: "secret", Authorization: "Bearer secret" });
  });

  it("returns null for unknown or malformed ids", async () => {
    const { store, fetchMock } = storeWith([]);
    expect(await store.get(ID)).toBeNull();
    expect(await store.get("not-a-uuid")).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("rejects rows whose spec breaks the contract", async () => {
    const { store } = storeWith([{ ...row, spec: { version: 1 } }]);
    await expect(store.get(ID)).rejects.toThrow();
  });

  it("surfaces API errors", async () => {
    const { store } = storeWith({ message: "permission denied" }, 401);
    await expect(store.list()).rejects.toThrow(/401/);
  });
});

describe("normalizeSupabaseUrl", () => {
  it.each([
    "https://demo.supabase.co",
    "https://demo.supabase.co/",
    "https://demo.supabase.co/rest/v1",
    " https://demo.supabase.co/rest/v1/ ",
  ])("normalizes %s", (url) => {
    expect(normalizeSupabaseUrl(url)).toBe("https://demo.supabase.co");
  });
});
