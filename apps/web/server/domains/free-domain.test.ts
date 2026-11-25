import type { FreeDomainRegistrant } from "@nosweat/schema";
import { describe, expect, it, vi } from "vitest";
import {
  MAX_CANDIDATES,
  claimFreeDomain,
  freeDomainCandidates,
  isValidLabel,
  parseFreeDomainQuery,
  searchFreeDomain,
  syncAutoRenew,
  toOption,
  type FreeDomainDeps,
} from "./free-domain";
import { MemoryFreeDomainStore } from "./free-domain-store";
import { MockRegistrar, RegistrarError, type PurchaseInput } from "./registrar";

const USER = "6f1c2a3b-4d5e-4f60-8a1b-2c3d4e5f6a7b";
const OTHER_USER = "0a1b2c3d-4e5f-4061-8a2b-3c4d5e6f7a8b";
const SITE = "11111111-2222-4333-8444-555555555555";

const registrant: FreeDomainRegistrant = {
  firstName: "Joe",
  lastName: "Smith",
  email: "joe@example.com",
  phone: "+1.5125550100",
  address1: "100 Main St",
  city: "Austin",
  state: "TX",
  zip: "78701",
  country: "US",
};

function setup(registrar = new MockRegistrar()) {
  const store = new MemoryFreeDomainStore();
  const connect = vi.fn(async (_domain: string) => undefined);
  const deps: FreeDomainDeps & { connect: typeof connect } = {
    store,
    registrar,
    maxCents: 1500,
    connect,
  };
  return { store, registrar, connect, deps };
}

/** Registro que recusa (4xx) ou falha sem certeza (5xx) na compra. */
class FailingRegistrar extends MockRegistrar {
  constructor(private readonly status: number) {
    super();
  }
  override async purchase(_input: PurchaseInput): Promise<{ orderId: string | null }> {
    throw new RegistrarError("nope", this.status === 400 ? "invalid_contact" : "boom", this.status);
  }
}

describe("parseFreeDomainQuery", () => {
  it.each([
    ["joesplumbing", "joesplumbing.com"],
    ["Joe's Plumbing", "joesplumbing.com"],
    ["https://www.JoesPlumbing.net/", "joesplumbing.net"],
    ["joes-plumbing.com", "joes-plumbing.com"],
    ["Café São Paulo", "cafesaopaulo.com"],
    ["Joe & Sons", "joeandsons.com"],
  ])("%s → %s", (query, domain) => {
    const parsed = parseFreeDomainQuery(query);
    expect(parsed.ok && parsed.domain).toBe(domain);
  });

  it.each(["joes.org", "joes.co.uk", "a", "shop.joes.com", "!!!", `${"a".repeat(64)}.com`])(
    "refuses %s",
    (query) => {
      expect(parseFreeDomainQuery(query).ok).toBe(false);
    },
  );

  it("explains why .org is not free", () => {
    const parsed = parseFreeDomainQuery("joes.org");
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.message).toMatch(/\.com or \.net/);
  });
});

describe("isValidLabel", () => {
  it("accepts letters, digits and inner hyphens", () => {
    expect(isValidLabel("joes-plumbing-2")).toBe(true);
  });
  it.each(["-joes", "joes-", "jo_es", "xn--joes", "j", "a".repeat(64)])("refuses %s", (label) => {
    expect(isValidLabel(label)).toBe(false);
  });
});

describe("freeDomainCandidates", () => {
  it("starts with the wanted name, tries .net, the city and short endings", () => {
    const list = freeDomainCandidates(
      { label: "joesplumbing", tld: "com" },
      { name: "Joe's Plumbing & Heating", city: "Austin" },
    );
    expect(list[0]).toBe("joesplumbing.com");
    expect(list).toContain("joesplumbing.net");
    expect(list).toContain("joesplumbingaustin.com");
    expect(list).toContain("joesplumbingpros.com");
    expect(list).toContain("joesplumbingandheating.com");
    expect(list.length).toBeLessThanOrEqual(MAX_CANDIDATES);
    expect(new Set(list).size).toBe(list.length);
  });

  it("never returns invalid names", () => {
    const list = freeDomainCandidates({ label: "a".repeat(62), tld: "net" }, { city: "Austin" });
    for (const domain of list) expect(isValidLabel(domain.split(".")[0]!)).toBe(true);
    expect(list[1]).toBe(`${"a".repeat(62)}.com`);
  });
});

