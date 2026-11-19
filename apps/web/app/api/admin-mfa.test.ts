import { fixtures } from "@nosweat/fixtures";
import { ApiError, ERROR_CODES } from "@nosweat/schema";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getAdminAuditStore, resetMemoryAdminAuditStore } from "@/server/admin/audit";
import { getOwnedSite } from "@/server/sites";
import { getSiteStore } from "@/server/store";

// MFA (AAL2) dos admins e registro de auditoria. O "admin" é o DEV_USER com DEV_ADMIN=true (sem a
// chave secreta do Supabase, isAdmin não consulta o banco); as variáveis públicas do Supabase
// ligam a exigência de MFA. A claim `aal` vem do JWT simulado.

const DEV = { id: "local-dev", email: "dev@localhost" };
const OTHER = { id: "other-user", email: "other@example.com" };

const state = vi.hoisted(() => ({
  user: null as { id: string; email: string | null } | null,
  claims: null as Record<string, unknown> | null,
}));

vi.mock("@/server/auth/session", () => ({
  DEV_USER: { id: "local-dev", email: "dev@localhost" },
  getCurrentUser: async () => state.user,
  getSessionClaims: async () => state.claims,
  createSupabaseServerClient: async () => null,
}));

const { GET: listExpenses, POST: createExpense } = await import("./admin/finance/expenses/route");
const { DELETE: deleteSite } = await import("./sites/[id]/route");

function asAdmin(aal: "aal1" | "aal2") {
  state.user = DEV;
  state.claims = { sub: DEV.id, aal };
}

/** O registro do acesso ao site sai depois da resposta (`after`); nos testes, sem esperar. */
async function flush() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

beforeEach(() => {
  vi.stubEnv("DEV_ADMIN", "true");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
  vi.stubEnv("ADMIN_REQUIRE_MFA", "");
  resetMemoryAdminAuditStore();
});

afterEach(() => {
  vi.unstubAllEnvs();
  state.user = null;
  state.claims = null;
});

describe("admin API routes need AAL2", () => {
  it("knows the mfa_required error code", () => {
    expect(ERROR_CODES).toContain("mfa_required");
  });

  it("refuses an admin session without the second step (403 mfa_required)", async () => {
    asAdmin("aal1");
    const res = await listExpenses();
    expect(res.status).toBe(403);
    expect(ApiError.parse(await res.json()).error.code).toBe("mfa_required");
  });

  it("lets an AAL2 admin through", async () => {
    asAdmin("aal2");
    expect((await listExpenses()).status).toBe(200);
  });

  it("can be turned off with ADMIN_REQUIRE_MFA=false (recovery)", async () => {
    vi.stubEnv("ADMIN_REQUIRE_MFA", "false");
    asAdmin("aal1");
    expect((await listExpenses()).status).toBe(200);
  });

  it("does not require MFA without Supabase (local dev)", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
    state.user = DEV;
    state.claims = null;
    expect((await listExpenses()).status).toBe(200);
  });

  it("still hides the route from non-admins (404)", async () => {
    state.user = OTHER;
    state.claims = { sub: OTHER.id, aal: "aal2" };
    expect((await listExpenses()).status).toBe(404);
  });

  it("records expense changes in the audit log", async () => {
    asAdmin("aal2");
    const res = await createExpense(
      new Request("http://localhost/api/admin/finance/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Vercel",
          category: "hosting",
          amountCents: 2000,
          frequency: "monthly",
        }),
      }),
    );
    expect(res.status).toBe(201);
    const [entry] = await getAdminAuditStore().listRecent(10);
    expect(entry).toMatchObject({
      adminId: DEV.id,
      action: "expense.create",
      targetType: "expense",
    });
  });
});

describe("admin access to someone else's website", () => {
  async function othersSite() {
    return getSiteStore().create(fixtures["joes-plumbing"], OTHER.id);
  }

  it("is refused while the admin session is AAL1; the owner is not affected", async () => {
    const site = await othersSite();
    asAdmin("aal1");
    expect(await getOwnedSite(DEV, site.id)).toBeNull();
    // O dono continua entrando com a sessão AAL1 de sempre.
    state.user = OTHER;
    state.claims = { sub: OTHER.id, aal: "aal1" };
    expect((await getOwnedSite(OTHER, site.id))?.id).toBe(site.id);
    await flush();
    expect(await getAdminAuditStore().listRecent(10)).toEqual([]);
  });

  it("works with AAL2 and is recorded once per window", async () => {
    const site = await othersSite();
    asAdmin("aal2");
    expect((await getOwnedSite(DEV, site.id))?.id).toBe(site.id);
    expect((await getOwnedSite(DEV, site.id))?.id).toBe(site.id);
    await flush();
    const entries = await getAdminAuditStore().listRecent(10);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      action: "site.access",
      targetType: "site",
      targetId: site.id,
      metadata: { ownerId: OTHER.id },
    });
  });

  it("records an admin deleting a customer's website", async () => {
    const site = await othersSite();
    asAdmin("aal2");
    const res = await deleteSite(new Request(`http://localhost/api/sites/${site.id}`), {
      params: Promise.resolve({ id: site.id }),
    });
    expect(res.status).toBe(200);
    await flush();
    const actions = (await getAdminAuditStore().listRecent(10)).map((entry) => entry.action);
    expect(actions).toContain("site.delete");
  });
});
