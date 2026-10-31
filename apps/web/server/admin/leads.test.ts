import { describe, expect, it, vi } from "vitest";
import { countLeadsBySiteFromSupabase, leadsByOwner } from "./leads";

const config = { url: "https://example.supabase.co", key: "service-key" };

function rows(siteId: string, count: number) {
  return Array.from({ length: count }, () => ({ site_id: siteId }));
}

function pageResponse(body: unknown, total?: number) {
  return Response.json(body, {
    headers: total === undefined ? {} : { "Content-Range": `0-999/${total}` },
  });
}

describe("countLeadsBySiteFromSupabase", () => {
  it("conta numa chamada só quando cabe numa página, pedindo o total", async () => {
    const fetchImpl = vi.fn(async () => pageResponse([...rows("a", 2), ...rows("b", 1)], 3));
    const counts = await countLeadsBySiteFromSupabase(config, fetchImpl as unknown as typeof fetch);
    expect(Object.fromEntries(counts)).toEqual({ a: 2, b: 1 });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain("/rest/v1/leads?select=site_id&");
    expect(init.headers).toMatchObject({ Prefer: "count=exact" });
  });

  it("com o total, pede as outras páginas de uma vez (não uma depois da outra)", async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      const offset = Number(new URL(url).searchParams.get("offset"));
      if (offset === 0) return pageResponse(rows("a", 1000), 2500);
      if (offset === 1000) return pageResponse(rows("b", 1000));
      return pageResponse(rows("c", 500));
    });
    const counts = await countLeadsBySiteFromSupabase(config, fetchImpl as unknown as typeof fetch);
    expect(Object.fromEntries(counts)).toEqual({ a: 1000, b: 1000, c: 500 });
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it("repassa erro da API", async () => {
    const fetchImpl = vi.fn(async () => new Response("nope", { status: 500 }));
    await expect(
      countLeadsBySiteFromSupabase(config, fetchImpl as unknown as typeof fetch),
    ).rejects.toThrow(/500/);
  });
});

describe("leadsByOwner", () => {
  it("soma os pedidos dos sites de cada dono e ignora sites de visitante", () => {
    const totals = leadsByOwner(
      [
        { id: "s1", ownerId: "u1" },
        { id: "s2", ownerId: "u1" },
        { id: "s3", ownerId: null },
      ],
      new Map([
        ["s1", 2],
        ["s2", 3],
        ["s3", 9],
      ]),
    );
    expect(Object.fromEntries(totals)).toEqual({ u1: 5 });
  });
});
