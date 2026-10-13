import { fixtures } from "@nosweat/fixtures";
import { describe, expect, it, vi } from "vitest";
import { normalizeSupabaseUrl, SupabaseSiteStore } from "./supabase";
import { DomainTakenError } from "./types";

const ID = "6f1c2a3b-4d5e-4f60-8a9b-0c1d2e3f4a5b";
const OWNER = "0b6a1f5e-2c3d-4e5f-8a9b-1c2d3e4f5a6b";
const row = {
  id: ID,
  owner_id: OWNER,
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
    const site = await store.create(fixtures["joes-plumbing"], OWNER);
    expect(site).toMatchObject({
      id: ID,
      ownerId: OWNER,
      status: "draft",
      createdAt: row.created_at,
    });

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://demo.supabase.co/rest/v1/sites");
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({ apikey: "secret", Authorization: "Bearer secret" });
    expect(JSON.parse(String(init.body))).toMatchObject({ owner_id: OWNER });
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

  it("deletes a site and reports whether it existed", async () => {
    const { store, fetchMock } = storeWith([row]);
    expect(await store.delete(ID)).toBe(true);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(`https://demo.supabase.co/rest/v1/sites?id=eq.${ID}`);
    expect(init.method).toBe("DELETE");
    expect(await store.delete("not-a-uuid")).toBe(false);
  });

  it("surfaces API errors", async () => {
    const { store } = storeWith({ message: "permission denied" }, 401);
    await expect(store.list(OWNER)).rejects.toThrow(/401/);
  });

  it("lists only the owner's sites", async () => {
    const { store, fetchMock } = storeWith([row]);
    const sites = await store.list(OWNER);
    expect(sites).toHaveLength(1);
    const [url] = fetchMock.mock.calls[0] as unknown as [string];
    expect(url).toContain(`owner_id=eq.${OWNER}`);
  });

  it("rejects owner ids that are not UUIDs", async () => {
    const { store, fetchMock } = storeWith([]);
    await expect(store.list("1 or 1=1")).rejects.toThrow(/Invalid owner id/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("updates publishing fields with snake_case columns", async () => {
    const { store, fetchMock } = storeWith([
      { ...row, slug: "joes-plumbing-6f1c2a", status: "published" },
    ]);
    const site = await store.updateMeta(ID, { status: "published", slug: "joes-plumbing-6f1c2a" });
    expect(site).toMatchObject({ status: "published", slug: "joes-plumbing-6f1c2a" });
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toMatchObject({
      status: "published",
      slug: "joes-plumbing-6f1c2a",
    });
  });

  it("maps a unique violation on the domain to DomainTakenError", async () => {
    const { store } = storeWith({ code: "23505", message: "duplicate key" }, 409);
    await expect(store.updateMeta(ID, { customDomain: "joes.com" })).rejects.toBeInstanceOf(
      DomainTakenError,
    );
  });

  it("looks up sites by domain and ignores invalid input", async () => {
    const { store, fetchMock } = storeWith([{ ...row, custom_domain: "joes.com" }]);
    expect((await store.getByDomain("joes.com"))?.customDomain).toBe("joes.com");
    expect(await store.getByDomain("joes.com&select=*")).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("reads legacy rows without an owner", async () => {
    const { store } = storeWith([{ ...row, owner_id: null }]);
    expect((await store.get(ID))?.ownerId).toBeNull();
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
