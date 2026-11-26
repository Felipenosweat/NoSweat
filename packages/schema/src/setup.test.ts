import { describe, expect, it } from "vitest";
import { SetupSettings, SiteSetupRequest, SiteSetupResponse } from "./index";

const weekly = [
  [],
  [{ start: "09:00", end: "17:00" }],
  [{ start: "09:00", end: "17:00" }],
  [],
  [],
  [],
  [],
];

const valid = {
  kind: "shop",
  settings: {
    weekly,
    slotStepMinutes: 30,
    bufferMinutes: 0,
    minNoticeHours: 2,
    maxDaysAhead: 30,
    closedDates: ["2026-12-25"],
    note: "",
    cancellationPolicy: "Free cancellation up to 24 hours before your appointment.",
    cancellationHours: 24,
  },
  services: [{ name: "Haircut", durationMinutes: 45, priceCents: 4500 }],
  team: [{ name: "Ana", bio: "Color specialist." }],
};

describe("SiteSetupRequest", () => {
  it("accepts a complete request", () => {
    expect(SiteSetupRequest.safeParse(valid).success).toBe(true);
  });

  it("needs at least one service", () => {
    expect(SiteSetupRequest.safeParse({ ...valid, services: [] }).success).toBe(false);
  });

  it("rejects bad durations, bios and week shapes", () => {
    expect(
      SiteSetupRequest.safeParse({
        ...valid,
        services: [{ name: "Cut", durationMinutes: 2, priceCents: null }],
      }).success,
    ).toBe(false);
    expect(
      SiteSetupRequest.safeParse({ ...valid, team: [{ name: "Ana", bio: "x".repeat(201) }] })
        .success,
    ).toBe(false);
    expect(
      SiteSetupRequest.safeParse({ ...valid, settings: { ...valid.settings, weekly: [[]] } })
        .success,
    ).toBe(false);
  });

  it("rejects a range that ends before it starts and a malformed date", () => {
    const bad = [...weekly];
    bad[1] = [{ start: "17:00", end: "09:00" }];
    expect(
      SiteSetupRequest.safeParse({ ...valid, settings: { ...valid.settings, weekly: bad } })
        .success,
    ).toBe(false);
    expect(
      SiteSetupRequest.safeParse({
        ...valid,
        settings: { ...valid.settings, closedDates: ["12/25/2026"] },
      }).success,
    ).toBe(false);
  });

  it("allows working alone (no team) and a missing policy", () => {
    // Sem política: as duas chaves ficam de fora (são opcionais).
    const settings = { ...valid.settings, cancellationPolicy: undefined, cancellationHours: undefined };
    expect(SiteSetupRequest.safeParse({ ...valid, team: [], settings }).success).toBe(true);
  });
});

describe("SiteSetupResponse", () => {
  it("only lists known parts", () => {
    const ok = { siteId: "s1", saved: ["services", "hours"], services: 1, people: 0, notes: [] };
    expect(SiteSetupResponse.safeParse(ok).success).toBe(true);
    expect(SiteSetupResponse.safeParse({ ...ok, saved: ["nope"] }).success).toBe(false);
  });
});

describe("text reminders contract", () => {
  it("is optional everywhere and boolean when present", () => {
    const settings = { ...valid.settings };
    expect(SetupSettings.safeParse(settings).success).toBe(true);
    expect(SetupSettings.safeParse({ ...settings, smsReminders: true }).success).toBe(true);
    expect(SetupSettings.safeParse({ ...settings, smsReminders: "yes" }).success).toBe(false);
  });
});
