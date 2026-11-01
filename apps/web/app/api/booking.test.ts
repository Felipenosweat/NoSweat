import { fixtures } from "@nosweat/fixtures";
import {
  ApiError,
  AvailabilityResponse,
  BookingSettingsResponse,
  PublicBookingInfo,
  PublicBookingResponse,
} from "@nosweat/schema";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetMemoryBookingStore } from "@/server/booking/store";
import { updateBookingSettings } from "@/server/booking/service";
import { resetMemoryClientStore } from "@/server/clients/store";
import { createPriceItem, updateSettings } from "@/server/office/service";
import { resetMemoryOfficeStore } from "@/server/office/store";
import { getSiteStore } from "@/server/store";
import { GET as settingsGet, PUT as settingsPut } from "./office/booking-settings/route";
import { GET as availabilityRoute } from "./public/booking/[siteId]/availability/route";
import { POST as bookRoute } from "./public/booking/[siteId]/book/route";
import { GET as infoRoute } from "./public/booking/[siteId]/route";
import { POST as cancelRoute } from "./public/booking/token/[token]/cancel/route";
import { GET as tokenRoute } from "./public/booking/token/[token]/route";

// O login: nesta suíte o usuário muda de um teste para outro (o dono, ou ninguém).
const state = vi.hoisted(() => ({ user: null as { id: string; email: string | null } | null }));

vi.mock("@/server/auth/session", () => ({
  DEV_USER: { id: "local-dev", email: "dev@localhost" },
  getCurrentUser: async () => state.user,
}));

// "Agora": terça, 1/12/2026, 12:00 em Nova York. Só o Date é congelado (o resto segue normal).
const NOW = new Date("2026-12-01T17:00:00Z");
const OWNER = "local-dev";
const BASE = "http://localhost/api/public/booking";

const siteCtx = (siteId: string) => ({ params: Promise.resolve({ siteId }) });
const tokenCtx = (token: string) => ({ params: Promise.resolve({ token }) });

async function errorCode(res: Response): Promise<string> {
  return ApiError.parse(await res.json()).error.code;
}

type Setup = { siteId: string; serviceId: string };

/** Site no ar do dono, com um serviço agendável e o agendamento ligado. */
async function setup(): Promise<Setup> {
  const store = getSiteStore();
  const site = await store.create(fixtures["glow-salon"], OWNER);
  await store.updateMeta(site.id, {
    status: "published",
    slug: `glow-${site.id.slice(0, 6)}`,
    publishedSpec: site.spec,
    publishedAt: NOW.toISOString(),
  });
  await updateSettings(OWNER, { timeZone: "America/New_York" });
  const item = await createPriceItem(OWNER, {
    name: "Haircut",
    unitPriceCents: 4500,
    bookable: true,
    durationMinutes: 45,
  });
  await updateBookingSettings(OWNER, { enabled: true, minNoticeHours: 0 });
  return { siteId: site.id, serviceId: item.id };
}

/** Primeiro horário livre de quarta-feira (2/12). */
async function firstSlot(data: Setup): Promise<string> {
  const res = await availabilityRoute(
    new Request(`${BASE}/${data.siteId}/availability?serviceId=${data.serviceId}&from=2026-12-02&days=1`),
    siteCtx(data.siteId),
  );
  expect(res.status).toBe(200);
  const first = AvailabilityResponse.parse(await res.json()).days[0]?.slots[0];
  if (!first) throw new Error("no free slot");
  return first.startAt;
}

let phoneSeq = 0;
const nextPhone = () => `51255510${String(phoneSeq++).padStart(2, "0")}`;
let ipSeq = 0;
const nextIp = () => `203.0.113.${(ipSeq++ % 250) + 1}`;

