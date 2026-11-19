import { describe, expect, it } from "vitest";
import { PLANS } from "./plans";
import { nextPlanId, upgradeGains } from "./upgrade";

describe("nextPlanId", () => {
  it("goes Starter → Pro → Premium and stops there", () => {
    expect(nextPlanId("starter")).toBe("pro");
    expect(nextPlanId("pro")).toBe("premium");
    expect(nextPlanId("premium")).toBeNull();
  });
});

describe("upgradeGains", () => {
  it("lists what the next plan adds, with the current numbers beside it", () => {
    const gains = upgradeGains(PLANS.starter, PLANS.pro, { from: 60, to: 400 });
    expect(gains).toEqual([
      `${PLANS.pro.publishedSitesLimit} live websites (you have ${PLANS.starter.publishedSitesLimit})`,
      "400 AI credits every month (you have 60)",
      `${PLANS.pro.socialPostsPerMonth} Instagram posts a month (you have ${PLANS.starter.socialPostsPerMonth})`,
    ]);
  });

  it("skips what does not grow", () => {
    expect(upgradeGains(PLANS.pro, PLANS.pro, { from: 400, to: 400 })).toEqual([]);
  });
});
