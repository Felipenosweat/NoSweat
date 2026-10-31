import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type * as NextServer from "next/server";
import { MemoryProspectStore } from "@/server/prospects/store";

// A página pública precisa de um request do Next para `connection()`: nos testes, nada a esperar.
vi.mock("next/server", async (importOriginal) => {
  const actual = await importOriginal<typeof NextServer>();
  return { ...actual, connection: async () => undefined };
});

import ProspectPreviewPage from "@/app/p/[token]/page";
import { POST as createPreviewRoute } from "./[id]/preview/route";
import { GET as exportRoute } from "./export/route";
import { GET as listRoute } from "./route";
import { POST as searchRoute } from "./search/route";
import { POST as statusRoute } from "./status/route";

const BASE = "http://localhost:3000/api/admin/prospects";
const json = (body: unknown) =>
  new Request(`${BASE}/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  new MemoryProspectStore().clear();
});
afterEach(() => {
  delete process.env.DEV_ADMIN;
});

describe("admin-only prospect routes", () => {
  it("answer 404 (in the standard error format) to non-admins", async () => {
    const responses = await Promise.all([
      listRoute(),
      searchRoute(json({ trade: "plumber", city: "Austin", state: "TX" })),
      statusRoute(json({ ids: ["00000000-0000-4000-8000-000000000001"], status: "contacted" })),
      exportRoute(new Request(`${BASE}/export?kind=email`)),
      createPreviewRoute(new Request(`${BASE}/x/preview`, { method: "POST" }), {
        params: Promise.resolve({ id: "00000000-0000-4000-8000-000000000001" }),
      }),
    ]);
    for (const res of responses) {
      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({
        error: { code: "not_found", message: "Page not found." },
      });
    }
  });

  it("let an admin search, create a preview and export", async () => {
    process.env.DEV_ADMIN = "true";
    const search = await searchRoute(json({ trade: "plumber", city: "Austin", state: "tx" }));
    expect(search.status).toBe(200);
    expect(await search.json()).toMatchObject({ query: "plumber in Austin, TX", source: "mock" });

    const list = (await (await listRoute()).json()) as {
      prospects: { id: string; email: string | null }[];
    };
    const withEmail = list.prospects.find((p) => p.email)!;
    const preview = await createPreviewRoute(new Request(`${BASE}/x/preview`, { method: "POST" }), {
      params: Promise.resolve({ id: withEmail.id }),
    });
    expect(preview.status).toBe(200);
    const body = (await preview.json()) as { prospect: { previewPath: string } };
    expect(body.prospect.previewPath).toMatch(/^\/p\/[A-Za-z0-9_-]{32}$/);

    const csv = await (await exportRoute(new Request(`${BASE}/export?kind=email`))).text();
    expect(csv.split("\r\n")[0]).toBe("email,business,trade,city,state,preview_url,website_status");
    expect(csv).toContain(`http://localhost:3000${body.prospect.previewPath}`);

    const bad = await searchRoute(json({ trade: "x", city: "", state: "Texas" }));
    expect(bad.status).toBe(400);
  });
});

describe("/p/[token]", () => {
  it("is a 404 for an unknown or malformed token", async () => {
    for (const token of ["nope", "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"]) {
      await expect(ProspectPreviewPage({ params: Promise.resolve({ token }) })).rejects.toThrow(
        /NEXT_HTTP_ERROR_FALLBACK;404|NEXT_NOT_FOUND/,
      );
    }
  });
});
