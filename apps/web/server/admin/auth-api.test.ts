import { describe, expect, it, vi } from "vitest";
import {
  AUTH_USERS_PER_PAGE,
  AuthAdminError,
  listAuthUsers,
  updateAuthUserAppMetadata,
} from "./auth-api";

const config = { url: "https://example.supabase.co", key: "service-key" };
const USER_ID = "6f1c2a3b-4d5e-4f60-8a9b-0c1d2e3f4a5b";

describe("updateAuthUserAppMetadata", () => {
  it("manda PUT /admin/users/{id} só com o app_metadata", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ id: USER_ID })));
    await updateAuthUserAppMetadata(
      config,
      USER_ID,
      { pending_guest_id: null },
      fetchImpl as unknown as typeof fetch,
    );
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(`https://example.supabase.co/auth/v1/admin/users/${USER_ID}`);
    expect(init.method).toBe("PUT");
    expect(JSON.parse(String(init.body))).toEqual({ app_metadata: { pending_guest_id: null } });
  });

  it("recusa id que não é UUID e repassa o erro da API", async () => {
    const fetchImpl = vi.fn(
      async () => new Response(JSON.stringify({ msg: "User not found" }), { status: 404 }),
    );
    await expect(
      updateAuthUserAppMetadata(config, "nope", {}, fetchImpl as unknown as typeof fetch),
    ).rejects.toThrow("Invalid user id");
    await expect(
      updateAuthUserAppMetadata(config, USER_ID, {}, fetchImpl as unknown as typeof fetch),
    ).rejects.toBeInstanceOf(AuthAdminError);
  });
});

describe("listAuthUsers", () => {
  const user = (n: number) => ({ id: `user-${n}`, email: `u${n}@example.com` });
  const page = (from: number, count: number, total?: number) =>
    new Response(
      JSON.stringify({ users: Array.from({ length: count }, (_, i) => user(from + i)) }),
      { headers: total === undefined ? {} : { "X-Total-Count": String(total) } },
    );

  it("pede 1000 por página e para numa chamada quando todas cabem", async () => {
    const fetchImpl = vi.fn(async () => page(0, 3, 3));
    const users = await listAuthUsers(config, fetchImpl as unknown as typeof fetch);
    expect(users).toHaveLength(3);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url] = fetchImpl.mock.calls[0] as unknown as [string];
    expect(url).toBe(
      `https://example.supabase.co/auth/v1/admin/users?page=1&per_page=${AUTH_USERS_PER_PAGE}`,
    );
  });

  it("segue para as próximas páginas até chegar ao total", async () => {
    // A API pode devolver menos que o pedido por página: o total do cabeçalho manda.
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(page(0, 2, 5))
      .mockResolvedValueOnce(page(2, 2, 5))
      .mockResolvedValueOnce(page(4, 1, 5));
    const users = await listAuthUsers(config, fetchImpl as unknown as typeof fetch);
    expect(users.map((u) => u.id)).toEqual(["user-0", "user-1", "user-2", "user-3", "user-4"]);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    const [last] = fetchImpl.mock.calls[2] as unknown as [string];
    expect(last).toContain("page=3&");
  });

  it("sem o total, para na primeira página incompleta", async () => {
    const fetchImpl = vi.fn(async () => page(0, 10));
    expect(await listAuthUsers(config, fetchImpl as unknown as typeof fetch)).toHaveLength(10);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});
