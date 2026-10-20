import { PublishSiteResponse } from "@nosweat/schema";
import { fixtures } from "@nosweat/fixtures";
import { describe, expect, it } from "vitest";
import { getSiteStore } from "@/server/store";
import { POST as publish } from "../publish/route";
import { POST as unpublish } from "./route";

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
const post = () => new Request("http://localhost/api/x", { method: "POST" });

describe("POST /api/sites/[id]/unpublish", () => {
  it("takes the site offline but keeps its address and live copy for later", async () => {
    // Sem Supabase nos testes, quem está logado é o DEV_USER ("local-dev").
    const site = await getSiteStore().create(fixtures["joes-plumbing"], "local-dev");
    const published = PublishSiteResponse.parse(await (await publish(post(), ctx(site.id))).json());

    const res = await unpublish(post(), ctx(site.id));
    expect(res.status).toBe(200);
    const body = PublishSiteResponse.parse(await res.json());
    expect(body.status).toBe("draft");
    expect(body.url).toBe(published.url);

    const stored = await getSiteStore().get(site.id);
    expect(stored?.status).toBe("draft");
    expect(stored?.slug).toBeTruthy();
    expect(stored?.publishedSpec).toBeTruthy();

    // Publicar de novo volta ao mesmo endereço.
    const again = PublishSiteResponse.parse(await (await publish(post(), ctx(site.id))).json());
    expect(again.url).toBe(published.url);
  });

  it("returns 404 for someone else's site", async () => {
    const other = await getSiteStore().create(fixtures["glow-salon"], "someone-else");
    const res = await unpublish(post(), ctx(other.id));
    expect(res.status).toBe(404);
  });
});
