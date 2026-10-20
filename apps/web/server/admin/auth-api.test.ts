import { describe, expect, it, vi } from "vitest";
import { AuthAdminError, updateAuthUserAppMetadata } from "./auth-api";

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
