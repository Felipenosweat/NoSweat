import { fixtures } from "@nosweat/fixtures";
import type { SiteSetupRequest } from "@nosweat/schema";
import { beforeEach, describe, expect, it } from "vitest";
import { DEV_USER } from "../auth/session";
import { listPriceItems, listTeam } from "../office/service";
import { resetMemoryOfficeStore } from "../office/store";
import { OfficeError } from "../office/types";
import { getSiteStore } from "../store";
import { getBookingSettings } from "./service";
import { resetMemoryBookingStore } from "./store";
import { applySetup, planSetup, validateSetup } from "./setup";

const OWNER = DEV_USER.id;

const open = { start: "09:00", end: "17:00" };

function request(over: Partial<SiteSetupRequest> = {}): SiteSetupRequest {
  return {
    kind: "shop",
    settings: {
      weekly: [[], [open], [open], [open], [open], [open], []],
      slotStepMinutes: 15,
      bufferMinutes: 5,
      minNoticeHours: 2,
      maxDaysAhead: 30,
      closedDates: ["2026-12-25"],
      note: "Please arrive 5 minutes early.",
      cancellationPolicy: "Free cancellation up to 24 hours before your appointment.",
      cancellationHours: 24,
    },
    services: [
      { name: "Blowout", durationMinutes: 50, priceCents: 6000 },
      { name: "Gel manicure", durationMinutes: 45, priceCents: 4500, priceFrom: true },
    ],
    team: [{ name: "Camila Reyes", role: "Owner", bio: "Color and balayage." }],
    ...over,
  };
}

async function newSite() {
  return getSiteStore().create(fixtures["glow-salon"], OWNER);
}

beforeEach(() => {
  resetMemoryOfficeStore();
  resetMemoryBookingStore();
});

describe("validateSetup", () => {
  it("rejects overlapping hours, no open day, fake dates and duplicates", () => {
    const base = request();
    const overlap = {
      ...base.settings,
      weekly: [[], [open, { start: "16:00", end: "18:00" }], [], [], [], [], []],
    };
    expect(() => validateSetup({ ...base, settings: overlap })).toThrow(OfficeError);
    expect(() =>
      validateSetup({
        ...base,
        settings: { ...base.settings, weekly: [[], [], [], [], [], [], []] },
      }),
    ).toThrow(/at least one day/);
    expect(() =>
      validateSetup({ ...base, settings: { ...base.settings, closedDates: ["2026-02-30"] } }),
    ).toThrow(/days off/);
    expect(() =>
      validateSetup({
        ...base,
        services: [
          { name: "Cut", durationMinutes: 30, priceCents: null },
          { name: " cut ", durationMinutes: 30, priceCents: null },
        ],
      }),
    ).toThrow(/listed twice/);
    expect(() => validateSetup({ ...base, team: [{ name: "Ana" }, { name: "ana" }] })).toThrow(
      /listed twice/,
    );
  });
});

describe("planSetup", () => {
  it("writes price and duration on the services section and keeps the owner's text", async () => {
    const site = await newSite();
    const plan = planSetup({ request: request(), items: [], team: [], spec: site.spec });
    const section = plan.spec.sections.find((s) => s.type === "services");
    if (section?.type !== "services") throw new Error("no services section");
    const blowout = section.items.find((i) => i.name === "Blowout");
    const original = fixtures["glow-salon"].sections.find((s) => s.type === "services");
    const before =
      original?.type === "services" ? original.items.find((i) => i.name === "Blowout") : undefined;
    expect(blowout).toMatchObject({ price: "$60", detail: "50 min" });
    expect(blowout?.description).toBe(before?.description);
    const manicure = section.items.find((i) => i.name === "Gel manicure");
    expect(manicure).toMatchObject({ price: "from $45", detail: "45 min", description: "" });
    expect(section.items.length).toBeLessThanOrEqual(8);
  });

  it("clears an old policy when the owner chose none", async () => {
    const site = await newSite();
    const req = request();
    const plan = planSetup({
      request: { ...req, settings: { ...req.settings, cancellationPolicy: undefined } },
      items: [],
      team: [],
      spec: site.spec,
    });
    expect(plan.settings).toMatchObject({
      enabled: true,
      cancellationPolicy: "",
      cancellationHours: 0,
    });
  });

  it("puts the service area and phone of home services on the site", async () => {
    const site = await getSiteStore().create(fixtures["joes-plumbing"], OWNER);
    const plan = planSetup({
      request: request({
        kind: "home",
        serviceArea: "Austin and Pflugerville",
        phone: "(512) 555-0100",
        team: [],
      }),
      items: [],
      team: [],
      spec: site.spec,
    });
    expect(plan.spec.business.serviceArea).toBe("Austin and Pflugerville");
    expect(plan.spec.business.phone).toBe("(512) 555-0100");
    // Casa: a duração fica fora do texto do site.
    const section = plan.spec.sections.find((s) => s.type === "services");
    if (section?.type !== "services") throw new Error("no services section");
    expect(section.items.find((i) => i.name === "Blowout")?.detail).toBeUndefined();
  });
});

