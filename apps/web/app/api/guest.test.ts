import { fixtures } from "@nosweat/fixtures";
import { ApiError, GenerateSiteResponse, GetSiteResponse } from "@nosweat/schema";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Visitante sem conta: simula cookies, IP e "ninguém logado" (nos outros testes, o login
// desligado faz todo mundo ser o DEV_USER).
const state = vi.hoisted(() => ({
  cookies: new Map<string, string>(),
  ip: "203.0.113.1",
  user: null as { id: string; email: string | null } | null,
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      state.cookies.has(name) ? { name, value: state.cookies.get(name) } : undefined,
    set: (name: string, value: string) => {
      state.cookies.set(name, value);
    },
    delete: (name: string) => {
      state.cookies.delete(name);
    },
  }),
  headers: async () => new Headers({ "x-real-ip": state.ip }),
}));

vi.mock("@/server/auth/session", () => ({
  DEV_USER: { id: "local-dev", email: "dev@localhost" },
  getCurrentUser: async () => state.user,
}));

// A IA de mentira responde na hora (o mock de verdade espera 1,5 s).
vi.mock("@/server/ai", () => ({
  getSiteGenerator: () => ({}),
  generateSiteSpec: async () => fixtures["joes-plumbing"],
  editSiteSpec: async () => ({ summary: "Done.", spec: fixtures["joes-plumbing"] }),
}));

const { POST: generate } = await import("./sites/generate/route");
const { GET: getSite, PATCH: patchSite } = await import("./sites/[id]/route");
const { POST: publish } = await import("./sites/[id]/publish/route");
const { claimGuestSites, GUEST_COOKIE } = await import("@/server/guest");
const { getSiteStore } = await import("@/server/store");

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

function generateRequest() {
  return new Request("http://localhost/api/sites/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ brief: "House cleaning company in Orlando, FL" }),
  });
}

/** Novo visitante: sem cookie, IP próprio. */
function newVisitor(ip: string) {
  state.cookies.clear();
  state.user = null;
  state.ip = ip;
}

beforeEach(() => newVisitor("203.0.113.1"));

describe("guest mode (build before creating an account)", () => {
  it("lets a visitor without an account generate a site, kept under a guest cookie", async () => {
    newVisitor("198.51.100.1");
    const res = await generate(generateRequest());
    expect(res.status).toBe(201);
    const { siteId } = GenerateSiteResponse.parse(await res.json());

    const guestId = state.cookies.get(GUEST_COOKIE);
    expect(guestId).toBeTruthy();
    const site = await getSiteStore().get(siteId);
    expect(site).toMatchObject({ ownerId: null, guestId });

    const read = await getSite(new Request("http://localhost/x"), ctx(siteId));
    expect(read.status).toBe(200);
    expect(GetSiteResponse.parse(await read.json()).siteId).toBe(siteId);
  });

  it("hides a guest's site from other visitors and requires an account to publish", async () => {
    newVisitor("198.51.100.2");
    const { siteId } = GenerateSiteResponse.parse(await (await generate(generateRequest())).json());

    expect((await publish(new Request("http://localhost/x"), ctx(siteId))).status).toBe(401);

    newVisitor("198.51.100.3");
    state.cookies.set(GUEST_COOKIE, crypto.randomUUID());
    expect((await getSite(new Request("http://localhost/x"), ctx(siteId))).status).toBe(404);
    const patch = await patchSite(
      new Request("http://localhost/x", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spec: fixtures["glow-salon"] }),
      }),
      ctx(siteId),
    );
    expect(patch.status).toBe(404);
  });

  it("limits free generations per visitor and per IP", async () => {
    newVisitor("198.51.100.4");
    expect((await generate(generateRequest())).status).toBe(201);
    expect((await generate(generateRequest())).status).toBe(201);
    const third = await generate(generateRequest());
    expect(third.status).toBe(429);
    const body = ApiError.parse(await third.json());
    expect(body.error.code).toBe("quota_exceeded");
    expect(body.error.message).toMatch(/free account/);

    // Apagar o cookie não zera: o mesmo IP tem limite próprio (4 por dia).
    state.cookies.clear();
    expect((await generate(generateRequest())).status).toBe(201);
    expect((await generate(generateRequest())).status).toBe(201);
    state.cookies.clear();
    expect((await generate(generateRequest())).status).toBe(429);
  });

  it("does not let a burst of parallel requests slip past the limit", async () => {
    newVisitor("198.51.100.6");
    state.cookies.set(GUEST_COOKIE, crypto.randomUUID());
    const responses = await Promise.all(
      Array.from({ length: 6 }, () => generate(generateRequest())),
    );
    const created = responses.filter((res) => res.status === 201).length;
    expect(created).toBeLessThanOrEqual(2);
  });

  it("moves the visitor's sites into the account on sign-in", async () => {
    newVisitor("198.51.100.5");
    const { siteId } = GenerateSiteResponse.parse(await (await generate(generateRequest())).json());

    const userId = crypto.randomUUID();
    expect(await claimGuestSites(userId)).toBe(1);
    expect(state.cookies.has(GUEST_COOKIE)).toBe(false);
    expect(await getSiteStore().get(siteId)).toMatchObject({ ownerId: userId, guestId: null });

    state.user = { id: userId, email: "owner@example.com" };
    expect((await getSite(new Request("http://localhost/x"), ctx(siteId))).status).toBe(200);
    expect(await claimGuestSites(userId)).toBe(0);
  });
});
