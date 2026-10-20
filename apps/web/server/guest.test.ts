import { fixtures } from "@nosweat/fixtures";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Cadastro ainda sem e-mail confirmado: os sites ficam com o visitante e o id dele fica
// guardado na conta (app_metadata), para passar quando o e-mail for confirmado.
const state = vi.hoisted(() => ({
  cookies: new Map<string, string>(),
  config: { url: "https://example.supabase.co", key: "service-key" } as {
    url: string;
    key: string;
  } | null,
  updates: [] as Array<{ id: string; patch: Record<string, unknown> }>,
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
}));

vi.mock("./admin/auth-api", () => ({
  serviceConfig: () => state.config,
  updateAuthUserAppMetadata: async (
    _config: unknown,
    id: string,
    patch: Record<string, unknown>,
  ) => {
    state.updates.push({ id, patch });
  },
}));

const { GUEST_COOKIE, PENDING_GUEST_KEY, claimGuestSitesForUser, rememberGuestForSignup } =
  await import("./guest");
const { getSiteStore } = await import("./store");

beforeEach(() => {
  state.cookies.clear();
  state.updates = [];
  state.config = { url: "https://example.supabase.co", key: "service-key" };
});

describe("rememberGuestForSignup", () => {
  it("guarda o id do visitante na conta sem mexer nos sites nem no cookie", async () => {
    const guestId = crypto.randomUUID();
    state.cookies.set(GUEST_COOKIE, guestId);
    const site = await getSiteStore().create(fixtures["joes-plumbing"], { guestId });
    const userId = crypto.randomUUID();

    await rememberGuestForSignup(userId);

    expect(state.updates).toEqual([{ id: userId, patch: { [PENDING_GUEST_KEY]: guestId } }]);
    expect(state.cookies.get(GUEST_COOKIE)).toBe(guestId);
    expect(await getSiteStore().get(site.id)).toMatchObject({ ownerId: null, guestId });
  });

  it("não faz nada sem cookie de visitante ou sem a chave secreta", async () => {
    await rememberGuestForSignup(crypto.randomUUID());
    state.cookies.set(GUEST_COOKIE, crypto.randomUUID());
    state.config = null;
    await rememberGuestForSignup(crypto.randomUUID());
    expect(state.updates).toEqual([]);
  });
});

describe("claimGuestSitesForUser", () => {
  it("passa os sites guardados no cadastro (outro aparelho) e apaga a chave", async () => {
    const guestId = crypto.randomUUID();
    const site = await getSiteStore().create(fixtures["joes-plumbing"], { guestId });
    const userId = crypto.randomUUID();

    await claimGuestSitesForUser({ id: userId, app_metadata: { [PENDING_GUEST_KEY]: guestId } });

    expect(await getSiteStore().get(site.id)).toMatchObject({ ownerId: userId, guestId: null });
    expect(state.updates).toEqual([{ id: userId, patch: { [PENDING_GUEST_KEY]: null } }]);
  });

  it("passa os sites do cookie deste navegador e ignora id inválido", async () => {
    const guestId = crypto.randomUUID();
    state.cookies.set(GUEST_COOKIE, guestId);
    const site = await getSiteStore().create(fixtures["joes-plumbing"], { guestId });
    const userId = crypto.randomUUID();

    await claimGuestSitesForUser({ id: userId, app_metadata: { [PENDING_GUEST_KEY]: "nope" } });

    expect(await getSiteStore().get(site.id)).toMatchObject({ ownerId: userId, guestId: null });
    expect(state.cookies.has(GUEST_COOKIE)).toBe(false);
    expect(state.updates).toEqual([]);
  });
});
