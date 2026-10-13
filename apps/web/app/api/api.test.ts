import {
  ApiError,
  CreditsResponse,
  GenerateSiteResponse,
  GetSiteResponse,
  UpdateSiteResponse,
} from "@nosweat/schema";
import { fixtures } from "@nosweat/fixtures";
import { describe, expect, it } from "vitest";
import { getSiteStore } from "@/server/store";
import { GET as getCredits } from "./me/credits/route";
import { POST as publish } from "./sites/[id]/publish/route";
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
  it.each([
    ["regenerate-section", regenerateSection],
    ["publish", publish],
  ])("%s returns 501", async (_name, handler) => {
    const res = await handler();
    expect(res.status).toBe(501);
    expect(ApiError.parse(await res.json()).error.code).toBe("not_implemented");
  });
});

describe("GET /api/me/credits", () => {
  it("returns the mock credits", async () => {
    const res = await getCredits();
    expect(CreditsResponse.parse(await res.json())).toEqual({ remaining: 10, plan: "trial" });
  });
});
