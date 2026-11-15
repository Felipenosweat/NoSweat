import { fixtures } from "@nosweat/fixtures";
import { beforeEach, describe, expect, it, vi } from "vitest";

// "Make it yours" da prévia pública: simula cookies e "ninguém logado" (nos outros testes, o
// login desligado faz todo mundo ser o DEV_USER).
const state = vi.hoisted(() => ({
  cookies: new Map<string, string>(),
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
  headers: async () => new Headers(),
}));

vi.mock("@/server/auth/session", () => ({
  DEV_USER: { id: "local-dev", email: "dev@localhost" },
  getCurrentUser: async () => state.user,
}));

const { POST: claim } = await import("./[token]/claim/route");
const { claimGuestSites, GUEST_COOKIE } = await import("@/server/guest");
const { buildProspectClaimEmail } = await import("@/server/notify/prospect-email");
const { isLikelyBot, recordPreviewView } = await import("@/server/prospects/claim");
const { MemoryProspectStore, getProspectStore } = await import("@/server/prospects/store");
const { getSiteStore } = await import("@/server/store");

const TOKEN = "tok_abcdefghijklmnopqrstuvwxyz012345";
const ADMIN_ID = "00000000-0000-4000-8000-0000000000ad";
let visitors = 0;

/** Novo visitante: sem cookie, sem conta. Cada um vem de um IP (limite por IP da rota). */
function newVisitor() {
  state.cookies.clear();
  state.user = null;
  visitors++;
}

function click(token = TOKEN) {
  return claim(
    new Request(`http://localhost:3000/p/${token}/claim`, {
      method: "POST",
      headers: { "x-forwarded-for": `198.51.100.${visitors}` },
    }),
    { params: Promise.resolve({ token }) },
  );
}

/** Id do site para onde o clique mandou (`/sites/<id>/edit`). */
function siteIdOf(res: Response): string {
  expect(res.status).toBe(303);
  const match = new URL(res.headers.get("location")!).pathname.match(/^\/sites\/([^/]+)\/edit$/);
  expect(match).not.toBeNull();
  return match![1]!;
}

/** Um prospect com prévia pronta (rascunho do admin + token). */
async function seedPreview() {
  const prospects = getProspectStore();
  await prospects.upsertMany([
    {
      placeId: "osm:node/1",
      name: "Lone Oak Plumbing",
      category: "Plumber",
      address: null,
      city: "Austin",
      state: "TX",
      phone: "(512) 555-0100",
      website: null,
      rating: null,
      reviewCount: null,
      hours: [],
      websiteStatus: "none",
      websiteNotes: null,
      email: null,
      search: "plumber in Austin, TX",
      lastFetchedAt: new Date().toISOString(),
    },
  ]);
  const [prospect] = await prospects.list();
  const site = await getSiteStore().create(fixtures["joes-plumbing"], ADMIN_ID);
  await prospects.update(prospect!.id, {
    siteId: site.id,
    previewToken: TOKEN,
    status: "preview_ready",
  });
  return { prospectId: prospect!.id, previewSiteId: site.id };
}

beforeEach(() => {
  new MemoryProspectStore().clear();
  newVisitor();
});

describe("POST /p/[token]/claim", () => {
  it("gives a visitor their own copy of the preview and opens the editor", async () => {
    const { prospectId, previewSiteId } = await seedPreview();
    const siteId = siteIdOf(await click());

    expect(siteId).not.toBe(previewSiteId);
    const copy = await getSiteStore().get(siteId);
    expect(copy).toMatchObject({ ownerId: null, guestId: state.cookies.get(GUEST_COOKIE) });
    // A prévia do admin fica como estava, e a cópia tem o mesmo conteúdo.
    const preview = await getSiteStore().get(previewSiteId);
    expect(preview?.ownerId).toBe(ADMIN_ID);
    expect(copy?.spec).toEqual(preview?.spec);

    const prospect = await getProspectStore().get(prospectId);
    expect(prospect?.claimedAt).toEqual(expect.any(String));
    expect(prospect?.status).toBe("replied");
  });

  it("reopens the same copy on a second click, also after the visitor signs up", async () => {
    await seedPreview();
    const first = siteIdOf(await click());
    expect(siteIdOf(await click())).toBe(first);

    state.user = { id: "00000000-0000-4000-8000-000000000001", email: "joe@example.com" };
    await claimGuestSites(state.user.id);
    expect(siteIdOf(await click())).toBe(first);
    expect((await getSiteStore().get(first))?.ownerId).toBe(state.user.id);
  });

  it("puts the copy in the account when the visitor is logged in", async () => {
    await seedPreview();
    state.user = { id: "00000000-0000-4000-8000-000000000002", email: "ana@example.com" };
    const copy = await getSiteStore().get(siteIdOf(await click()));
    expect(copy?.ownerId).toBe(state.user.id);
  });

  it("keeps a status the admin already moved forward", async () => {
    const { prospectId } = await seedPreview();
    await getProspectStore().update(prospectId, { status: "won" });
    siteIdOf(await click());
    expect((await getProspectStore().get(prospectId))?.status).toBe("won");
  });

  it("stops copying after 5 different people and sends the next one to /create", async () => {
    await seedPreview();
    const copies = new Set<string>();
    for (let i = 0; i < 5; i++) {
      newVisitor();
      copies.add(siteIdOf(await click()));
    }
    expect(copies.size).toBe(5);

    newVisitor();
    const res = await click();
    expect(res.status).toBe(303);
    expect(new URL(res.headers.get("location")!).pathname).toBe("/create");
  });

  it("is a 404 for an unknown token and for a business marked do not contact", async () => {
    const { prospectId } = await seedPreview();
    expect((await click("tok_unknownunknownunknownunknown00")).status).toBe(404);

    await getProspectStore().update(prospectId, { status: "do_not_contact" });
    expect((await click()).status).toBe(404);
  });
});

describe("preview views", () => {
  const BROWSER =
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";

  it("tells link previewers and crawlers from people", () => {
    expect(isLikelyBot(BROWSER)).toBe(false);
    for (const agent of [null, "", "WhatsApp/2.23.20.0", "Googlebot/2.1", "curl/8.4.0"]) {
      expect(isLikelyBot(agent)).toBe(true);
    }
  });

  it("counts a person opening the preview, and not a bot", async () => {
    const { prospectId } = await seedPreview();
    const store = getProspectStore();
    await recordPreviewView((await store.get(prospectId))!, "WhatsApp/2.23.20.0");
    expect((await store.get(prospectId))?.previewViews).toBe(0);

    await recordPreviewView((await store.get(prospectId))!, BROWSER);
    await recordPreviewView((await store.get(prospectId))!, BROWSER);
    const prospect = await store.get(prospectId);
    expect(prospect?.previewViews).toBe(2);
    expect(prospect?.previewLastViewedAt).toEqual(expect.any(String));
  });
});

describe("buildProspectClaimEmail", () => {
  it("names the business and gives the phone and the admin link", () => {
    const email = buildProspectClaimEmail({
      business: "Lone Oak\nPlumbing",
      phone: "(512) 555-0100",
      email: null,
      city: "Austin, TX",
      withAccount: false,
      appOrigin: "https://nosweatfd.com/",
    });
    expect(email.subject).toBe("Hot lead: Lone Oak Plumbing claimed their preview");
    expect(email.text).toContain("Phone: (512) 555-0100");
    expect(email.text).toContain("City: Austin, TX");
    expect(email.text).not.toContain("Email:");
    expect(email.text).toContain("https://nosweatfd.com/admin/prospects");
  });
});