function bookRequest(
  data: Setup,
  startAt: string,
  over: Record<string, unknown> = {},
  ip = nextIp(),
): Request {
  return new Request(`${BASE}/${data.siteId}/book`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify({
      serviceId: data.serviceId,
      startAt,
      name: "Ana Lima",
      phone: nextPhone(),
      email: "ana@example.test",
      ...over,
    }),
  });
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
  state.user = { id: OWNER, email: "dev@localhost" };
  resetMemoryOfficeStore();
  resetMemoryClientStore();
  resetMemoryBookingStore();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("GET /api/public/booking/[siteId]", () => {
  it("returns the services, staff and rules of a site with booking on", async () => {
    const data = await setup();
    const res = await infoRoute(new Request(`${BASE}/${data.siteId}`), siteCtx(data.siteId));
    expect(res.status).toBe(200);
    const info = PublicBookingInfo.parse(await res.json());
    expect(info.services).toHaveLength(1);
    expect(info.services[0]).toMatchObject({ name: "Haircut", durationMinutes: 45 });
    expect(info.timeZone).toBe("America/New_York");
    expect(info.staff).toEqual([]);
  });

  it("is 404 for an unknown site, a draft, booking off and no bookable service", async () => {
    const data = await setup();
    const get = (id: string) => infoRoute(new Request(`${BASE}/${id}`), siteCtx(id));

    const unknown = await get("00000000-0000-4000-8000-000000000000");
    expect(unknown.status).toBe(404);
    expect(await errorCode(unknown)).toBe("not_found");

    const draft = await getSiteStore().create(fixtures["glow-salon"], OWNER);
    expect((await get(draft.id)).status).toBe(404);

    await updateBookingSettings(OWNER, { enabled: false });
    expect((await get(data.siteId)).status).toBe(404);
    expect(
      (
        await availabilityRoute(
          new Request(`${BASE}/${data.siteId}/availability?serviceId=${data.serviceId}&from=2026-12-02`),
          siteCtx(data.siteId),
        )
      ).status,
    ).toBe(404);

    await updateBookingSettings(OWNER, { enabled: true });
    expect((await get(data.siteId)).status).toBe(200);
    vi.stubEnv("REQUIRE_PLAN", "true");
    expect((await get(data.siteId)).status).toBe(404);
    vi.unstubAllEnvs();
  });
});

describe("GET /api/public/booking/[siteId]/availability", () => {
  it("returns the days with their free times in the company's zone", async () => {
    const data = await setup();
    const res = await availabilityRoute(
      new Request(`${BASE}/${data.siteId}/availability?serviceId=${data.serviceId}&from=2026-12-05`),
      siteCtx(data.siteId),
    );
    expect(res.status).toBe(200);
    const body = AvailabilityResponse.parse(await res.json());
    // `days` tem o padrão de 7 dias.
    expect(body.days).toHaveLength(7);
    expect(body.timeZone).toBe("America/New_York");
    expect(body.days[0]?.date).toBe("2026-12-05");
    expect(body.days[0]?.slots[0]).toEqual({
      startAt: "2026-12-05T09:00:00-05:00",
      endAt: "2026-12-05T09:45:00-05:00",
      staffId: null,
    });
    // Domingo fechado.
    expect(body.days[1]?.slots).toEqual([]);
  });

  it("validates the query and the service", async () => {
    const data = await setup();
    const call = (query: string) =>
      availabilityRoute(
        new Request(`${BASE}/${data.siteId}/availability?${query}`),
        siteCtx(data.siteId),
      );
    expect((await call("from=2026-12-02")).status).toBe(400);
    expect((await call(`serviceId=${data.serviceId}`)).status).toBe(400);
    expect((await call(`serviceId=${data.serviceId}&from=12/02/2026`)).status).toBe(400);
    expect((await call(`serviceId=${data.serviceId}&from=2026-12-02&days=99`)).status).toBe(400);
    expect((await call(`serviceId=${data.serviceId}&from=2026-02-30`)).status).toBe(400);
    const missing = await call("serviceId=nope&from=2026-12-02");
    expect(missing.status).toBe(404);
    expect(await errorCode(missing)).toBe("not_found");
  });
});

