import { describe, expect, it } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { LANDING_FAQS } from "@/components/marketing/faqs";
import { PLANS } from "@/server/billing/plans";
import { llmsText } from "./llms";
import { SITE_ORIGIN } from "./site";
import { faqPage, jsonLd, organization, product, website } from "./structured-data";

describe("SEO do nosweatfd.com", () => {
  it("usa o endereço final (com www) em todo lugar", () => {
    expect(SITE_ORIGIN).toBe("https://www.nosweatfd.com");
    for (const entry of sitemap()) expect(entry.url.startsWith(SITE_ORIGIN)).toBe(true);
    expect(robots().sitemap).toBe(`${SITE_ORIGIN}/sitemap.xml`);
  });

  it("lista as páginas públicas no sitemap e esconde as áreas logadas no robots", () => {
    const urls = sitemap().map((e) => e.url);
    expect(urls).toEqual(expect.arrayContaining([`${SITE_ORIGIN}/`, `${SITE_ORIGIN}/pricing`]));
    const rules = robots().rules;
    const disallow = Array.isArray(rules) ? [] : [rules.disallow].flat();
    expect(disallow).toEqual(expect.arrayContaining(["/api/", "/dashboard", "/sites"]));
    // Os sites dos clientes continuam abertos para buscadores.
    expect(disallow).not.toContain("/s/");
  });

  it("monta um JSON-LD válido, sem notas nem avaliações inventadas", () => {
    const raw = jsonLd(organization(), website(), product(), faqPage(LANDING_FAQS, "/"));
    const data = JSON.parse(raw) as { "@graph": { "@type": string }[] };
    expect(data["@graph"].map((n) => n["@type"])).toEqual([
      "Organization",
      "WebSite",
      "SoftwareApplication",
      "FAQPage",
    ]);
    expect(raw).not.toMatch(/aggregateRating|"@type":"Review"|ratingValue/);
    expect(raw).not.toContain("</script");
  });

  it("usa os preços cobrados de verdade", () => {
    const offers = product().offers;
    for (const plan of Object.values(PLANS)) {
      expect(offers).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ price: (plan.monthlyCents / 100).toFixed(2) }),
          expect.objectContaining({ price: (plan.annualCents / 100).toFixed(2) }),
        ]),
      );
    }
  });

  it("o llms.txt resume o produto com os mesmos preços e perguntas do site", () => {
    const text = llmsText();
    expect(text.startsWith("# No Sweat\n")).toBe(true);
    expect(text).toContain("$39/month");
    expect(text).toContain(LANDING_FAQS[0]!.question);
    expect(text).toContain(`${SITE_ORIGIN}/pricing`);
  });
});
