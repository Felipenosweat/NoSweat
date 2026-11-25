import { DEFAULT_BOOKING_SETTINGS, type PriceItem } from "@nosweat/schema";
import { fixtures } from "@nosweat/fixtures";
import { describe, expect, it } from "vitest";
import {
  buildSetupRequest,
  clockLabel,
  formatDuration,
  formatPriceText,
  initialState,
  listWindows,
  nameKey,
  parseDurationText,
  parsePriceText,
  rangesForDay,
  rangesForWindows,
  setupDone,
  setupKindFor,
  shopStep,
  stateProblem,
  stepProblem,
  STEPS,
  windowCount,
  type DayHours,
  type WizardService,
  type WizardState,
} from "./wizard";

const day = (over: Partial<DayHours> = {}): DayHours => ({
  open: true,
  start: "09:00",
  end: "17:00",
  lunch: false,
  lunchStart: "12:00",
  lunchEnd: "13:00",
  ...over,
});

const service = (over: Partial<WizardService> = {}): WizardService => ({
  key: "s",
  name: "Haircut",
  description: "",
  durationMinutes: 45,
  price: "45",
  priceFrom: false,
  existing: false,
  ...over,
});

function shopState(over: Partial<WizardState> = {}): WizardState {
  const base = initialState({
    kind: "shop",
    spec: fixtures["glow-salon"],
    settings: DEFAULT_BOOKING_SETTINGS,
    settingsSaved: false,
    priceItems: [],
  });
  return { ...base, ...over };
}

describe("setupKindFor", () => {
  it("maps the templates that get a wizard", () => {
    expect(setupKindFor("beauty")).toBe("shop");
    expect(setupKindFor("professional")).toBe("shop");
    expect(setupKindFor("home-services")).toBe("home");
    expect(setupKindFor("restaurant")).toBeNull();
    expect(setupKindFor("portfolio")).toBeNull();
  });
});

describe("formatting and parsing", () => {
  it("formats durations", () => {
    expect(formatDuration(15)).toBe("15 min");
    expect(formatDuration(60)).toBe("1 hr");
    expect(formatDuration(90)).toBe("1 hr 30 min");
    expect(formatDuration(180)).toBe("3 hr");
  });

  it("reads durations written by the owner", () => {
    expect(parseDurationText("60 min")).toBe(60);
    expect(parseDurationText("About 3 hours")).toBe(180);
    expect(parseDurationText("1 hr 30 min")).toBe(90);
    expect(parseDurationText("By request")).toBeNull();
    expect(parseDurationText("Lasts up to 12 weeks")).toBeNull();
  });

  it("formats and reads prices", () => {
    expect(formatPriceText(4500)).toBe("$45");
    expect(formatPriceText(4550)).toBe("$45.50");
    expect(formatPriceText(8500, true)).toBe("from $85");
    expect(parsePriceText("from $85")).toEqual({ cents: 8500, from: true });
    expect(parsePriceText("$45")).toEqual({ cents: 4500, from: false });
    expect(parsePriceText("$1,250.50")).toEqual({ cents: 125050, from: false });
    expect(parsePriceText("$50 - $80")).toEqual({ cents: 5000, from: true });
    expect(parsePriceText("By request")).toBeNull();
  });

  it("labels clock times and matches names loosely", () => {
    expect(clockLabel("08:00")).toBe("8 AM");
    expect(clockLabel("12:30")).toBe("12:30 PM");
    expect(clockLabel("00:00")).toBe("12 AM");
    expect(nameKey("  Haircut   Women ")).toBe(nameKey("haircut women"));
  });
});

describe("weekly hours", () => {
  it("makes one range, or two around a lunch break", () => {
    expect(rangesForDay(day())).toEqual([{ start: "09:00", end: "17:00" }]);
    expect(rangesForDay(day({ lunch: true }))).toEqual([
      { start: "09:00", end: "12:00" },
      { start: "13:00", end: "17:00" },
    ]);
    expect(rangesForDay(day({ open: false }))).toEqual([]);
  });

  it("ignores a lunch break that sits outside the open hours", () => {
    expect(rangesForDay(day({ lunch: true, lunchStart: "08:00", lunchEnd: "09:30" }))).toEqual([
      { start: "09:00", end: "17:00" },
    ]);
  });
});

describe("arrival windows", () => {
  const windows = { start: "08:00", end: "16:00", length: 120 };

  it("lists the windows", () => {
    expect(windowCount(windows)).toBe(4);
    expect(listWindows(windows).map((w) => w.label)).toEqual([
      "8 AM – 10 AM",
      "10 AM – 12 PM",
      "12 PM – 2 PM",
      "2 PM – 4 PM",
    ]);
  });

  it("drops a window that does not fit", () => {
    const short = { start: "08:00", end: "15:00", length: 120 };
    expect(windowCount(short)).toBe(3);
    expect(rangesForWindows(day(), short)).toEqual([{ start: "08:00", end: "14:00" }]);
    expect(rangesForWindows(day({ open: false }), windows)).toEqual([]);
  });
});

