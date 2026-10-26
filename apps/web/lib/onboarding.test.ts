import { describe, expect, it } from "vitest";
import {
  TOUR_FINISH,
  TOUR_METADATA_KEY,
  TOUR_WELCOME,
  clampStep,
  shouldAutoOpen,
  tourConfig,
  tourDoneAt,
  tourShortcuts,
  tourStorageKey,
  type TourConfig,
} from "./onboarding";

const account: TourConfig = { autoShow: true, persist: "account", accountKey: "user-1" };

describe("TOUR_WELCOME / TOUR_FINISH", () => {
  it("are short, with the welcome art first and the help art last", () => {
    for (const sheet of [TOUR_WELCOME, TOUR_FINISH]) {
      expect(sheet.title.length).toBeLessThanOrEqual(40);
      expect(sheet.body.length).toBeLessThanOrEqual(200);
    }
    expect(TOUR_WELCOME.art).toBe("welcome");
    expect(TOUR_FINISH.art).toBe("help");
    expect(TOUR_WELCOME.id).not.toBe(TOUR_FINISH.id);
  });

  it("never promises online payments", () => {
    const text = `${TOUR_WELCOME.body} ${TOUR_FINISH.body}`.toLowerCase();
    expect(text).not.toMatch(/pay online|card payment|credit card/);
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
    expect(clampStep(-1, 5)).toBe(0);
    expect(clampStep(2, 5)).toBe(2);
    expect(clampStep(99, 5)).toBe(4);
    expect(clampStep(2.7, 5)).toBe(2);
    expect(clampStep(Number.NaN, 5)).toBe(0);
    expect(clampStep(3, 0)).toBe(0);
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
