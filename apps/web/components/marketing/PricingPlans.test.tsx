import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PLANS, promoPercentOff } from "@/server/billing/plans";
import { MONTHLY_CREDITS } from "@/server/credits/pricing";
import { PricingPlans } from "./PricingPlans";

// A tabela de planos é a mesma na landing ("plain") e no /pricing ("cards"): os botões, o
// toggle e as regras de renovação não podem mudar entre as duas.

const render = (props: Parameters<typeof PricingPlans>[0]) =>
  renderToStaticMarkup(<PricingPlans {...props} />);

const createLinks = (html: string) => html.match(/href="\/create"/g)?.length ?? 0;

describe("PricingPlans", () => {
  it("default cards keep the receipt lines and the Build my website buttons", () => {
    const html = render({ checkout: true });
    expect(html).toContain("Setup, one time");
    expect(html).toContain("Build my website");
    expect(createLinks(html)).toBe(3);
  });

  it("plain variant drops the receipt and highlights Starter", () => {
    const html = render({ checkout: true, variant: "plain" });
    expect(html).not.toContain("Setup, one time");
    expect(html).toContain("A good place to start");
    expect(html).toContain("Start my website");
    expect(createLinks(html)).toBe(3);
    // Mesmo toggle e mesmas regras de renovação.
    expect(html).toContain('name="billing"');
    expect(html).toContain("Renews automatically every year");
    expect(html).toContain('href="/billing"');
  });

  it("plain variant lists real limits read from the plans and credits", () => {
    const html = render({ checkout: false, variant: "plain" });
    expect(html).toContain(`${MONTHLY_CREDITS.starter} AI credits a month`);
    expect(html).toContain(`${PLANS.pro.socialPostsPerMonth} Instagram posts a month`);
    expect(html).toContain(`Up to ${PLANS.premium.publishedSitesLimit} live websites`);
    expect(html).toContain("It does not renew automatically");
  });

  it("plain variant strikes the regular price only for plans on offer", () => {
    const html = render({ checkout: true, variant: "plain", promo: true });
    const struck = html.match(/<s>[^<]+<\/s>/g) ?? [];
    const onOffer = Object.values(PLANS).filter((plan) => promoPercentOff(plan) > 0);
    expect(struck).toHaveLength(onOffer.length);
  });
});
