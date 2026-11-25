import { describe, expect, it } from "vitest";
import { currentOffer, OFFERS, PLANS, promoActive, promoPercentOff } from "./plans";

describe("launch offer", () => {
  it("names the offer by the calendar and falls back to a plain launch price", () => {
    expect(currentOffer(new Date("2026-11-20T12:00:00Z"))).toBe("Black Friday");
    expect(currentOffer(new Date("2026-12-01T12:00:00Z"))).toBe("Cyber Week");
    expect(currentOffer(new Date("2026-12-25T12:00:00Z"))).toBe("Christmas Offer");
    expect(currentOffer(new Date("2027-03-01T12:00:00Z"))).toBe("Launch price");
  });

  it("keeps the calendar in date order", () => {
    const dates = OFFERS.map((offer) => Date.parse(offer.endsOn));
    expect(dates).toEqual([...dates].sort((a, b) => a - b));
  });

  it("has no end date: it lasts while the charged price is under the regular price", () => {
    expect(promoActive()).toBe(true);
    // Preço normal depois da oferta: Starter $39, Pro $89, Premium $179.
    expect(promoPercentOff(PLANS.starter)).toBe(51);
    expect(promoPercentOff(PLANS.pro)).toBe(22);
    expect(promoPercentOff(PLANS.premium)).toBe(28);
    // Preços subidos (normal igual ao cobrado): sem desconto.
    expect(promoPercentOff({ ...PLANS.pro, regularMonthlyCents: PLANS.pro.monthlyCents })).toBe(0);
  });
});
