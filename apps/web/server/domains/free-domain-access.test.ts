import { afterEach, describe, expect, it, vi } from "vitest";
import { stateFor } from "./free-domain-access";
import type { FreeDomainClaim } from "./free-domain-store";

const claim = (patch: Partial<FreeDomainClaim>): FreeDomainClaim => ({
  id: "c1",
  userId: "u1",
  siteId: "s1",
  domain: "joes.com",
  status: "purchased",
  priceCents: 1203,
  attempts: 1,
  orderId: "order_1",
  autoRenew: true,
  error: null,
  createdAt: "2026-11-25T00:00:00.000Z",
  purchasedAt: "2026-11-25T00:00:00.000Z",
  ...patch,
});

describe("stateFor", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("shows the lock without Premium and the wait before the first payment", () => {
    vi.stubEnv("DOMAIN_PURCHASE_ENABLED", "true");
    expect(stateFor(null, "locked").state).toBe("locked");
    expect(stateFor(null, "awaiting_payment").state).toBe("awaiting_payment");
  });

  it("is 'coming soon' until the purchase is switched on", () => {
    vi.stubEnv("DOMAIN_PURCHASE_ENABLED", "false");
    expect(stateFor(null, "ok").state).toBe("coming_soon");
    vi.stubEnv("DOMAIN_PURCHASE_ENABLED", "true");
    expect(stateFor(null, "ok").state).toBe("available");
  });

  it("one per account: a live claim is final, even if the plan changed", () => {
    vi.stubEnv("DOMAIN_PURCHASE_ENABLED", "true");
    expect(stateFor(claim({}), "locked")).toMatchObject({
      state: "claimed",
      claim: { domain: "joes.com", status: "purchased", canRetry: false },
    });
    expect(stateFor(claim({ status: "pending" }), "ok").state).toBe("claimed");
  });

  it("a refused claim can try once more, then it's final", () => {
    vi.stubEnv("DOMAIN_PURCHASE_ENABLED", "true");
    const once = stateFor(claim({ status: "failed", attempts: 1 }), "ok");
    expect(once).toMatchObject({ state: "available", claim: { canRetry: true } });
    const twice = stateFor(claim({ status: "failed", attempts: 2 }), "ok");
    expect(twice).toMatchObject({ state: "claimed", claim: { canRetry: false } });
  });
});