describe("toOption", () => {
  it("is free when available, .com/.net and under the cap", () => {
    expect(
      toOption({ domain: "joes.com", available: true, priceCents: 1203, premium: false }, 1500),
    ).toEqual({ domain: "joes.com", available: true, free: true, priceCents: 1203, reason: null });
  });

  it("refuses premium names and prices over the cap", () => {
    const premium = toOption(
      { domain: "joes.com", available: true, priceCents: 1203, premium: true },
      1500,
    );
    const pricey = toOption(
      { domain: "joes.net", available: true, priceCents: 1600, premium: false },
      1500,
    );
    expect(premium).toMatchObject({ free: false, reason: "premium" });
    expect(pricey).toMatchObject({ free: false, reason: "premium" });
  });

  it("marks taken names", () => {
    expect(
      toOption({ domain: "joes.com", available: false, priceCents: null, premium: false }, 1500),
    ).toMatchObject({ available: false, free: false, reason: "taken" });
  });
});

describe("searchFreeDomain", () => {
  it("returns the wanted name without suggestions when it is free (one registry call)", async () => {
    const registrar = new MockRegistrar();
    const quote = vi.spyOn(registrar, "quote");
    const outcome = await searchFreeDomain({ registrar, maxCents: 1500 }, "joesplumbing");
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.response.result).toMatchObject({ domain: "joesplumbing.com", free: true });
    expect(outcome.response.suggestions).toEqual([]);
    expect(quote).toHaveBeenCalledTimes(1);
    expect(quote.mock.calls[0]![0].length).toBeLessThanOrEqual(MAX_CANDIDATES);
  });

  it("suggests only available, free names when the wanted one is taken", async () => {
    const registrar = new MockRegistrar();
    const outcome = await searchFreeDomain({ registrar, maxCents: 1500 }, "takenplumbing.com", {
      name: "Joe's Plumbing",
      city: "Austin",
    });
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.response.result).toMatchObject({ available: false, reason: "taken" });
    // Toda variação de "takenplumbing" também está "taken" no mock; sobra o nome da empresa.
    expect(outcome.response.suggestions.map((s) => s.domain)).toEqual(["joesplumbing.com"]);
    expect(outcome.response.suggestions.every((s) => s.free)).toBe(true);
  });

  it("refuses names that are not .com/.net", async () => {
    const outcome = await searchFreeDomain(
      { registrar: new MockRegistrar(), maxCents: 1500 },
      "joes.org",
    );
    expect(outcome).toMatchObject({ ok: false, status: 400, code: "invalid_request" });
  });

  it("turns a registry error into a friendly 502", async () => {
    const registrar = new MockRegistrar();
    vi.spyOn(registrar, "quote").mockRejectedValue(new RegistrarError("down", "boom", 500));
    const outcome = await searchFreeDomain({ registrar, maxCents: 1500 }, "joes");
    expect(outcome).toMatchObject({ ok: false, status: 502, code: "domain_error" });
  });
});

