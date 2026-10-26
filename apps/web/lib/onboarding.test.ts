import { describe, expect, it } from "vitest";
import {
  TOUR_METADATA_KEY,
  TOUR_STEPS,
  clampStep,
  shouldAutoOpen,
  tourConfig,
  tourDoneAt,
  tourShortcuts,
  tourStepAt,
  tourStorageKey,
  type TourConfig,
} from "./onboarding";

const account: TourConfig = { autoShow: true, persist: "account", accountKey: "user-1" };

describe("TOUR_STEPS", () => {
  it("has 5 to 7 short steps with unique ids", () => {
    expect(TOUR_STEPS.length).toBeGreaterThanOrEqual(5);
    expect(TOUR_STEPS.length).toBeLessThanOrEqual(7);
    expect(new Set(TOUR_STEPS.map((step) => step.id)).size).toBe(TOUR_STEPS.length);
    for (const step of TOUR_STEPS) {
      expect(step.title.length).toBeLessThanOrEqual(40);
      expect(step.body.length).toBeLessThanOrEqual(200);
    }
  });

  it("starts with the welcome and ends with where to get help", () => {
    expect(TOUR_STEPS[0]?.id).toBe("welcome");
    expect(TOUR_STEPS.at(-1)?.id).toBe("help");
  });

  it("never promises online payments or posting without approval", () => {
    const text = TOUR_STEPS.map((step) => `${step.title} ${step.body}`)
      .join(" ")
      .toLowerCase();
    expect(text).not.toMatch(/pay online|card payment|credit card/);
    expect(text).toContain("approve");
  });
});

describe("tourDoneAt", () => {
  it("reads the date from user_metadata", () => {
    expect(tourDoneAt({ [TOUR_METADATA_KEY]: "2026-10-26T12:00:00.000Z" })).toBe(
      "2026-10-26T12:00:00.000Z",
    );
  });

  it("ignores missing or malformed values", () => {
    expect(tourDoneAt(null)).toBeNull();
    expect(tourDoneAt("nope")).toBeNull();
    expect(tourDoneAt({})).toBeNull();
    expect(tourDoneAt({ [TOUR_METADATA_KEY]: 123 })).toBeNull();
    expect(tourDoneAt({ [TOUR_METADATA_KEY]: "  " })).toBeNull();
  });
});

describe("tourConfig", () => {
  it("shows once for an account that hasn't seen it, saving on the account", () => {
    expect(
      tourConfig({ accountId: "u1", authEnabled: true, viewingAs: false, metadata: {} }),
    ).toEqual({ autoShow: true, persist: "account", accountKey: "u1" });
  });

  it("doesn't show again once the account has the date", () => {
    const config = tourConfig({
      accountId: "u1",
      authEnabled: true,
      viewingAs: false,
      metadata: { first_name: "Ana", [TOUR_METADATA_KEY]: "2026-10-01T00:00:00.000Z" },
    });
    expect(config.autoShow).toBe(false);
    expect(config.persist).toBe("account");
  });

  it("never shows or saves in view-as mode", () => {
    expect(
      tourConfig({ accountId: "admin", authEnabled: true, viewingAs: true, metadata: {} }),
    ).toEqual({ autoShow: false, persist: "none", accountKey: "admin" });
  });

  it("uses only the browser without Supabase (dev)", () => {
    expect(
      tourConfig({ accountId: "local-dev", authEnabled: false, viewingAs: false, metadata: null }),
    ).toEqual({ autoShow: true, persist: "local", accountKey: "local-dev" });
  });
});

describe("shouldAutoOpen", () => {
  const base = { config: account, pathname: "/dashboard", locallyDone: false, alreadyTried: false };

  it("opens on the dashboard the first time", () => {
    expect(shouldAutoOpen(base)).toBe(true);
  });

  it("only opens on the dashboard", () => {
    expect(shouldAutoOpen({ ...base, pathname: "/clients" })).toBe(false);
    expect(shouldAutoOpen({ ...base, pathname: "/dashboard/x" })).toBe(false);
  });

  it("never opens twice", () => {
    expect(shouldAutoOpen({ ...base, alreadyTried: true })).toBe(false);
    expect(shouldAutoOpen({ ...base, locallyDone: true })).toBe(false);
    expect(shouldAutoOpen({ ...base, config: { ...account, autoShow: false } })).toBe(false);
  });
});

describe("clampStep", () => {
  it("keeps the index inside the steps", () => {
    expect(clampStep(-1)).toBe(0);
    expect(clampStep(2)).toBe(2);
    expect(clampStep(99)).toBe(TOUR_STEPS.length - 1);
    expect(clampStep(Number.NaN)).toBe(0);
    expect(clampStep(3, 0)).toBe(0);
  });
});

describe("tourStepAt", () => {
  it("always returns a step, even out of range", () => {
    expect(tourStepAt(0).id).toBe("welcome");
    expect(tourStepAt(-5).id).toBe("welcome");
    expect(tourStepAt(1000).id).toBe("help");
  });
});

describe("tourShortcuts", () => {
  it("points to the latest site, a new client and business settings", () => {
    expect(tourShortcuts("site-1").map((s) => [s.label, s.href])).toEqual([
      ["Finish my website", "/sites/site-1"],
      ["Add my first client", "/clients/new"],
      ["Set up business settings", "/office/settings"],
    ]);
  });

  it("sends to /create when there's no site yet", () => {
    expect(tourShortcuts(null)[0]).toMatchObject({ label: "Create my website", href: "/create" });
  });
});

describe("tourStorageKey", () => {
  it("is per account", () => {
    expect(tourStorageKey("a")).not.toBe(tourStorageKey("b"));
  });
});
