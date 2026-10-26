import { ApiError, ReviewLinkResponse } from "@nosweat/schema";
import { fixtures } from "@nosweat/fixtures";
import { describe, expect, it } from "vitest";
import { getSiteStore } from "@/server/store";
import { POST as publish } from "../publish/route";
import { PUT } from "./route";

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
const put = (body: unknown) =>
  new Request("http://localhost/api/x", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
const post = () => new Request("http://localhost/api/x", { method: "POST" });

const LINK = "https://g.page/r/CbX1ab2Cd3EfEAI/review";

describe("PUT /api/sites/[id]/review-link", () => {
  it("salva no rascunho (com versão) e não mexe no site no ar de um rascunho", async () => {
    // Sem Supabase nos testes, quem está logado é o DEV_USER ("local-dev").
    const store = getSiteStore();
    const site = await store.create(fixtures["joes-plumbing"], "local-dev");
    const versionsBefore = (await store.listVersions(site.id)).length;

    const res = await PUT(put({ url: LINK }), ctx(site.id));
    expect(res.status).toBe(200);
    const body = ReviewLinkResponse.parse(await res.json());
    expect(body).toMatchObject({ siteId: site.id, googleReviewUrl: LINK, live: false });

    const stored = await store.get(site.id);
    expect(stored?.spec.business.googleReviewUrl).toBe(LINK);
    expect(stored?.publishedSpec).toBeNull();
    const versions = await store.listVersions(site.id);
    expect(versions).toHaveLength(versionsBefore + 1);
    expect(versions[0]?.source).toBe("edit");

    // Mesmo link de novo: nada muda (nenhuma versão nova).
    await PUT(put({ url: LINK }), ctx(site.id));
    expect(await store.listVersions(site.id)).toHaveLength(versionsBefore + 1);
  });

  it("no site publicado, põe SÓ o link na versão no ar (o resto do rascunho espera)", async () => {
    const store = getSiteStore();
    const site = await store.create(fixtures["glow-salon"], "local-dev");
    expect((await publish(post(), ctx(site.id))).status).toBe(200);

    // Uma mudança no rascunho que ainda não foi publicada.
    const draft = await store.get(site.id);
    if (!draft) throw new Error("site not found");
    await store.update(
      site.id,
      { ...draft.spec, business: { ...draft.spec.business, name: "Unpublished Name" } },
      "edit",
    );

    const res = await PUT(put({ url: LINK }), ctx(site.id));
    expect(res.status).toBe(200);
    expect(ReviewLinkResponse.parse(await res.json()).live).toBe(true);

    const stored = await store.get(site.id);
    expect(stored?.spec.business.googleReviewUrl).toBe(LINK);
    expect(stored?.spec.business.name).toBe("Unpublished Name");
    expect(stored?.publishedSpec?.business.googleReviewUrl).toBe(LINK);
    expect(stored?.publishedSpec?.business.name).toBe(fixtures["glow-salon"].business.name);
    expect(stored?.status).toBe("published");

    // null tira o link dos dois.
    const removed = await PUT(put({ url: null }), ctx(site.id));
    expect(ReviewLinkResponse.parse(await removed.json()).googleReviewUrl).toBeNull();
    const after = await store.get(site.id);
    expect(after?.spec.business).not.toHaveProperty("googleReviewUrl");
    expect(after?.publishedSpec?.business).not.toHaveProperty("googleReviewUrl");
  });

  it("recusa um link que não é de avaliações do Google", async () => {
    const site = await getSiteStore().create(fixtures["joes-plumbing"], "local-dev");
    for (const url of ["https://evil.example/review", "http://g.page/r/x/review", "not a url"]) {
      const res = await PUT(put({ url }), ctx(site.id));
      expect(res.status).toBe(400);
      expect(ApiError.parse(await res.json()).error.code).toBe("invalid_request");
    }
    expect((await getSiteStore().get(site.id))?.spec.business.googleReviewUrl).toBeUndefined();
  });

  it("returns 404 for someone else's site", async () => {
    const other = await getSiteStore().create(fixtures["glow-salon"], "someone-else");
    const res = await PUT(put({ url: LINK }), ctx(other.id));
    expect(res.status).toBe(404);
    expect((await getSiteStore().get(other.id))?.spec.business.googleReviewUrl).toBeUndefined();
  });
});
