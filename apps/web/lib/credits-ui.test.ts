import { describe, expect, it } from "vitest";
import {
  applyCreditsEvent,
  costNote,
  creditState,
  creditsLabel,
  pillAriaLabel,
  pillText,
  refillDate,
  type PillBalance,
} from "./credits-ui";

const balance = (over: Partial<PillBalance> = {}): PillBalance => ({
  unlimited: false,
  total: 27,
  monthlyAllowance: 150,
  resetsAt: "2026-12-01T00:00:00.000Z",
  ...over,
});

describe("creditState", () => {
  it("is ok with plenty of credits", () => {
    expect(creditState(balance())).toBe("ok");
  });

  it("is low at 5 credits or fewer", () => {
    expect(creditState(balance({ total: 5, monthlyAllowance: 20 }))).toBe("low");
    expect(creditState(balance({ total: 6, monthlyAllowance: 20 }))).toBe("ok");
  });

  it("is low at 20% of the monthly allowance or less", () => {
    expect(creditState(balance({ total: 30, monthlyAllowance: 150 }))).toBe("low");
    expect(creditState(balance({ total: 31, monthlyAllowance: 150 }))).toBe("ok");
  });

  it("is empty at zero", () => {
    expect(creditState(balance({ total: 0 }))).toBe("empty");
  });

  it("is unlimited for admins, whatever the numbers", () => {
    expect(creditState(balance({ unlimited: true, total: 0 }))).toBe("unlimited");
  });
});

describe("labels", () => {
  it("pluralizes credits", () => {
    expect(creditsLabel(1)).toBe("1 credit");
    expect(creditsLabel(0)).toBe("0 credits");
    expect(creditsLabel(1200)).toBe("1,200 credits");
  });

  it("formats the refill date in UTC", () => {
    expect(refillDate("2026-12-01T00:00:00.000Z")).toBe("Dec 1");
    expect(refillDate("not a date")).toBeNull();
  });

  it("writes the pill text for each state", () => {
    expect(pillText(balance())).toBe("27 credits");
    expect(pillText(balance({ total: 0 }))).toBe("Get credits");
    expect(pillText(balance({ unlimited: true }))).toBe("Unlimited");
  });

  it("writes the accessible label with the refill date", () => {
    expect(pillAriaLabel(balance())).toBe("AI credits: 27 left, refills Dec 1");
    expect(pillAriaLabel(balance({ total: 0 }))).toBe(
      "AI credits: none left, refills Dec 1. Get more credits",
    );
    expect(pillAriaLabel(balance({ unlimited: true }))).toBe("AI credits: unlimited");
  });
});

describe("applyCreditsEvent", () => {
  it("sets the new balance", () => {
    expect(applyCreditsEvent(balance(), { left: 12 }).total).toBe(12);
  });

  it("subtracts what was spent, never below zero", () => {
    expect(applyCreditsEvent(balance({ total: 7 }), { spent: 5 }).total).toBe(2);
    expect(applyCreditsEvent(balance({ total: 3 }), { spent: 5 }).total).toBe(0);
  });

  it("ignores empty events and admins", () => {
    const current = balance();
    expect(applyCreditsEvent(current, {})).toBe(current);
    const admin = balance({ unlimited: true });
    expect(applyCreditsEvent(admin, { left: 1 })).toBe(admin);
  });
});

describe("costNote", () => {
  it("shows the cost and the balance", () => {
    expect(costNote("Creating your website", 5, 30)).toEqual({
      text: "Creating your website uses 5 credits · you have 30",
      short: false,
    });
  });

  it("flags when the balance does not cover the cost", () => {
    expect(costNote("Creating your website", 5, 3).short).toBe(true);
  });

  it("shows only the cost when the balance is unknown", () => {
    expect(costNote("One caption", 1, null)).toEqual({ text: "One caption uses 1 credit", short: false });
  });
});
