import {
  ApiError,
  CreditsResponse,
  DomainResponse,
  AiEditResponse,
  LeadsResponse,
  VersionsResponse,
  PublishSiteResponse,
  GenerateSiteResponse,
  GetSiteResponse,
  UpdateSiteResponse,
} from "@nosweat/schema";
import { fixtures } from "@nosweat/fixtures";
import { describe, expect, it } from "vitest";
import { getSiteStore } from "@/server/store";
import { GET as getCredits } from "./me/credits/route";
import {
  DELETE as deleteDomain,
  GET as getDomain,
  PUT as putDomain,
} from "./sites/[id]/domain/route";
import { POST as aiEdit } from "./sites/[id]/ai-edit/route";
import { GET as listLeads, POST as sendLead } from "./sites/[id]/leads/route";
import { POST as publish } from "./sites/[id]/publish/route";
import { POST as restoreVersion } from "./sites/[id]/versions/[versionId]/restore/route";
import { GET as listVersions } from "./sites/[id]/versions/route";
import { POST as regenerateSection } from "./sites/[id]/regenerate-section/route";
import { GET as getSite, PATCH as patchSite } from "./sites/[id]/route";
import { POST as generate } from "./sites/generate/route";

const BASE = "http://localhost/api";

function jsonRequest(path: string, method: string, body: unknown): Request {
  return new Request(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

async function generateSite(brief: string) {
  const res = await generate(jsonRequest("/sites/generate", "POST", { brief }));
  expect(res.status).toBe(201);
  return GenerateSiteResponse.parse(await res.json());
}

describe("POST /api/sites/generate", () => {
  it("returns a valid SiteSpec using the mock generator", async () => {
    const { siteId, spec } = await generateSite("plumbing company in Austin");
    expect(siteId).toBeTruthy();
    expect(spec.template).toBe("home-services");
    expect(spec.business.name).toBe("Joe's Plumbing");
  });

  it("rejects a brief that is too short", async () => {
    const res = await generate(jsonRequest("/sites/generate", "POST", { brief: "hi" }));
    expect(res.status).toBe(400);
    expect(ApiError.parse(await res.json()).error.code).toBe("invalid_request");
  });

  it("rejects a body that is not JSON", async () => {
    const res = await generate(
      new Request(`${BASE}/sites/generate`, { method: "POST", body: "{nope" }),
    );
    expect(res.status).toBe(400);
    expect(ApiError.parse(await res.json()).error.code).toBe("invalid_request");
  });
});

describe("GET /api/sites/[id]", () => {
  it("returns 404 in the error format for an unknown id", async () => {
    const res = await getSite(new Request(`${BASE}/sites/does-not-exist`), ctx("does-not-exist"));
    expect(res.status).toBe(404);
    const body = ApiError.parse(await res.json());
    expect(body.error.code).toBe("not_found");
  });

  it("returns 404 for a site owned by someone else", async () => {
    const other = await getSiteStore().create(fixtures["glow-salon"], "someone-else");
    const res = await getSite(new Request(`${BASE}/sites/${other.id}`), ctx(other.id));
    expect(res.status).toBe(404);
    expect(ApiError.parse(await res.json()).error.code).toBe("not_found");

    const patch = await patchSite(
      jsonRequest(`/sites/${other.id}`, "PATCH", { spec: fixtures["glow-salon"] }),
      ctx(other.id),
    );
    expect(patch.status).toBe(404);
  });

  it("returns a generated site", async () => {
    const { siteId } = await generateSite("hair salon in Miami");
    const res = await getSite(new Request(`${BASE}/sites/${siteId}`), ctx(siteId));
    expect(res.status).toBe(200);
    const body = GetSiteResponse.parse(await res.json());
    expect(body.status).toBe("draft");
    expect(body.spec.business.name).toBe("Glow Salon");
  });
});

describe("PATCH /api/sites/[id]", () => {
  it("updates the spec", async () => {
    const { siteId, spec } = await generateSite("restaurant in San Diego");
    const updated = { ...spec, business: { ...spec.business, name: "Rosa's Cocina" } };
    const res = await patchSite(
      jsonRequest(`/sites/${siteId}`, "PATCH", { spec: updated }),
      ctx(siteId),
    );
    expect(res.status).toBe(200);
    expect(UpdateSiteResponse.parse(await res.json()).spec.business.name).toBe("Rosa's Cocina");
  });

  it("rejects an invalid spec", async () => {
    const { siteId } = await generateSite("plumbing company in Austin");
    const res = await patchSite(
      jsonRequest(`/sites/${siteId}`, "PATCH", { spec: { version: 1 } }),
      ctx(siteId),
    );
    expect(res.status).toBe(400);
    expect(ApiError.parse(await res.json()).error.code).toBe("invalid_request");
  });
});

describe("not implemented yet", () => {
  it("regenerate-section returns 501", async () => {
    const res = await regenerateSection();
    expect(res.status).toBe(501);
    expect(ApiError.parse(await res.json()).error.code).toBe("not_implemented");
  });
});

/** Cria um site direto no store (sem os 1,5 s do mock) para o DEV_USER. */
async function ownSite() {
  return getSiteStore().create(fixtures["joes-plumbing"], "local-dev");
}

describe("POST /api/sites/[id]/publish", () => {
  it("publishes the site at a free /s/<slug> address", async () => {
    const site = await ownSite();
    const res = await publish(jsonRequest(`/sites/${site.id}/publish`, "POST", {}), ctx(site.id));
    expect(res.status).toBe(200);
    const body = PublishSiteResponse.parse(await res.json());
    expect(body.status).toBe("published");
    expect(body.url).toMatch(/^http:\/\/localhost\/s\/joes-plumbing-[a-f0-9]{6}$/);

    const slug = body.url.split("/s/")[1] ?? "";
    expect((await getSiteStore().getBySlug(slug))?.id).toBe(site.id);
  });

  it("keeps the same slug when publishing again", async () => {
    const site = await ownSite();
    const first = PublishSiteResponse.parse(
      await (await publish(jsonRequest(`/x`, "POST", {}), ctx(site.id))).json(),
    );
    const second = PublishSiteResponse.parse(
      await (await publish(jsonRequest(`/x`, "POST", {}), ctx(site.id))).json(),
    );
    expect(second.url).toBe(first.url);
  });

  it("returns 404 for someone else's site", async () => {
    const other = await getSiteStore().create(fixtures["glow-salon"], "someone-else");
    const res = await publish(jsonRequest(`/x`, "POST", {}), ctx(other.id));
    expect(res.status).toBe(404);
  });
});

describe("/api/sites/[id]/domain", () => {
  it("connects a domain (manual mode without VERCEL_TOKEN) and returns the DNS records", async () => {
    const site = await ownSite();
    const res = await putDomain(
      jsonRequest(`/sites/${site.id}/domain`, "PUT", {
        domain: "https://www.JoesPlumbingATX.com/",
      }),
      ctx(site.id),
    );
    expect(res.status).toBe(200);
    const body = DomainResponse.parse(await res.json());
    expect(body).toMatchObject({ domain: "joesplumbingatx.com", status: "manual" });
    expect(body.records.map((r) => r.type)).toEqual(["A", "CNAME"]);

    const state = DomainResponse.parse(
      await (await getDomain(new Request(`${BASE}/x`), ctx(site.id))).json(),
    );
    expect(state.domain).toBe("joesplumbingatx.com");
  });

  it("rejects an invalid domain and the platform's own domain", async () => {
    const site = await ownSite();
    for (const domain of ["not a domain", "nosweatfd.com"]) {
      const res = await putDomain(jsonRequest(`/x`, "PUT", { domain }), ctx(site.id));
      expect(res.status).toBe(400);
      expect(ApiError.parse(await res.json()).error.code).toBe("invalid_request");
    }
  });

  it("does not let two sites use the same domain", async () => {
    const a = await ownSite();
    const b = await ownSite();
    await putDomain(jsonRequest(`/x`, "PUT", { domain: "shared-domain.com" }), ctx(a.id));
    const res = await putDomain(
      jsonRequest(`/x`, "PUT", { domain: "shared-domain.com" }),
      ctx(b.id),
    );
    expect(res.status).toBe(409);
    expect(ApiError.parse(await res.json()).error.code).toBe("domain_taken");
  });

  it("disconnects the domain", async () => {
    const site = await ownSite();
    await putDomain(jsonRequest(`/x`, "PUT", { domain: "remove-me.com" }), ctx(site.id));
    const res = await deleteDomain(new Request(`${BASE}/x`, { method: "DELETE" }), ctx(site.id));
    expect(DomainResponse.parse(await res.json())).toMatchObject({ domain: null, status: null });
  });
});

describe("GET /api/me/credits", () => {
  it("returns the mock credits", async () => {
    const res = await getCredits();
    expect(CreditsResponse.parse(await res.json())).toMatchObject({ plan: "trial" });
  });
});

describe("platform admins", () => {
  it("can open any client's site (DEV_ADMIN=true without Supabase)", async () => {
    const other = await getSiteStore().create(fixtures["glow-salon"], "someone-else");
    process.env.DEV_ADMIN = "true";
    try {
      const res = await getSite(new Request(`${BASE}/sites/${other.id}`), ctx(other.id));
      expect(res.status).toBe(200);
    } finally {
      delete process.env.DEV_ADMIN;
    }
  });
});

describe("/api/sites/[id]/leads", () => {
  const lead = { name: "Maria", phone: "(512) 555-0199", message: "Water heater is leaking." };

  it("accepts a lead on a published site and lists it for the owner", async () => {
    const site = await ownSite();
    await publish(jsonRequest(`/x`, "POST", {}), ctx(site.id));

    const res = await sendLead(jsonRequest(`/x`, "POST", lead), ctx(site.id));
    expect(res.status).toBe(201);

    const list = LeadsResponse.parse(
      await (await listLeads(new Request(`${BASE}/x`), ctx(site.id))).json(),
    );
    expect(list.leads).toHaveLength(1);
    expect(list.leads[0]).toMatchObject({ name: "Maria", phone: "(512) 555-0199", email: null });
  });

  it("does not accept leads on a draft site", async () => {
    const site = await ownSite();
    const res = await sendLead(jsonRequest(`/x`, "POST", lead), ctx(site.id));
    expect(res.status).toBe(404);
  });

  it("rejects bots that fill the honeypot", async () => {
    const site = await ownSite();
    await publish(jsonRequest(`/x`, "POST", {}), ctx(site.id));
    const res = await sendLead(
      jsonRequest(`/x`, "POST", { ...lead, company: "Spam Inc" }),
      ctx(site.id),
    );
    expect(res.status).toBe(400);
  });

  it("does not show leads of someone else's site", async () => {
    const other = await getSiteStore().create(fixtures["glow-salon"], "someone-else");
    const res = await listLeads(new Request(`${BASE}/x`), ctx(other.id));
    expect(res.status).toBe(404);
  });
});

describe("drafts, publishing and versions", () => {
  const rename = (spec: (typeof fixtures)["joes-plumbing"], name: string) => ({
    ...spec,
    business: { ...spec.business, name },
  });

  it("keeps the live site unchanged until the owner publishes again", async () => {
    const site = await ownSite();
    await publish(jsonRequest(`/x`, "POST", {}), ctx(site.id));

    const edited = rename(site.spec, "Joe's Plumbing & Drains");
    await patchSite(jsonRequest(`/x`, "PATCH", { spec: edited }), ctx(site.id));

    let state = GetSiteResponse.parse(
      await (await getSite(new Request(`${BASE}/x`), ctx(site.id))).json(),
    );
    expect(state.spec.business.name).toBe("Joe's Plumbing & Drains");
    expect(state.publishedSpec?.business.name).toBe("Joe's Plumbing");
    expect(state.hasUnpublishedChanges).toBe(true);

    await publish(jsonRequest(`/x`, "POST", {}), ctx(site.id));
    state = GetSiteResponse.parse(
      await (await getSite(new Request(`${BASE}/x`), ctx(site.id))).json(),
    );
    expect(state.publishedSpec?.business.name).toBe("Joe's Plumbing & Drains");
    expect(state.hasUnpublishedChanges).toBe(false);
  });

  it("records every save and restores an older version into the draft", async () => {
    const site = await ownSite();
    await patchSite(
      jsonRequest(`/x`, "PATCH", { spec: rename(site.spec, "Second name") }),
      ctx(site.id),
    );

    const { versions } = VersionsResponse.parse(
      await (await listVersions(new Request(`${BASE}/x`), ctx(site.id))).json(),
    );
    expect(versions.map((v) => v.source)).toEqual(["edit", "generate"]);

    const original = versions[1];
    if (!original) throw new Error("missing version");
    const res = await restoreVersion(new Request(`${BASE}/x`, { method: "POST" }), {
      params: Promise.resolve({ id: site.id, versionId: original.id }),
    });
    expect(res.status).toBe(200);
    expect(UpdateSiteResponse.parse(await res.json()).spec.business.name).toBe("Joe's Plumbing");

    const after = VersionsResponse.parse(
      await (await listVersions(new Request(`${BASE}/x`), ctx(site.id))).json(),
    );
    expect(after.versions[0]?.source).toBe("restore");
  });
});

describe("POST /api/sites/[id]/ai-edit", () => {
  it("applies the request to the draft and records an ai_edit version", async () => {
    const site = await ownSite();
    const res = await aiEdit(
      jsonRequest(`/x`, "POST", { instruction: "Change my hours to Mon–Sat 8 AM to 6 PM" }),
      ctx(site.id),
    );
    expect(res.status).toBe(200);
    const body = AiEditResponse.parse(await res.json());
    expect(body.summary).toMatch(/Demo mode/);

    const { versions } = VersionsResponse.parse(
      await (await listVersions(new Request(`${BASE}/x`), ctx(site.id))).json(),
    );
    expect(versions[0]?.source).toBe("ai_edit");
  });

  it("returns 404 for someone else's site", async () => {
    const other = await getSiteStore().create(fixtures["glow-salon"], "someone-else");
    const res = await aiEdit(
      jsonRequest(`/x`, "POST", { instruction: "Make it blue" }),
      ctx(other.id),
    );
    expect(res.status).toBe(404);
  });

  it("stops at the daily limit with quota_exceeded", async () => {
    const site = await ownSite();
    const previous = process.env.AI_DAILY_EDITS;
    // O DEV_USER já usou a IA nos testes acima; com limite 1 o próximo pedido passa do limite.
    process.env.AI_DAILY_EDITS = "1";
    try {
      const res = await aiEdit(
        jsonRequest(`/x`, "POST", { instruction: "Make it blue" }),
        ctx(site.id),
      );
      expect(res.status).toBe(429);
      expect(ApiError.parse(await res.json()).error.code).toBe("quota_exceeded");
    } finally {
      process.env.AI_DAILY_EDITS = previous;
    }
  });
});
