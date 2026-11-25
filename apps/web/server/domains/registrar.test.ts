import type { FreeDomainRegistrant } from "@nosweat/schema";
import { describe, expect, it, vi } from "vitest";
import { dollarsToCents, RegistrarError, VercelRegistrar } from "./registrar";

const config = { token: "t", teamId: "team_1" };

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

type Call = [URL, RequestInit];

function mockFetch(response: () => Response) {
  const fetchMock = vi.fn(async (_url: URL, _init: RequestInit) => response());
  return { fetchMock, impl: fetchMock as unknown as typeof fetch };
}

const calls = (fetchMock: ReturnType<typeof mockFetch>["fetchMock"]) =>
  fetchMock.mock.calls as unknown as Call[];

describe("dollarsToCents", () => {
  it("rounds to whole cents", () => {
    expect(dollarsToCents(12.03)).toBe(1203);
    expect(dollarsToCents(13.5)).toBe(1350);
  });
});

describe("VercelRegistrar", () => {
  it("checks availability and price of many names in one search call", async () => {
    const { fetchMock, impl } = mockFetch(() =>
      Response.json({
        results: [
          { domain: "joes.com", available: true, years: 1, price: 12.03, premium: false },
          // A documentação mostra exemplos com valores entre aspas.
          { domain: "joes.net", available: "false" },
        ],
      }),
    );
    const quotes = await new VercelRegistrar(config, impl).quote(["joes.com", "joes.net"]);
    expect(quotes).toEqual([
      { domain: "joes.com", available: true, priceCents: 1203, premium: false },
      { domain: "joes.net", available: false, priceCents: null, premium: false },
    ]);
    const [[url, init]] = calls(fetchMock) as [Call];
    expect(String(url)).toBe("https://api.vercel.com/v1/registrar/domains/search?teamId=team_1");
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual({ domains: ["joes.com", "joes.net"] });
    expect(new Headers(init.headers).get("authorization")).toBe("Bearer t");
  });

  it("reads one domain's availability and first-year price", async () => {
    const { fetchMock, impl } = mockFetch(() =>
      Response.json({ available: true, years: 1, purchasePrice: 12.03, renewalPrice: 12.03 }),
    );
    const registrar = new VercelRegistrar(config, impl);
    expect(await registrar.isAvailable("joes.com")).toBe(true);
    expect(await registrar.priceCents("joes.com")).toBe(1203);
    const urls = calls(fetchMock).map(([url]) => String(url));
    expect(urls).toEqual([
      "https://api.vercel.com/v1/registrar/domains/joes.com/availability?teamId=team_1",
      "https://api.vercel.com/v1/registrar/domains/joes.com/price?years=1&teamId=team_1",
    ]);
  });

  it("buys for one year with the expected price in dollars and the owner's contact", async () => {
    const { fetchMock, impl } = mockFetch(() =>
      Response.json({ orderId: "order_123", _links: {} }),
    );
    const result = await new VercelRegistrar(config, impl).purchase({
      domain: "joes.com",
      expectedPriceCents: 1203,
      registrant,
      autoRenew: true,
    });
    expect(result).toEqual({ orderId: "order_123" });
    const [[url, init]] = calls(fetchMock) as [Call];
    expect(String(url)).toBe(
      "https://api.vercel.com/v1/registrar/domains/joes.com/buy?teamId=team_1",
    );
    expect(JSON.parse(String(init.body))).toEqual({
      autoRenew: true,
      years: 1,
      expectedPrice: 12.03,
      contactInformation: {
        firstName: "Joe",
        lastName: "Smith",
        email: "joe@example.com",
        phone: "+1.5125550100",
        address1: "100 Main St",
        city: "Austin",
        state: "TX",
        zip: "78701",
        country: "US",
      },
    });
  });

  it("turns auto-renew on or off", async () => {
    const { fetchMock, impl } = mockFetch(() => new Response(null, { status: 204 }));
    await new VercelRegistrar(config, impl).setAutoRenew("joes.com", false);
    const [[url, init]] = calls(fetchMock) as [Call];
    expect(String(url)).toBe(
      "https://api.vercel.com/v1/registrar/domains/joes.com/auto-renew?teamId=team_1",
    );
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(String(init.body))).toEqual({ autoRenew: false });
  });

  it("a 4xx refusal is definitive (nothing was bought)", async () => {
    const { impl } = mockFetch(() =>
      Response.json(
        { error: { code: "expected_price_mismatch", message: "Price changed" } },
        { status: 400 },
      ),
    );
    const error = await new VercelRegistrar(config, impl)
      .purchase({ domain: "joes.com", expectedPriceCents: 1203, registrant, autoRenew: true })
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(RegistrarError);
    expect(error).toMatchObject({ code: "expected_price_mismatch", status: 400 });
    expect((error as RegistrarError).definitive).toBe(true);
  });

  it("5xx, 429 and network errors are not definitive", async () => {
    for (const status of [500, 429]) {
      const { impl } = mockFetch(() => Response.json({ code: "x", message: "y" }, { status }));
      const error = await new VercelRegistrar(config, impl).isAvailable("joes.com").catch((e) => e);
      expect((error as RegistrarError).definitive).toBe(false);
    }
    const offline = vi.fn(async () => {
      throw new TypeError("fetch failed");
    }) as unknown as typeof fetch;
    const error = await new VercelRegistrar(config, offline)
      .isAvailable("joes.com")
      .catch((e) => e);
    expect(error).toMatchObject({ code: "network_error", status: 0 });
    expect((error as RegistrarError).definitive).toBe(false);
  });
});
