import { fixtures } from "@nosweat/fixtures";
import { ApiError, SiteSetupResponse } from "@nosweat/schema";
import { beforeEach, describe, expect, it } from "vitest";
import { getBookingSettings } from "@/server/booking/service";
import { resetMemoryBookingStore } from "@/server/booking/store";
import { listPriceItems, listTeam } from "@/server/office/service";
import { resetMemoryOfficeStore } from "@/server/office/store";
import { getSiteStore } from "@/server/store";
import { POST } from "./route";

// Sem Supabase nos testes, quem está logado é o DEV_USER ("local-dev").
const OWNER = "local-dev";

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
const post = (body: unknown) =>
  new Request("http://localhost/api/x", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

const open = { start: "09:00", end: "17:00" };
const valid = {
  kind: "shop",
  settings: {
    weekly: [[], [open], [open], [open], [open], [open], []],
    slotStepMinutes: 30,
    bufferMinutes: 0,
    minNoticeHours: 2,
    maxDaysAhead: 30,
    closedDates: [],
    note: "",
    cancellationPolicy: "Free cancellation up to 24 hours before your appointment.",
    cancellationHours: 24,
  },
  services: [{ name: "Blowout", durationMinutes: 45, priceCents: 5500 }],
  team: [{ name: "Jordan Lee", role: "Stylist", bio: "Precision cuts." }],
};

beforeEach(() => {
  resetMemoryOfficeStore();
  resetMemoryBookingStore();
});

describe("POST /api/sites/[id]/setup", () => {
  it("saves the setup and turns booking on", async () => {
    const site = await getSiteStore().create(fixtures["glow-salon"], OWNER);
    const res = await POST(post(valid), ctx(site.id));
    expect(res.status).toBe(200);
    const body = SiteSetupResponse.parse(await res.json());
    expect(body).toMatchObject({ siteId: site.id, services: 1, people: 1 });
    expect(body.saved).toEqual(["services", "team", "site", "hours"]);
    expect((await getBookingSettings(OWNER)).enabled).toBe(true);
    expect((await listPriceItems(OWNER)).filter((i) => i.bookable)).toHaveLength(1);
    expect(await listTeam(OWNER)).toHaveLength(1);
    const versions = await getSiteStore().listVersions(site.id);
    expect(versions[0]?.source).toBe("edit");
  });

  it("can run twice without duplicating anything", async () => {
    const site = await getSiteStore().create(fixtures["glow-salon"], OWNER);
    expect((await POST(post(valid), ctx(site.id))).status).toBe(200);
    expect((await POST(post(valid), ctx(site.id))).status).toBe(200);
    expect((await listPriceItems(OWNER)).filter((i) => i.name === "Blowout")).toHaveLength(1);
    expect(await listTeam(OWNER)).toHaveLength(1);
  });

  it("answers 400 in the standard shape and saves nothing when the request is wrong", async () => {
    const site = await getSiteStore().create(fixtures["glow-salon"], OWNER);
    const noServices = await POST(post({ ...valid, services: [] }), ctx(site.id));
    expect(noServices.status).toBe(400);
    expect(ApiError.parse(await noServices.json()).error.code).toBe("invalid_request");

    const badDate = await POST(
      post({ ...valid, settings: { ...valid.settings, closedDates: ["2026-02-30"] } }),
      ctx(site.id),
    );
    expect(badDate.status).toBe(400);
    expect(ApiError.parse(await badDate.json()).error.message).toMatch(/days off/);

    expect(await listPriceItems(OWNER)).toHaveLength(0);
    expect((await getBookingSettings(OWNER)).enabled).toBe(false);
  });

  it("returns 404 for someone else's site and writes nothing", async () => {
    const other = await getSiteStore().create(fixtures["glow-salon"], "someone-else");
    const res = await POST(post(valid), ctx(other.id));
    expect(res.status).toBe(404);
    expect(await listPriceItems(OWNER)).toHaveLength(0);
  });

  it("returns 404 for a site that does not exist", async () => {
    expect((await POST(post(valid), ctx("nope"))).status).toBe(404);
  });
});