describe("initialState", () => {
  it("prefills services from the site (price, from, duration)", () => {
    const state = shopState();
    const cut = state.services.find((s) => s.name === "Precision cut and blowout");
    expect(cut).toMatchObject({ price: "85", priceFrom: true, durationMinutes: 60 });
    const color = state.services.find((s) => s.name === "Balayage");
    expect(color?.durationMinutes).toBe(180);
    expect(state.people.map((p) => p.name)).toContain("Camila Reyes");
    expect(state.alone).toBe(false);
  });

  it("prefers the owner's bookable price items", () => {
    const item: PriceItem = {
      id: "p1",
      name: "Blowout",
      description: "Wash and style",
      unitPriceCents: 6000,
      unit: "each",
      taxable: true,
      active: true,
      bookable: true,
      durationMinutes: 50,
      createdAt: "",
      updatedAt: "",
    };
    const state = initialState({
      kind: "shop",
      spec: fixtures["glow-salon"],
      settings: DEFAULT_BOOKING_SETTINGS,
      settingsSaved: true,
      priceItems: [item],
    });
    const blowout = state.services.filter((s) => nameKey(s.name) === "blowout");
    expect(blowout).toHaveLength(1);
    expect(blowout[0]).toMatchObject({ price: "60", durationMinutes: 50, priceFrom: false });
    expect(state.policyPreset).toBe("none");
  });

  it("starts the home wizard with the first window preset and the service area", () => {
    const state = initialState({
      kind: "home",
      spec: fixtures["joes-plumbing"],
      settings: DEFAULT_BOOKING_SETTINGS,
      settingsSaved: false,
      priceItems: [],
    });
    expect(state.windows).toEqual({ start: "08:00", end: "16:00", length: 120 });
    expect(state.serviceArea).toBe("Austin, Round Rock, Cedar Park and nearby");
    expect(state.services.every((s) => s.durationMinutes === 120)).toBe(true);
    expect(state.policyPreset).toBe("24h");
  });
});

