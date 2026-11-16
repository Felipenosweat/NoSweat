import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AuditReason,
  MemoryAdminAuditStore,
  SupabaseAdminAuditStore,
  noteAdminSiteAccess,
  recordAdminAction,
  resetMemoryAdminAuditStore,
  type AdminAuditStore,
} from "./audit";

afterEach(() => {
  resetMemoryAdminAuditStore();
});

describe("recordAdminAction", () => {
  it("appends entries, newest first", async () => {
    const store = new MemoryAdminAuditStore();
    await recordAdminAction(
      { adminId: "a1", action: "credits.adjust", targetType: "user", targetId: "u1" },
      { store },
    );
    await recordAdminAction(
      { adminId: "a1", action: "view_as.start", targetId: "u2", reason: "  Support ticket  " },
      { store },
    );
    const entries = await store.listRecent(10);
    expect(entries.map((entry) => entry.action)).toEqual(["view_as.start", "credits.adjust"]);
    expect(entries[0]).toMatchObject({ reason: "Support ticket", targetType: null, ipHash: null });
  });

  it("never throws by default, but does with strict", async () => {
    const broken: AdminAuditStore = {
      insert: async () => {
        throw new Error("db down");
      },
      listRecent: async () => [],
    };
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    await expect(
      recordAdminAction({ adminId: "a1", action: "access.grant" }, { store: broken }),
    ).resolves.toBeUndefined();
    await expect(
      recordAdminAction(
        { adminId: "a1", action: "view_as.start" },
        { store: broken, strict: true },
      ),
    ).rejects.toThrow("db down");
    error.mockRestore();
  });
});

describe("SupabaseAdminAuditStore", () => {
  it("only inserts and reads (append-only)", async () => {
    const calls: { url: string; method: string; body?: unknown }[] = [];
    const fetchImpl = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({
        url: String(url),
        method: init?.method ?? "GET",
        body: init?.body ? JSON.parse(String(init.body)) : undefined,
      });
      if (init?.method === "POST") return new Response(null, { status: 201 });
      return Response.json([
        {
          id: "1",
          admin_id: "a1",
          action: "view_as.start",
          target_type: "user",
          target_id: "u1",
          reason: "ticket",
          metadata: { userAgent: "x" },
          ip_hash: "h",
          created_at: "2026-11-16T12:00:00Z",
        },
      ]);
    });
    const store = new SupabaseAdminAuditStore(
      { url: "https://example.supabase.co", serviceKey: "service" },
      fetchImpl as unknown as typeof fetch,
    );
    await store.insert({
      adminId: "a1",
      action: "view_as.start",
      targetType: "user",
      targetId: "u1",
      reason: "ticket",
      metadata: {},
      ipHash: null,
    });
    const entries = await store.listRecent(100);
    expect(calls[0]).toMatchObject({
      url: "https://example.supabase.co/rest/v1/admin_audit_log",
      method: "POST",
      body: { admin_id: "a1", action: "view_as.start", reason: "ticket" },
    });
    expect(calls[1]?.url).toContain("order=created_at.desc&limit=100");
    expect(calls.every((call) => call.method === "POST" || call.method === "GET")).toBe(true);
    expect(entries[0]).toMatchObject({ adminId: "a1", targetId: "u1", ipHash: "h" });
  });
});

describe("noteAdminSiteAccess", () => {
  it("records one entry per admin and site every 15 minutes", () => {
    const site = { id: "site-throttle", ownerId: "owner" };
    const now = Date.UTC(2026, 10, 16, 12);
    expect(noteAdminSiteAccess("admin-x", site, now)).toBe(true);
    expect(noteAdminSiteAccess("admin-x", site, now + 60_000)).toBe(false);
    expect(noteAdminSiteAccess("admin-y", site, now + 60_000)).toBe(true);
    expect(noteAdminSiteAccess("admin-x", site, now + 16 * 60_000)).toBe(true);
  });
});

describe("AuditReason", () => {
  it("requires a short reason", () => {
    expect(AuditReason.safeParse("  ").success).toBe(false);
    expect(AuditReason.safeParse("ok").success).toBe(false);
    expect(AuditReason.safeParse("Support ticket #12").success).toBe(true);
    expect(AuditReason.safeParse("x".repeat(301)).success).toBe(false);
  });
});
