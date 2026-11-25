import { describe, expect, it } from "vitest";
import {
  annualSavingsCents,
  currentOffer,
  offerAt,
  OFFERS,
  PLANS,
  promoActive,
  promoPercentOff,
} from "./plans";

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
    // Só o Starter tem preço normal acima do cobrado; Pro e Premium não sobem.
    expect(promoPercentOff(PLANS.starter)).toBe(51);
    expect(promoPercentOff(PLANS.pro)).toBe(0);
    expect(promoPercentOff(PLANS.premium)).toBe(0);
    // Preços subidos (normal igual ao cobrado): sem desconto.
    expect(promoPercentOff({ ...PLANS.pro, regularMonthlyCents: PLANS.pro.monthlyCents })).toBe(0);
  });

  it("gives a real bonus with every offer, also after the calendar ends", () => {
    expect(offerAt(new Date("2026-11-26T12:00:00Z"))).toEqual({
      name: "Black Friday",
      bonusCredits: 100,
    });
    expect(offerAt(new Date("2027-03-01T12:00:00Z")).bonusCredits).toBeGreaterThan(0);
  });

  it("compares the annual price with 12 monthly payments", () => {
    expect(annualSavingsCents(PLANS.starter)).toBe(3800);
    expect(annualSavingsCents(PLANS.pro)).toBe(13800);
    expect(annualSavingsCents(PLANS.premium)).toBe(25800);
  });
});
