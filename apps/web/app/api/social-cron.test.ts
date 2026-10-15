import { afterEach, describe, expect, it, vi } from "vitest";

// As rotas só checam o segredo e chamam o publicador / a renovação (testados à parte).
vi.mock("@/server/social/publisher", () => ({
  publishDuePosts: async () => ({
    claimed: 0,
    published: 0,
    retried: 0,
    failed: 0,
    paused: 0,
    missed: 0,
  }),
}));
vi.mock("@/server/social/refresh", () => ({
  refreshExpiringTokens: async () => ({
    checked: 0,
    refreshed: 0,
    rekeyed: 0,
    needsReconnect: 0,
    failed: 0,
  }),
}));

const { GET: publish } = await import("./cron/social-publish/route");
const { GET: refresh } = await import("./cron/social-refresh/route");

const BASE = "http://localhost:3000/api";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe.each([
  ["social-publish", publish, "published"],
  ["social-refresh", refresh, "refreshed"],
] as const)("GET /api/cron/%s", (name, handler, key) => {
  const call = (auth?: string) =>
    handler(new Request(`${BASE}/cron/${name}`, { headers: auth ? { authorization: auth } : {} }));

  it("refuses calls without the cron secret", async () => {
    vi.stubEnv("CRON_SECRET", "");
    expect((await call("Bearer anything")).status).toBe(401);
    vi.stubEnv("CRON_SECRET", "cron-test-secret");
    expect((await call()).status).toBe(401);
    expect((await call("Bearer wrong")).status).toBe(401);
  });

  it("runs with the cron secret", async () => {
    vi.stubEnv("CRON_SECRET", "cron-test-secret");
    const res = await call("Bearer cron-test-secret");
    expect(res.status).toBe(200);
    expect(await res.json()).toHaveProperty(key, 0);
  });
});