describe("POST /api/public/booking/[siteId]/book", () => {
  it("books (201), and the link shows and cancels the booking", async () => {
    const data = await setup();
    const startAt = await firstSlot(data);
    const res = await bookRoute(bookRequest(data, startAt), siteCtx(data.siteId));
    expect(res.status).toBe(201);
    const { booking } = PublicBookingResponse.parse(await res.json());
    expect(booking).toMatchObject({
      status: "confirmed",
      serviceName: "Haircut",
      startAt,
      customerName: "Ana Lima",
      canCancel: true,
    });

    // O horário saiu da lista.
    const after = await availabilityRoute(
      new Request(`${BASE}/${data.siteId}/availability?serviceId=${data.serviceId}&from=2026-12-02&days=1`),
      siteCtx(data.siteId),
    );
    const slots = AvailabilityResponse.parse(await after.json()).days[0]?.slots ?? [];
    expect(slots.map((s) => s.startAt)).not.toContain(startAt);

    const seen = await tokenRoute(new Request(`${BASE}/token/${booking.token}`), tokenCtx(booking.token));
    expect(seen.status).toBe(200);
    expect(PublicBookingResponse.parse(await seen.json()).booking.status).toBe("confirmed");

    const cancel = () =>
      cancelRoute(
        new Request(`${BASE}/token/${booking.token}/cancel`, {
          method: "POST",
          headers: { "x-forwarded-for": "198.51.100.200" },
        }),
        tokenCtx(booking.token),
      );
    const canceled = await cancel();
    expect(canceled.status).toBe(200);
    expect(PublicBookingResponse.parse(await canceled.json()).booking).toMatchObject({
      status: "canceled",
      canCancel: false,
    });
    expect((await cancel()).status).toBe(200);

    // O horário voltou.
    const reopened = await availabilityRoute(
      new Request(`${BASE}/${data.siteId}/availability?serviceId=${data.serviceId}&from=2026-12-02&days=1`),
      siteCtx(data.siteId),
    );
    expect(
      (AvailabilityResponse.parse(await reopened.json()).days[0]?.slots ?? []).map((s) => s.startAt),
    ).toContain(startAt);
  });

  it("answers 409 slot_taken for a time that was just booked", async () => {
    const data = await setup();
    const startAt = await firstSlot(data);
    expect((await bookRoute(bookRequest(data, startAt), siteCtx(data.siteId))).status).toBe(201);
    const second = await bookRoute(bookRequest(data, startAt), siteCtx(data.siteId));
    expect(second.status).toBe(409);
    expect(await errorCode(second)).toBe("slot_taken");
  });

  it("is 404 for a site without booking", async () => {
    const data = await setup();
    const startAt = await firstSlot(data);
    await updateBookingSettings(OWNER, { enabled: false });
    expect((await bookRoute(bookRequest(data, startAt), siteCtx(data.siteId))).status).toBe(404);
  });

  it("validates the body and catches robots with the hidden field", async () => {
    const data = await setup();
    const startAt = await firstSlot(data);
    const book = (over: Record<string, unknown>) =>
      bookRoute(bookRequest(data, startAt, over), siteCtx(data.siteId));
    expect((await book({ name: "" })).status).toBe(400);
    expect((await book({ phone: "123" })).status).toBe(400);
    expect((await book({ email: "not-an-email" })).status).toBe(400);
    expect((await book({ startAt: "tomorrow at ten" })).status).toBe(400);
    expect((await book({ website: "http://spam.example" })).status).toBe(400);
    expect(await errorCode(await book({ name: "" }))).toBe("invalid_request");

    const wrongType = await bookRoute(
      new Request(`${BASE}/${data.siteId}/book`, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: "{}",
      }),
      siteCtx(data.siteId),
    );
    expect(wrongType.status).toBe(415);
    // Nada disso marcou o horário.
    expect((await bookRoute(bookRequest(data, startAt), siteCtx(data.siteId))).status).toBe(201);
  });

  it("answers 429 after 6 attempts from the same IP", async () => {
    const data = await setup();
    const startAt = await firstSlot(data);
    const ip = "192.0.2.10";
    for (let i = 0; i < 6; i += 1) {
      const res = await bookRoute(bookRequest(data, startAt, {}, ip), siteCtx(data.siteId));
      expect([201, 409]).toContain(res.status);
    }
    const blocked = await bookRoute(bookRequest(data, startAt, {}, ip), siteCtx(data.siteId));
    expect(blocked.status).toBe(429);
    expect(await errorCode(blocked)).toBe("quota_exceeded");
    // Outro IP continua podendo.
    const other = await bookRoute(bookRequest(data, startAt, {}, "192.0.2.11"), siteCtx(data.siteId));
    expect([201, 409]).toContain(other.status);
  });

  it("answers 429 after 3 attempts with the same phone, even from different IPs", async () => {
    const data = await setup();
    const startAt = await firstSlot(data);
    const phone = "(305) 555-0199";
    for (let i = 0; i < 3; i += 1) {
      const res = await bookRoute(bookRequest(data, startAt, { phone }), siteCtx(data.siteId));
      expect([201, 409]).toContain(res.status);
    }
    const blocked = await bookRoute(
      bookRequest(data, startAt, { phone: "305-555-0199" }),
      siteCtx(data.siteId),
    );
    expect(blocked.status).toBe(429);
  });
});