describe("applySetup", () => {
  it("saves everything, turns booking on and never publishes", async () => {
    const site = await newSite();
    const result = await applySetup(OWNER, site, request());
    expect(result).toMatchObject({ siteId: site.id, services: 2, people: 1 });
    expect(result.saved).toEqual(["services", "team", "site", "hours"]);

    const settings = await getBookingSettings(OWNER);
    expect(settings).toMatchObject({
      enabled: true,
      slotStepMinutes: 15,
      bufferMinutes: 5,
      closedDates: ["2026-12-25"],
      cancellationHours: 24,
    });
    expect(settings.weekly[1]).toEqual([open]);

    const items = await listPriceItems(OWNER);
    expect(items.find((i) => i.name === "Blowout")).toMatchObject({
      bookable: true,
      durationMinutes: 50,
      unitPriceCents: 6000,
      active: true,
    });
    const team = await listTeam(OWNER);
    expect(team.map((m) => m.name)).toEqual(["Camila Reyes"]);

    const stored = await getSiteStore().get(site.id);
    expect(stored?.status).toBe("draft");
    expect(stored?.publishedSpec).toBeNull();
    const about = stored?.spec.sections.find((s) => s.type === "about");
    const camila =
      about?.type === "about" ? about.people?.find((p) => p.name === "Camila Reyes") : undefined;
    expect(camila).toMatchObject({ role: "Owner", note: "Color and balayage." });
  });

  it("is idempotent: running again updates instead of duplicating", async () => {
    const site = await newSite();
    await applySetup(OWNER, site, request());
    const afterFirst = await getSiteStore().get(site.id);
    if (!afterFirst) throw new Error("site vanished");
    const versions = (await getSiteStore().listVersions(site.id)).length;

    const changed = request({
      services: [
        { name: " blowout ", durationMinutes: 60, priceCents: 6500 },
        { name: "Gel manicure", durationMinutes: 45, priceCents: 4500 },
      ],
      team: [{ name: "camila reyes", role: "Owner", bio: "Color and balayage." }],
    });
    await applySetup(OWNER, afterFirst, changed);

    const items = (await listPriceItems(OWNER)).filter((i) => i.bookable);
    expect(items).toHaveLength(2);
    expect(items.find((i) => i.name === "Blowout")).toMatchObject({
      durationMinutes: 60,
      unitPriceCents: 6500,
    });
    expect(await listTeam(OWNER)).toHaveLength(1);

    // A terceira vez, sem mudança nenhuma: o rascunho não ganha versão nova.
    const again = await getSiteStore().get(site.id);
    if (!again) throw new Error("site vanished");
    const before = (await getSiteStore().listVersions(site.id)).length;
    await applySetup(OWNER, again, changed);
    expect(before).toBeGreaterThan(versions);
    expect(await getSiteStore().listVersions(site.id)).toHaveLength(before);
  });

  it("turns off booking for a removed service without deleting it", async () => {
    const site = await newSite();
    await applySetup(OWNER, site, request());
    const current = await getSiteStore().get(site.id);
    if (!current) throw new Error("site vanished");
    await applySetup(
      OWNER,
      current,
      request({
        services: [{ name: "Blowout", durationMinutes: 50, priceCents: 6000 }],
        removedServices: ["Gel manicure"],
      }),
    );
    const manicure = (await listPriceItems(OWNER)).find((i) => i.name === "Gel manicure");
    expect(manicure).toMatchObject({ bookable: false, active: true });
  });

  it("leaves the team alone when the owner works alone", async () => {
    const site = await newSite();
    await applySetup(OWNER, site, request());
    const current = await getSiteStore().get(site.id);
    if (!current) throw new Error("site vanished");
    await applySetup(OWNER, current, request({ team: [] }));
    expect((await listTeam(OWNER)).filter((m) => m.active)).toHaveLength(1);
  });

  it("changes nothing when the request is invalid", async () => {
    const site = await newSite();
    const req = request();
    await expect(
      applySetup(OWNER, site, {
        ...req,
        settings: { ...req.settings, closedDates: ["2026-02-30"] },
      }),
    ).rejects.toBeInstanceOf(OfficeError);
    expect(await listPriceItems(OWNER)).toHaveLength(0);
    expect((await getBookingSettings(OWNER)).enabled).toBe(false);
  });
});
