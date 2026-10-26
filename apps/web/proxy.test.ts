import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type * as ViewAsModule from "@/server/auth/view-as-token";
import { proxy } from "./proxy";

// Testes do proxy.ts: os caminhos públicos saem cedo (sem tocar no Supabase) e o resto continua
// igual (domínio de cliente, ?code=, modo "ver como", login e /welcome).

const mocks = vi.hoisted(() => {
  type Claims = { data: { claims: Record<string, unknown> } | null };
  const getClaims = vi.fn<() => Promise<Claims>>(async () => ({ data: null }));
  const createServerClient = vi.fn<
    (...args: unknown[]) => { auth: { getClaims: typeof getClaims } }
  >(() => ({ auth: { getClaims } }));
  const verifyViewAsToken = vi.fn<(...args: unknown[]) => Promise<unknown>>(async () => null);
  return { getClaims, createServerClient, verifyViewAsToken };
});

vi.mock("@supabase/ssr", () => ({
  createServerClient: (...args: unknown[]) => mocks.createServerClient(...args),
}));

vi.mock("@/server/auth/view-as-token", async (importOriginal) => {
  const original = await importOriginal<typeof ViewAsModule>();
  return {
    ...original,
    verifyViewAsToken: (...args: unknown[]) => mocks.verifyViewAsToken(...args),
  };
});

const APP = "https://www.nosweatfd.com";

function request(
  path: string,
  {
    method = "GET",
    host = "www.nosweatfd.com",
    cookie,
  }: { method?: string; host?: string; cookie?: string } = {},
) {
  const headers: Record<string, string> = { host };
  if (cookie) headers.cookie = cookie;
  return new NextRequest(`${APP}${path}`, { method, headers });
}

const isNext = (response: Response) => response.headers.get("x-middleware-next") === "1";

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
  mocks.getClaims.mockResolvedValue({ data: null });
  mocks.verifyViewAsToken.mockResolvedValue(null);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("proxy: caminhos públicos saem cedo", () => {
  it.each([
    ["GET", "/"],
    ["GET", "/pricing"],
    ["GET", "/pricing/"],
    ["GET", "/terms"],
    ["GET", "/privacy"],
    ["GET", "/credits"],
    ["GET", "/s/joes-plumbing"],
    ["GET", "/examples/mercer-law"],
    ["GET", "/q/some-token"],
    ["GET", "/i/some-token"],
    ["POST", "/api/public/estimates/abc/accept"],
    ["POST", "/api/sites/site_1/leads"],
    ["GET", "/api/cron/social-publish"],
    ["POST", "/api/billing/webhook"],
    ["POST", "/api/unsubscribe"],
  ])("%s %s não renova a sessão", async (method, path) => {
    const response = await proxy(request(path, { method }));
    expect(isNext(response)).toBe(true);
    expect(mocks.createServerClient).not.toHaveBeenCalled();
  });

  it("rotas públicas da API continuam passando no modo ver como", async () => {
    mocks.getClaims.mockResolvedValue({ data: { claims: { sub: "admin-1" } } });
    mocks.verifyViewAsToken.mockResolvedValue({ viewer: "admin-1", target: "user-2" });
    const response = await proxy(
      request("/api/sites/site_1/leads", { method: "POST", cookie: "ns_view_as=token" }),
    );
    expect(isNext(response)).toBe(true);
    expect(response.status).toBe(200);
  });
});

describe("proxy: o resto continua igual", () => {
  it.each(["/pricingx", "/sites/site_1", "/create", "/login", "/simple", "/api/sites/site_1"])(
    "%s ainda renova a sessão",
    async (path) => {
      await proxy(request(path));
      expect(mocks.createServerClient).toHaveBeenCalledTimes(1);
    },
  );

  it("domínio de cliente vira /d/<host> antes de tudo", async () => {
    const response = await proxy(request("/pricing", { host: "joesplumbing.com" }));
    expect(response.headers.get("x-middleware-rewrite")).toContain("/d/joesplumbing.com");
    expect(mocks.createServerClient).not.toHaveBeenCalled();
  });

  it("?code= na landing vai para /auth/callback", async () => {
    const response = await proxy(request("/?code=abc"));
    expect(response.status).toBe(307);
    expect(new URL(response.headers.get("location") ?? "").pathname).toBe("/auth/callback");
  });

  it("página protegida sem login vai para /login", async () => {
    const response = await proxy(request("/dashboard"));
    expect(response.status).toBe(307);
    const location = new URL(response.headers.get("location") ?? "");
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("next")).toBe("/dashboard");
  });

  it("conta sem perfil completo vai para /welcome", async () => {
    mocks.getClaims.mockResolvedValue({ data: { claims: { sub: "user-1", user_metadata: {} } } });
    const response = await proxy(request("/dashboard"));
    expect(response.status).toBe(307);
    expect(new URL(response.headers.get("location") ?? "").pathname).toBe("/welcome");
  });

  it("modo ver como bloqueia escrita na API privada", async () => {
    mocks.getClaims.mockResolvedValue({ data: { claims: { sub: "admin-1" } } });
    mocks.verifyViewAsToken.mockResolvedValue({ viewer: "admin-1", target: "user-2" });
    const response = await proxy(
      request("/api/sites/site_1/publish", { method: "POST", cookie: "ns_view_as=token" }),
    );
    expect(response.status).toBe(403);
  });
});