describe("public booking links", () => {
  it("answers 404 for a malformed or unknown token", async () => {
    expect((await tokenRoute(new Request(`${BASE}/token/short`), tokenCtx("short"))).status).toBe(404);
    const unknown = "u".repeat(43);
    expect((await tokenRoute(new Request(`${BASE}/token/${unknown}`), tokenCtx(unknown))).status).toBe(
      404,
    );
    const cancel = await cancelRoute(
      new Request(`${BASE}/token/${unknown}/cancel`, { method: "POST" }),
      tokenCtx(unknown),
    );
    expect(cancel.status).toBe(404);
    expect(await errorCode(cancel)).toBe("not_found");
  });
});

describe("/api/office/booking-settings", () => {
  const put = (body: unknown) =>
    settingsPut(
      new Request("http://localhost/api/office/booking-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    );

  it("reads the defaults and saves only what was sent", async () => {
    const res = await settingsGet();
    expect(res.status).toBe(200);
    const { settings } = BookingSettingsResponse.parse(await res.json());
    expect(settings).toMatchObject({ enabled: false, slotStepMinutes: 30, maxDaysAhead: 30 });

    const saved = await put({ enabled: true, bufferMinutes: 15, note: "Arrive early." });
    expect(saved.status).toBe(200);
    expect(BookingSettingsResponse.parse(await saved.json()).settings).toMatchObject({
      enabled: true,
      bufferMinutes: 15,
      slotStepMinutes: 30,
      note: "Arrive early.",
    });
    const again = BookingSettingsResponse.parse(await (await settingsGet()).json());
    expect(again.settings.enabled).toBe(true);
  });

  it("refuses invalid settings with 400", async () => {
    expect((await put({ slotStepMinutes: 1 })).status).toBe(400);
    expect((await put({ weekly: [[]] })).status).toBe(400);
    expect((await put({ closedDates: ["12/25/2026"] })).status).toBe(400);
    const overlap = await put({
      weekly: [[], [{ start: "09:00", end: "13:00" }, { start: "12:00", end: "17:00" }], [], [], [], [], []],
    });
    expect(overlap.status).toBe(400);
    expect(await errorCode(overlap)).toBe("invalid_request");
  });

  it("needs a login", async () => {
    state.user = null;
    const read = await settingsGet();
    expect(read.status).toBe(401);
    expect(await errorCode(read)).toBe("unauthorized");
    expect((await put({ enabled: true })).status).toBe(401);
  });

  it("only changes the logged-in owner's settings", async () => {
    await put({ enabled: true });
    state.user = { id: "another-owner", email: null };
    const { settings } = BookingSettingsResponse.parse(await (await settingsGet()).json());
    expect(settings.enabled).toBe(false);
  });
});
