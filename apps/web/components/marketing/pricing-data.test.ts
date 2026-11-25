import { describe, expect, it } from "vitest";
import { PLANS } from "@/server/billing/plans";
import { CREDIT_COSTS, MONTHLY_CREDITS, TOPUP_PACKS } from "@/server/credits/pricing";
import { LANDING_FAQS, PRICING_FAQS } from "./faqs";
import { CANCELLATION_TERMS, GUARANTEE_LINE, REFUND_TERMS } from "./legal/policy";
import { planPrices, pricingCredits, usd } from "./pricing-data";

// Auditoria J9/J11/J12: o que a página de preços e o FAQ dizem vem das fontes únicas e não
// promete "AI edits: Included".

describe("pricing data", () => {
  it("formats prices like the pricing table always showed them", () => {
    expect(usd(3900)).toBe("$39");
    expect(usd(3250)).toBe("$32.50");
    expect(usd(129000)).toBe("$1,290");
    const prices = planPrices();
    expect(prices.starter).toMatchObject({
      monthly: "$19",
      annual: "$190",
      annualPerMonth: "$15.83",
    });
    expect(prices.pro.publishedSitesLimit).toBe(PLANS.pro.publishedSitesLimit);
    expect(prices.premium.annualPerMonth).toBe("$107.50");
  });

  it("reads credits from server/credits/pricing.ts", () => {
    const credits = pricingCredits();
    expect(credits.monthly).toEqual({
      starter: MONTHLY_CREDITS.starter,
      pro: MONTHLY_CREDITS.pro,
      premium: MONTHLY_CREDITS.premium,
    });
    expect(credits.costs.find((c) => c.label === "AI change to your website")?.credits).toBe(
      CREDIT_COSTS.ai_edit,
    );
    expect(credits.packs).toHaveLength(TOPUP_PACKS.length);
  });
});

describe("FAQ answers", () => {
  const all = [...LANDING_FAQS, ...PRICING_FAQS];
  const answer = (list: typeof all, question: string) =>
    list.find((faq) => faq.question === question)?.answer ?? "";

  it("never says AI edits are included", () => {
    for (const faq of all) expect(faq.answer).not.toMatch(/AI edits are included|Included/);
  });

  it("states the monthly credits of each plan and what an AI change costs", () => {
    const ai = answer(LANDING_FAQS, "Can AI change my site for me?");
    expect(ai).toContain(`${MONTHLY_CREDITS.starter} AI credits a month`);
    expect(ai).toContain(MONTHLY_CREDITS.premium.toLocaleString("en-US"));
    expect(ai).toContain(`each change costs ${CREDIT_COSTS.ai_edit}`);
    expect(ai).toContain("by hand is always free");
  });

  it("uses the same cancellation and refund words as the Terms", () => {
    expect(answer(LANDING_FAQS, "Can I cancel?")).toBe(`Yes. ${CANCELLATION_TERMS}`);
    expect(answer(PRICING_FAQS, "Can I cancel?")).toBe(`Yes. ${CANCELLATION_TERMS}`);
    expect(answer(PRICING_FAQS, "Can I get a refund?")).toContain(REFUND_TERMS);
    expect(GUARANTEE_LINE).toBe("30-day money-back guarantee on your first payment.");
  });
});