describe("buildSetupRequest", () => {
  it("maps a shop state to settings, services and people", () => {
    const state = shopState({
      days: [
        day({ open: false }),
        day({ lunch: true }),
        ...Array.from({ length: 5 }, () => day({ open: false })),
      ],
      closedDates: ["2026-12-25", "2026-12-24", "2026-12-25"],
      services: [
        service({ name: " Haircut ", price: "$45", priceFrom: true }),
        service({
          key: "b",
          name: "Color",
          description: "Root touch-up",
          durationMinutes: 90,
          price: "",
        }),
      ],
      alone: false,
      people: [{ key: "p", name: "Ana", role: "Owner", bio: "Colorist." }],
      removed: ["Old service"],
    });
    const result = buildSetupRequest(state);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const { request } = result;
    expect(request.settings.weekly[1]).toEqual([
      { start: "09:00", end: "12:00" },
      { start: "13:00", end: "17:00" },
    ]);
    expect(request.settings.weekly[0]).toEqual([]);
    expect(request.settings.closedDates).toEqual(["2026-12-24", "2026-12-25"]);
    expect(request.settings.slotStepMinutes).toBe(15);
    expect(request.services[0]).toMatchObject({
      name: "Haircut",
      priceCents: 4500,
      priceFrom: true,
    });
    expect(request.services[1]?.priceCents).toBeNull();
    expect(request.team).toEqual([{ name: "Ana", role: "Owner", bio: "Colorist." }]);
    expect(request.removedServices).toEqual(["Old service"]);
    expect(request.serviceArea).toBeUndefined();
  });

  it("maps arrival windows to one range per day, step and visit length", () => {
    const state = initialState({
      kind: "home",
      spec: fixtures["joes-plumbing"],
      settings: DEFAULT_BOOKING_SETTINGS,
      settingsSaved: false,
      priceItems: [],
    });
    const result = buildSetupRequest({
      ...state,
      days: state.days.map((d, i) => ({ ...d, open: i >= 1 && i <= 5 })),
      phone: "(512) 555-0100",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const { settings, services, serviceArea, phone } = result.request;
    expect(settings.slotStepMinutes).toBe(120);
    expect(settings.weekly[1]).toEqual([{ start: "08:00", end: "16:00" }]);
    expect(settings.weekly[6]).toEqual([]);
    expect(services.every((s) => s.durationMinutes === 120)).toBe(true);
    expect(serviceArea).toBe("Austin, Round Rock, Cedar Park and nearby");
    expect(phone).toBe("(512) 555-0100");
  });

  it("drops the policy when the owner chose none and the team when working alone", () => {
    const result = buildSetupRequest(
      shopState({
        policyPreset: "none",
        alone: true,
        people: [{ key: "p", name: "Ana", role: "", bio: "" }],
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.request.settings.cancellationPolicy).toBeUndefined();
    expect(result.request.team).toEqual([]);
  });

  it("explains problems in plain English", () => {
    const closed = shopState().days.map((d) => ({ ...d, open: false }));
    expect(stateProblem(shopState({ days: closed }))).toMatch(/at least one day/);
    expect(stateProblem(shopState({ services: [service({ name: "" })] }))).toMatch(
      /name every service/,
    );
    expect(stateProblem(shopState({ services: [service(), service({ key: "dup" })] }))).toMatch(
      /listed twice/,
    );
    expect(stateProblem(shopState({ services: [service({ price: "abc" })] }))).toMatch(
      /should look like/,
    );
    expect(
      stateProblem(
        shopState({ alone: false, people: [{ key: "x", name: " ", role: "", bio: "" }] }),
      ),
    ).toMatch(/name every person/);
    const long = buildSetupRequest(
      shopState({
        alone: false,
        people: [{ key: "x", name: "Ana", role: "", bio: "x".repeat(250) }],
      }),
    );
    expect(long.ok).toBe(false);
  });
});

describe("shopStep", () => {
  it("uses the biggest step that divides every duration", () => {
    const of = (...minutes: number[]) =>
      shopStep({ services: minutes.map((durationMinutes) => service({ durationMinutes })) });
    expect(of(60, 120)).toBe(60);
    expect(of(60, 90)).toBe(30);
    expect(of(45)).toBe(15);
  });
});

describe("setupDone", () => {
  const item = { active: true, bookable: true, durationMinutes: 30 };
  it("needs booking on and a bookable service", () => {
    expect(setupDone({ enabled: true }, [item])).toBe(true);
    expect(setupDone({ enabled: false }, [item])).toBe(false);
    expect(setupDone({ enabled: true }, [])).toBe(false);
    expect(setupDone({ enabled: true }, [{ ...item, active: false }])).toBe(false);
    expect(setupDone({ enabled: true }, [{ ...item, durationMinutes: null }])).toBe(false);
  });
});

describe("stepProblem", () => {
  it("checks one step at a time", () => {
    const state = shopState();
    expect(STEPS.shop).toEqual(["hours", "services", "team", "rules", "review"]);
    expect(STEPS.home).toEqual(["days", "services", "area", "rules", "review"]);
    expect(stepProblem(state, "review")).toBeNull();
    expect(stepProblem({ ...state, services: [service({ name: "" })] }, "hours")).toBeNull();
    expect(stepProblem({ ...state, services: [] }, "services")).toMatch(/at least one service/);
    expect(
      stepProblem({ ...state, policyPreset: "custom", cancellationPolicy: " " }, "rules"),
    ).toMatch(/cancellation policy/);
    expect(
      stepProblem({ ...state, policyPreset: "none", cancellationPolicy: "" }, "rules"),
    ).toBeNull();
    const lunch = state.days.map((d) => ({ ...d, open: true, lunch: true, lunchStart: "08:00" }));
    expect(stepProblem({ ...state, days: lunch }, "hours")).toMatch(/lunch break/);
  });
});

describe("US details", () => {
  it("derives the time zone from the business state and keeps a saved one", () => {
    const glow = fixtures["glow-salon"];
    const withState = (state: string) => ({
      ...glow,
      business: { ...glow.business, state },
    });
    const base = {
      kind: "shop" as const,
      settings: DEFAULT_BOOKING_SETTINGS,
      priceItems: [],
    };
    const tx = initialState({ ...base, spec: withState("TX"), settingsSaved: false });
    expect(tx.timeZone).toBe("America/Chicago");
    const saved = initialState({
      ...base,
      spec: withState("TX"),
      settingsSaved: true,
      timeZone: "America/Denver",
    });
    expect(saved.timeZone).toBe("America/Denver");
  });

  it("sends the time zone and, for home services, the address", () => {
    const state = initialState({
      kind: "home",
      spec: fixtures["joes-plumbing"],
      settings: DEFAULT_BOOKING_SETTINGS,
      settingsSaved: false,
      priceItems: [],
    });
    const result = buildSetupRequest({ ...state, city: "Austin", state: "TX", zip: "78701" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.request).toMatchObject({ city: "Austin", state: "TX", zip: "78701" });
    expect(result.request.timeZone).toBeTruthy();
    expect(buildSetupRequest({ ...state, zip: "787" }).ok).toBe(false);
  });
});
