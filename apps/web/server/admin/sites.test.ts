import { fixtures } from "@nosweat/fixtures";
import { describe, expect, it, vi } from "vitest";
import type { SiteRecord } from "../store";
import {
  DeleteSitesInput,
  GuestCleanupInput,
  MAX_BULK_DELETE,
  SITES_PAGE_SIZE,
  adminDeleteGuestDrafts,
  adminDeleteSites,
  adminUnpublishSite,
  countSitesByFilter,
  filterSites,
  guestDraftsOlderThan,
  liveHref,
  parseSiteFilter,
  parseSiteLimit,
  type AdminSiteDeps,
  type SiteOwnerInfo,
} from "./sites";

const NOW = new Date("2026-10-25T12:00:00Z");
const DAY = 24 * 60 * 60 * 1000;

function site(id: string, overrides: Partial<SiteRecord> = {}): SiteRecord {
  return {
    id,
    ownerId: "owner-real",
    guestId: null,
    spec: fixtures["joes-plumbing"],
    publishedSpec: null,
    status: "draft",
    slug: null,
    customDomain: null,
    publishedAt: null,
    createdAt: NOW.toISOString(),
    updatedAt: NOW.toISOString(),
    ...overrides,
  };
}

const owners = new Map<string, SiteOwnerInfo>([
  ["owner-real", { email: "owner@joesplumbing.com", testAccount: false }],
  ["owner-test", { email: "test+abc@nosweatfd.com", testAccount: true }],
]);

const SITES = [
  site("a", { status: "published", slug: "joes-plumbing", customDomain: "joesplumbing.com" }),
  site("b", { ownerId: "owner-test" }),
  site("c", { ownerId: null, guestId: "guest-1" }),
  site("d", { ownerId: "owner-test", status: "published", slug: "test-site" }),
];

function fakeDeps(sites: SiteRecord[] = SITES) {
  const byId = new Map(sites.map((s) => [s.id, s]));
  const deps: AdminSiteDeps = {
    getSite: vi.fn(async (id: string) => byId.get(id) ?? null),
    unpublish: vi.fn(async (id: string) => {
      const current = byId.get(id);
      return current ? { ...current, status: "draft" as const } : null;
    }),
    deleteSite: vi.fn(async (s: SiteRecord) => byId.delete(s.id)),
    deleteGuestSitesBefore: vi.fn(async () => 3),
  };
  return deps;
}

describe("admin site filters", () => {
  it("filters by status, guest and test-account owners", () => {
    const ids = (filter: string) =>
      filterSites(SITES, { filter: parseSiteFilter(filter), query: "" }, owners).map((s) => s.id);
    expect(ids("all")).toEqual(["a", "b", "c", "d"]);
    expect(ids("drafts")).toEqual(["b", "c"]);
    expect(ids("live")).toEqual(["a", "d"]);
    expect(ids("guest")).toEqual(["c"]);
    expect(ids("test")).toEqual(["b", "d"]);
    expect(ids("nonsense")).toEqual(["a", "b", "c", "d"]);
  });

  it("searches business name, owner email, slug and domain (case-insensitive)", () => {
    const find = (query: string) =>
      filterSites(SITES, { filter: "all", query }, owners).map((s) => s.id);
    expect(find("JOESPLUMBING.COM")).toEqual(["a"]);
    expect(find("test-site")).toEqual(["d"]);
    expect(find("nosweatfd.com")).toEqual(["b", "d"]);
    expect(find(fixtures["joes-plumbing"].business.name.toLowerCase())).toHaveLength(4);
    expect(find("nothing-matches")).toEqual([]);
  });

  it("counts every filter", () => {
    expect(countSitesByFilter(SITES, owners)).toEqual({
      all: 4,
      drafts: 2,
      live: 2,
      guest: 1,
      test: 2,
    });
  });

  it("parses the page limit in steps of one page", () => {
    expect(parseSiteLimit(undefined)).toBe(SITES_PAGE_SIZE);
    expect(parseSiteLimit("abc")).toBe(SITES_PAGE_SIZE);
    expect(parseSiteLimit("75")).toBe(SITES_PAGE_SIZE * 2);
    expect(parseSiteLimit("999999")).toBe(1000);
  });

  it("links to the live address only when published", () => {
    expect(liveHref(SITES[0] as SiteRecord)).toBe("https://joesplumbing.com");
    expect(liveHref(SITES[3] as SiteRecord)).toBe("/s/test-site");
    expect(liveHref(SITES[1] as SiteRecord)).toBeNull();
  });
});

