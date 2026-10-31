import { ApiError } from "@nosweat/schema";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OnboardingResponse, TOUR_METADATA_KEY } from "@/lib/onboarding";

// Simula a sessão do Supabase: quem está logado, as claims do token e o cliente do Supabase
// (nos outros testes o login fica desligado e todo mundo é o DEV_USER).
const state = vi.hoisted(() => ({
  user: { id: "user-1", email: "owner@example.com" } as { id: string; email: string | null } | null,
  claims: null as Record<string, unknown> | null,
  /** `false` = sem Supabase configurado (dev local). */
  supabase: true,
  updateError: null as { message: string } | null,
  updates: [] as unknown[],
  refreshes: 0,
}));

vi.mock("@/server/auth/session", () => ({
  DEV_USER: { id: "local-dev", email: "dev@localhost" },
  getCurrentUser: async () => state.user,
  getSessionClaims: async () => state.claims,
  createSupabaseServerClient: async () =>
    state.supabase
      ? {
          auth: {
            updateUser: async (attributes: unknown) => {
              state.updates.push(attributes);
              return { data: { user: state.updateError ? null : {} }, error: state.updateError };
            },
            refreshSession: async () => {
              state.refreshes += 1;
              return { data: {}, error: null };
            },
          },
        }
      : null,
}));

const { POST } = await import("./route");

function request(body: unknown = { tour: "done" }, contentType = "application/json") {
  return new Request("http://localhost/api/me/onboarding", {
    method: "POST",
    headers: { "Content-Type": contentType },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  state.user = { id: "user-1", email: "owner@example.com" };
  state.claims = { sub: "user-1", user_metadata: { first_name: "Ana" } };
  state.supabase = true;
  state.updateError = null;
  state.updates = [];
  state.refreshes = 0;
});

describe("POST /api/me/onboarding", () => {
  it("saves the date on the account's user_metadata and refreshes the session", async () => {
    const res = await POST(request());
    expect(res.status).toBe(200);
    const body = OnboardingResponse.parse(await res.json());
    expect(body.stored).toBe("account");
    expect(Number.isNaN(Date.parse(body.doneAt))).toBe(false);
    // Só a chave do tour: o resto do perfil é juntado pelo Supabase, não reescrito.
    expect(state.updates).toEqual([{ data: { [TOUR_METADATA_KEY]: body.doneAt } }]);
    expect(state.refreshes).toBe(1);
  });

  it("keeps the first date when the account already has it (replaying the tour)", async () => {
    state.claims = {
      sub: "user-1",
      user_metadata: { [TOUR_METADATA_KEY]: "2026-10-01T00:00:00Z" },
    };
    const res = await POST(request());
    expect(res.status).toBe(200);
    expect(OnboardingResponse.parse(await res.json())).toEqual({
      doneAt: "2026-10-01T00:00:00Z",
      stored: "account",
    });
    expect(state.updates).toHaveLength(0);
  });

  it("answers 'local' without Supabase (dev), saving nothing", async () => {
    state.supabase = false;
    const res = await POST(request());
    expect(res.status).toBe(200);
    expect(OnboardingResponse.parse(await res.json()).stored).toBe("local");
    expect(state.updates).toHaveLength(0);
  });

  it("requires a logged-in account", async () => {
    state.user = null;
    const res = await POST(request());
    expect(res.status).toBe(401);
    expect(ApiError.parse(await res.json()).error.code).toBe("unauthorized");
    expect(state.updates).toHaveLength(0);
  });

  it("rejects a body that isn't the expected JSON", async () => {
    const wrong = await POST(request({ tour: "maybe" }));
    expect(wrong.status).toBe(400);
    expect(ApiError.parse(await wrong.json()).error.code).toBe("invalid_request");

    const form = await POST(request({ tour: "done" }, "text/plain"));
    expect(form.status).toBe(415);
    expect(state.updates).toHaveLength(0);
  });

  it("returns a 500 in the standard format when Supabase fails", async () => {
    state.updateError = { message: "boom" };
    const res = await POST(request());
    expect(res.status).toBe(500);
    expect(ApiError.parse(await res.json()).error.code).toBe("internal_error");
    expect(state.refreshes).toBe(0);
  });
});
