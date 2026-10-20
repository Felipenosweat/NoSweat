import { describe, expect, it, vi } from "vitest";
import { makeSlug as sharedMakeSlug } from "@/lib/slug";
import { isAppHost, isReservedDomain, makeSlug } from "./index";
import { addDomain, isDomainConfigured, VercelDomainError } from "./vercel";

const config = { token: "t", projectId: "prj_1", teamId: "team_1" };

describe("makeSlug", () => {
  it("builds a readable, unique slug", () => {
    expect(makeSlug("Joe's Plumbing", "6f1c2a3b-4d5e")).toBe("joes-plumbing-6f1c2a");
    expect(makeSlug("Café São Paulo!", "abcdef12")).toBe("cafe-sao-paulo-abcdef");
    expect(makeSlug("!!!", "abcdef12")).toBe("site-abcdef");
  });

  it("is the same rule the editor uses in the browser", () => {
    expect(makeSlug).toBe(sharedMakeSlug);
  });
});

describe("isAppHost", () => {
  it.each([
    "nosweatfd.com",
    "www.nosweatfd.com",
    "localhost",
    "no-sweat-abc.vercel.app",
    "127.0.0.1",
    "app.nosweatfd.com",
  ])("%s is the platform", (host) => expect(isAppHost(host)).toBe(true));
  it.each(["joesplumbing.com", "www.joesplumbing.com"])("%s is a customer domain", (host) =>
    expect(isAppHost(host)).toBe(false),
  );
});

describe("isReservedDomain", () => {
  it.each(["nosweatfd.com", "login.nosweatfd.com", "a.b.nosweatfd.com", "evil.vercel.app"])(
    "blocks %s",
    (domain) => {
      expect(isReservedDomain(domain)).toBe(true);
    },
  );

  it.each(["joesplumbing.com", "nosweatfd.com.br", "mynosweatfd.com"])("allows %s", (domain) => {
    expect(isReservedDomain(domain)).toBe(false);
  });
});

describe("Vercel domains", () => {
  it("adds the domain and a www redirect", async () => {
    const fetchMock = vi.fn(async () => Response.json({ name: "joes.com" }));
    await addDomain(config, "joes.com", fetchMock as unknown as typeof fetch);
    const bodies = fetchMock.mock.calls.map((call) =>
      JSON.parse(String((call as unknown as [URL, RequestInit])[1].body)),
    );
    expect(bodies).toEqual([{ name: "joes.com" }, { name: "www.joes.com", redirect: "joes.com" }]);
    const [url] = fetchMock.mock.calls[0] as unknown as [URL];
    expect(String(url)).toBe("https://api.vercel.com/v10/projects/prj_1/domains?teamId=team_1");
  });

  it("raises a readable error when the domain belongs to someone else", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json(
        { error: { code: "domain_taken", message: "The domain is used by another account." } },
        { status: 409 },
      ),
    );
    await expect(
      addDomain(config, "google.com", fetchMock as unknown as typeof fetch),
    ).rejects.toBeInstanceOf(VercelDomainError);
  });

  it("reports whether DNS is configured", async () => {
    const ok = vi.fn(async () => Response.json({ misconfigured: false }));
    const bad = vi.fn(async () => Response.json({ misconfigured: true }));
    expect(await isDomainConfigured(config, "joes.com", ok as unknown as typeof fetch)).toBe(true);
    expect(await isDomainConfigured(config, "joes.com", bad as unknown as typeof fetch)).toBe(
      false,
    );
  });
});
