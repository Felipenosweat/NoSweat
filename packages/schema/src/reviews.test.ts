import { describe, expect, it } from "vitest";
import {
  GoogleReviewUrl,
  ReviewLinkResponse,
  SiteSpec,
  UpdateReviewLinkRequest,
  isGoogleReviewUrl,
} from "./index";

const spec: SiteSpec = {
  version: 1,
  template: "home-services",
  business: { name: "Joe's Plumbing" },
  theme: {
    primary: "#123456",
    secondary: "#ABCDEF",
    background: "#FFFFFF",
    text: "#111111",
    font: "modern",
  },
  sections: [
    { type: "hero", title: "Fast plumbing", subtitle: "Austin", ctaLabel: "Call now" },
    { type: "contact", showForm: true, showMap: false },
  ],
};

describe("isGoogleReviewUrl", () => {
  it.each([
    "https://g.page/r/CbX1ab2Cd3EfEAI/review",
    "https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4",
    "https://www.google.com/maps/place/Joe's+Plumbing/@30.26,-97.74,15z",
    "https://google.com/maps?cid=1234567890",
    "https://www.google.com/search?q=joes+plumbing#lrd=0x0:0x1,3",
    "https://maps.google.com/?cid=1234567890",
    "https://maps.app.goo.gl/AbCdEf123",
    "https://goo.gl/maps/AbCdEf123",
    "https://G.PAGE/r/abc/review",
    "https://g.co/kgs/AbC123x",
  ])("aceita %s", (url) => {
    expect(isGoogleReviewUrl(url)).toBe(true);
  });

  it.each([
    ["http (sem s)", "http://g.page/r/abc/review"],
    ["outro site", "https://example.com/review"],
    ["host parecido", "https://g.page.example.com/r/abc"],
    ["subdomínio falso", "https://evil-google.com/maps"],
    ["google.com fora do Maps/busca", "https://www.google.com/url?q=https://evil.com"],
    ["prefixo de caminho parecido", "https://www.google.com/mapsfoo"],
    ["goo.gl fora do Maps", "https://goo.gl/AbCdEf"],
    ["g.co fora do /kgs/", "https://g.co/AbCdEf"],
    ["g.co /kgs/ sem código", "https://g.co/kgs/"],
    ["usuário e senha", "https://user:pass@g.page/r/abc/review"],
    ["porta", "https://g.page:8443/r/abc/review"],
    ["javascript:", "javascript:alert(1)"],
    ["espaço", "https://g.page/r/abc review"],
    ["vazio", ""],
    ["sem protocolo", "g.page/r/abc/review"],
  ])("recusa %s", (_label, url) => {
    expect(isGoogleReviewUrl(url)).toBe(false);
  });

  it("recusa links longos demais", () => {
    expect(isGoogleReviewUrl(`https://g.page/r/${"a".repeat(500)}`)).toBe(false);
  });
});

describe("GoogleReviewUrl no contrato", () => {
  it("o SiteSpec aceita o campo opcional e recusa um link que não é do Google", () => {
    const withLink = {
      ...spec,
      business: { ...spec.business, googleReviewUrl: "https://g.page/r/abc/review" },
    };
    expect(SiteSpec.parse(withLink).business.googleReviewUrl).toBe("https://g.page/r/abc/review");
    expect(SiteSpec.parse(spec).business.googleReviewUrl).toBeUndefined();

    const bad = { ...spec, business: { ...spec.business, googleReviewUrl: "https://x.com/r" } };
    expect(SiteSpec.safeParse(bad).success).toBe(false);
  });

  it("a mensagem de erro é escrita para pessoas", () => {
    const result = GoogleReviewUrl.safeParse("https://example.com");
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toMatch(/review link you copied from Google/);
  });

  it("o pedido da API aceita um link ou null", () => {
    expect(UpdateReviewLinkRequest.parse({ url: null })).toEqual({ url: null });
    expect(UpdateReviewLinkRequest.safeParse({ url: "https://g.page/r/x/review" }).success).toBe(
      true,
    );
    expect(UpdateReviewLinkRequest.safeParse({ url: "https://bad.example" }).success).toBe(false);
    expect(UpdateReviewLinkRequest.safeParse({}).success).toBe(false);
    expect(
      ReviewLinkResponse.safeParse({
        siteId: "s1",
        googleReviewUrl: null,
        live: false,
        updatedAt: "2026-10-26T00:00:00.000Z",
      }).success,
    ).toBe(true);
  });
});