describe("claimFreeDomain", () => {
  const input = { userId: USER, siteId: SITE, domain: "joesplumbing.com", registrant };

  it("buys the domain in the customer's name, connects it and never stores the address", async () => {
    const { deps, store, registrar, connect } = setup();
    const outcome = await claimFreeDomain(deps, input);
    expect(outcome).toMatchObject({ ok: true, connected: true });
    expect(registrar.purchases).toHaveLength(1);
    expect(registrar.purchases[0]).toMatchObject({
      domain: "joesplumbing.com",
      expectedPriceCents: 1203,
      autoRenew: true,
      registrant,
    });
    expect(connect).toHaveBeenCalledWith("joesplumbing.com");
    const claim = await store.get(USER);
    expect(claim).toMatchObject({ status: "purchased", priceCents: 1203, siteId: SITE });
    expect(claim?.orderId).toBeTruthy();
    const saved = JSON.stringify(claim);
    for (const secret of [registrant.phone, registrant.address1, registrant.zip]) {
      expect(saved).not.toContain(secret);
    }
  });

  it("never buys twice: a second claim (or a double click) is refused", async () => {
    const { deps, registrar } = setup();
    const [first, second] = await Promise.all([
      claimFreeDomain(deps, input),
      claimFreeDomain(deps, { ...input, domain: "joesplumbing.net" }),
    ]);
    expect([first.ok, second.ok].filter(Boolean)).toHaveLength(1);
    const later = await claimFreeDomain(deps, { ...input, domain: "joesplumbingaustin.com" });
    expect(later).toMatchObject({ ok: false, status: 409, code: "conflict" });
    expect(registrar.purchases).toHaveLength(1);
  });

  it("refuses premium prices before reserving anything", async () => {
    const { deps, store, registrar } = setup();
    const outcome = await claimFreeDomain(deps, { ...input, domain: "premiumplumbing.com" });
    expect(outcome).toMatchObject({ ok: false, status: 400 });
    expect(await store.get(USER)).toBeNull();
    expect(registrar.purchases).toHaveLength(0);
  });

  it("refuses a name that was just taken", async () => {
    const { deps, store } = setup();
    const outcome = await claimFreeDomain(deps, { ...input, domain: "takenname.com" });
    expect(outcome).toMatchObject({ ok: false, code: "domain_taken" });
    expect(await store.get(USER)).toBeNull();
  });

  it("a refusal from the registry marks it failed and allows exactly one more try", async () => {
    const failing = setup(new FailingRegistrar(400));
    const first = await claimFreeDomain(failing.deps, input);
    expect(first).toMatchObject({ ok: false, code: "domain_error" });
    expect(await failing.store.get(USER)).toMatchObject({ status: "failed", attempts: 1 });

    const second = await claimFreeDomain(failing.deps, input);
    expect(second).toMatchObject({ ok: false, code: "domain_error" });
    expect(await failing.store.get(USER)).toMatchObject({ status: "failed", attempts: 2 });

    const third = await claimFreeDomain(failing.deps, input);
    expect(third).toMatchObject({ ok: false, status: 409, code: "conflict" });
  });

  it("an uncertain error keeps the claim pending and never retries the purchase", async () => {
    const { deps, store } = setup(new FailingRegistrar(500));
    const purchase = vi.spyOn(deps.registrar, "purchase");
    const first = await claimFreeDomain(deps, input);
    expect(first).toMatchObject({ ok: false, uncertain: true });
    expect(await store.get(USER)).toMatchObject({ status: "pending" });

    const again = await claimFreeDomain(deps, input);
    expect(again).toMatchObject({ ok: false, status: 409, code: "conflict" });
    expect(purchase).toHaveBeenCalledTimes(1);
  });

  it("keeps the purchase when connecting to the site fails", async () => {
    const { deps, store } = setup();
    deps.connect.mockRejectedValueOnce(new Error("vercel down"));
    const outcome = await claimFreeDomain(deps, input);
    expect(outcome).toMatchObject({ ok: true, connected: false });
    expect(await store.get(USER)).toMatchObject({ status: "purchased" });
    expect((await store.get(USER))?.error).toMatch(/connect_failed/);
  });

  it("lets another account claim a different name", async () => {
    const { deps, registrar } = setup();
    await claimFreeDomain(deps, input);
    const other = await claimFreeDomain(deps, {
      ...input,
      userId: OTHER_USER,
      domain: "joesplumbing.com",
    });
    // O mesmo nome já foi comprado: o registro diz que não está mais disponível.
    expect(other).toMatchObject({ ok: false, code: "domain_taken" });
    const fine = await claimFreeDomain(deps, {
      ...input,
      userId: OTHER_USER,
      domain: "anaspaint.net",
    });
    expect(fine.ok).toBe(true);
    expect(registrar.purchases).toHaveLength(2);
  });
});

describe("syncAutoRenew", () => {
  it("turns renewal off when the plan ends and back on when it returns", async () => {
    const { deps, store, registrar } = setup();
    await claimFreeDomain(deps, {
      userId: USER,
      siteId: SITE,
      domain: "joesplumbing.com",
      registrant,
    });
    expect(registrar.autoRenew.get("joesplumbing.com")).toBe(true);

    const off = await syncAutoRenew({ store, registrar, keepRenewing: async () => false });
    expect(off).toEqual({ checked: 1, changed: 1, failed: 0 });
    expect(registrar.autoRenew.get("joesplumbing.com")).toBe(false);
    expect((await store.get(USER))?.autoRenew).toBe(false);

    const same = await syncAutoRenew({ store, registrar, keepRenewing: async () => false });
    expect(same.changed).toBe(0);

    await syncAutoRenew({ store, registrar, keepRenewing: async () => true });
    expect(registrar.autoRenew.get("joesplumbing.com")).toBe(true);
  });

  it("counts failures without stopping", async () => {
    const { deps, store, registrar } = setup();
    await claimFreeDomain(deps, {
      userId: USER,
      siteId: SITE,
      domain: "joesplumbing.com",
      registrant,
    });
    vi.spyOn(registrar, "setAutoRenew").mockRejectedValue(new Error("down"));
    const result = await syncAutoRenew({ store, registrar, keepRenewing: async () => false });
    expect(result).toEqual({ checked: 1, changed: 0, failed: 1 });
    expect((await store.get(USER))?.autoRenew).toBe(true);
  });
});