describe("admin site actions", () => {
  it("takes a live site offline and treats an offline one as done", async () => {
    const deps = fakeDeps();
    await expect(adminUnpublishSite("a", deps)).resolves.toMatchObject({
      ok: true,
      alreadyOffline: false,
    });
    expect(deps.unpublish).toHaveBeenCalledWith("a");
    await expect(adminUnpublishSite("b", deps)).resolves.toMatchObject({
      ok: true,
      alreadyOffline: true,
    });
    expect(deps.unpublish).toHaveBeenCalledTimes(1);
    await expect(adminUnpublishSite("missing", deps)).resolves.toMatchObject({ ok: false });
  });

  it("deletes each site once through the shared deletion path and reports missing ones", async () => {
    const deps = fakeDeps();
    const result = await adminDeleteSites(["a", "b", "a", "missing"], deps);
    expect(result.deleted.map((s) => s.id)).toEqual(["a", "b"]);
    expect(result.missing).toEqual(["missing"]);
    expect(result.failed).toEqual([]);
    expect(deps.deleteSite).toHaveBeenCalledTimes(2);
  });

  it("keeps going when one deletion fails", async () => {
    const deps = fakeDeps();
    deps.deleteSite = vi.fn(async (s: SiteRecord) => {
      if (s.id === "a") throw new Error("vercel down");
      return true;
    });
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const result = await adminDeleteSites(["a", "b"], deps);
    spy.mockRestore();
    expect(result.failed).toEqual(["a"]);
    expect(result.deleted.map((s) => s.id)).toEqual(["b"]);
  });

  it("deletes guest drafts older than N days with the cron's query", async () => {
    const deps = fakeDeps();
    await expect(adminDeleteGuestDrafts(7, deps, NOW)).resolves.toBe(3);
    expect(deps.deleteGuestSitesBefore).toHaveBeenCalledWith(
      new Date(NOW.getTime() - 7 * DAY).toISOString(),
    );
  });

  it("picks the same guest drafts the cleanup deletes", () => {
    const old = site("old", {
      ownerId: null,
      guestId: "g",
      createdAt: new Date(NOW.getTime() - 8 * DAY).toISOString(),
    });
    const fresh = site("fresh", { ownerId: null, guestId: "g" });
    const legacy = site("legacy", {
      ownerId: null,
      guestId: null,
      createdAt: new Date(NOW.getTime() - 90 * DAY).toISOString(),
    });
    expect(guestDraftsOlderThan([old, fresh, legacy], 7, NOW).map((s) => s.id)).toEqual(["old"]);
  });

  it("validates the inputs", () => {
    expect(DeleteSitesInput.safeParse({ siteIds: [] }).success).toBe(false);
    expect(
      DeleteSitesInput.safeParse({
        siteIds: Array.from({ length: MAX_BULK_DELETE + 1 }, (_, i) => `s${i}`),
      }).success,
    ).toBe(false);
    expect(DeleteSitesInput.safeParse({ siteIds: ["a"] }).success).toBe(true);
    expect(GuestCleanupInput.safeParse({ days: "7" }).success).toBe(true);
    expect(GuestCleanupInput.safeParse({ days: 0 }).success).toBe(false);
    expect(GuestCleanupInput.safeParse({ days: 1.5 }).success).toBe(false);
    expect(GuestCleanupInput.safeParse({ days: 366 }).success).toBe(false);
  });
});
