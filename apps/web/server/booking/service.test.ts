import { fixtures } from "@nosweat/fixtures";
import type { CreateBookingRequest } from "@nosweat/schema";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEV_USER } from "../auth/session";
import { createClient, listClients } from "../clients/service";
import { getClientStore, resetMemoryClientStore } from "../clients/store";
import {
  createJob,
  createPriceItem,
  createTeamMember,
  deleteJob,
  getJob,
  updateJob,
  updatePriceItem,
  updateSettings,
  updateTeamMember,
} from "../office/service";
import { resetMemoryOfficeStore } from "../office/store";
import { OfficeError } from "../office/types";
import { getSiteStore } from "../store";
import {
  cancelBookingByToken,
  createBooking,
  getBookingByToken,
  getBookingSettings,
  getPublicAvailability,
  getPublicBookingInfo,
  updateBookingSettings,
} from "./service";
import { getBookingStore, resetMemoryBookingStore } from "./store";

// Sem Supabase: tudo em memória. O dono é o DEV_USER. "Agora" é sempre o mesmo (terça, 1/12/2026,
// 12:00 em Nova York) e passa para o service, então os horários dos testes não dependem do relógio.

const OWNER = DEV_USER.id;
const NOW = new Date("2026-12-01T17:00:00Z");
/** Quarta-feira, 10:00 em Nova York (EST). */
const WED_10 = "2026-12-02T10:00:00-05:00";

type Setup = { siteId: string; serviceId: string };

async function publishSite(owner = OWNER): Promise<string> {
  const store = getSiteStore();
  const site = await store.create(fixtures["glow-salon"], owner);
  await store.updateMeta(site.id, {
    status: "published",
    slug: `glow-${site.id.slice(0, 6)}`,
    publishedSpec: site.spec,
    publishedAt: NOW.toISOString(),
  });
  return site.id;
}

/** Site no ar + um serviço agendável de 45 min + agendamento ligado (sem folga nem antecedência). */
async function setup(): Promise<Setup> {
  const siteId = await publishSite();
  await updateSettings(OWNER, { timeZone: "America/New_York" });
  const item = await createPriceItem(OWNER, {
    name: "Haircut",
    unitPriceCents: 4500,
    bookable: true,
    durationMinutes: 45,
  });
  await updateBookingSettings(OWNER, { enabled: true, minNoticeHours: 0 });
  return { siteId, serviceId: item.id };
}

const request = (
  setupData: Setup,
  over: Partial<CreateBookingRequest> = {},
): CreateBookingRequest => ({
  serviceId: setupData.serviceId,
  startAt: WED_10,
  name: "Ana Lima",
  phone: "(512) 555-0142",
  email: "ana@example.test",
  ...over,
});

async function expectError(promise: Promise<unknown>, status: number, code: string) {
  const error = await promise.then(
    () => null,
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(OfficeError);
  expect((error as OfficeError).status).toBe(status);
  expect((error as OfficeError).code).toBe(code);
}

const wednesday = async (setupData: Setup, staffId?: string) => {
  const result = await getPublicAvailability(
    setupData.siteId,
    { serviceId: setupData.serviceId, from: "2026-12-02", days: 1, staffId },
    NOW,
  );
  return (result?.days[0]?.slots ?? []).map((slot) => slot.startAt.slice(11, 16));
};

beforeEach(() => {
  resetMemoryOfficeStore();
  resetMemoryClientStore();
  resetMemoryBookingStore();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("booking settings", () => {
  it("starts with the defaults (off) and merges what is sent", async () => {
    expect((await getBookingSettings(OWNER)).enabled).toBe(false);
    const saved = await updateBookingSettings(OWNER, { enabled: true, bufferMinutes: 10 });
    expect(saved).toMatchObject({ enabled: true, bufferMinutes: 10, slotStepMinutes: 30 });
    const again = await updateBookingSettings(OWNER, { note: "  Arrive early.  " });
    expect(again).toMatchObject({ enabled: true, bufferMinutes: 10, note: "Arrive early." });
    expect(await getBookingSettings(OWNER)).toEqual(again);
    // Outro dono continua com os padrões.
    expect((await getBookingSettings("someone-else")).enabled).toBe(false);
  });

  it("sorts the hours of a day and refuses overlaps and dates that do not exist", async () => {
    const weekly = (await getBookingSettings(OWNER)).weekly.map((day) => [...day]);
    weekly[1] = [
      { start: "13:00", end: "17:00" },
      { start: "09:00", end: "12:00" },
    ];
    const saved = await updateBookingSettings(OWNER, { weekly });
    expect(saved.weekly[1]).toEqual([
      { start: "09:00", end: "12:00" },
      { start: "13:00", end: "17:00" },
    ]);

    weekly[1] = [
      { start: "09:00", end: "13:00" },
      { start: "12:00", end: "17:00" },
    ];
    await expectError(updateBookingSettings(OWNER, { weekly }), 400, "invalid_request");
    await expectError(
      updateBookingSettings(OWNER, { closedDates: ["2026-02-30"] }),
      400,
      "invalid_request",
    );
    const closed = await updateBookingSettings(OWNER, {
      closedDates: ["2026-12-25", "2026-12-24", "2026-12-25"],
    });
    expect(closed.closedDates).toEqual(["2026-12-24", "2026-12-25"]);
  });
});

describe("price items: bookable services", () => {
  it("needs a duration to be bookable", async () => {
    await expectError(
      createPriceItem(OWNER, { name: "Cut", unitPriceCents: 3000, bookable: true }),
      400,
      "invalid_request",
    );
    const item = await createPriceItem(OWNER, { name: "Cut", unitPriceCents: 3000 });
    expect(item).toMatchObject({ bookable: false, durationMinutes: null });
    await expectError(updatePriceItem(OWNER, item.id, { bookable: true }), 400, "invalid_request");
    const updated = await updatePriceItem(OWNER, item.id, { bookable: true, durationMinutes: 30 });
    expect(updated).toMatchObject({ bookable: true, durationMinutes: 30 });
    // Mudar só o nome não mexe no agendamento.
    expect(await updatePriceItem(OWNER, item.id, { name: "Cut+" })).toMatchObject({
      bookable: true,
      durationMinutes: 30,
    });
  });
});

describe("public info and availability", () => {
  it("shows services and staff of a published site with booking on", async () => {
    const data = await setup();
    await createTeamMember(OWNER, { name: "Dana" });
    const quitter = await createTeamMember(OWNER, { name: "Old Timer" });
    await updateTeamMember(OWNER, quitter.id, { active: false });
    // Serviço não agendável e serviço inativo não aparecem.
    await createPriceItem(OWNER, { name: "Consult", unitPriceCents: 0 });
    const hidden = await createPriceItem(OWNER, {
      name: "Hidden",
      unitPriceCents: 1000,
      bookable: true,
      durationMinutes: 30,
    });
    await updatePriceItem(OWNER, hidden.id, { active: false });

    const info = await getPublicBookingInfo(data.siteId);
    expect(info).not.toBeNull();
    expect(info?.timeZone).toBe("America/New_York");
    expect(info?.services).toEqual([
      {
        id: data.serviceId,
        name: "Haircut",
        description: "",
        durationMinutes: 45,
        priceCents: 4500,
      },
    ]);
    expect(info?.staff.map((s) => s.name)).toEqual(["Dana"]);
    expect(info?.maxDaysAhead).toBe(30);
    expect(info?.businessName).toBe(fixtures["glow-salon"].business.name);
  });

  it("is null (404) when the site is not live, booking is off or nothing is bookable", async () => {
    const data = await setup();
    expect(await getPublicBookingInfo("not-a-site")).toBeNull();

    const draft = await getSiteStore().create(fixtures["glow-salon"], OWNER);
    expect(await getPublicBookingInfo(draft.id)).toBeNull();

    await updateBookingSettings(OWNER, { enabled: false });
    expect(await getPublicBookingInfo(data.siteId)).toBeNull();
    expect(
      await getPublicAvailability(
        data.siteId,
        { serviceId: data.serviceId, from: "2026-12-02", days: 1 },
        NOW,
      ),
    ).toBeNull();
    expect(await createBooking(data.siteId, request(data), NOW)).toBeNull();

    await updateBookingSettings(OWNER, { enabled: true });
    await updatePriceItem(OWNER, data.serviceId, { bookable: false });
    expect(await getPublicBookingInfo(data.siteId)).toBeNull();
  });

  it("is null when the owner's plan no longer keeps the site live", async () => {
    const data = await setup();
    expect(await getPublicBookingInfo(data.siteId)).not.toBeNull();
    vi.stubEnv("REQUIRE_PLAN", "true");
    expect(await getPublicBookingInfo(data.siteId)).toBeNull();
  });

  it("returns the days of the period, with the next opening", async () => {
    const data = await setup();
    const result = await getPublicAvailability(
      data.siteId,
      { serviceId: data.serviceId, from: "2026-12-05", days: 3 },
      NOW,
    );
    expect(result?.timeZone).toBe("America/New_York");
    expect(result?.days.map((d) => d.date)).toEqual(["2026-12-05", "2026-12-06", "2026-12-07"]);
    // Sábado aberto, domingo fechado.
    expect(result?.days[0]?.slots.length).toBeGreaterThan(0);
    expect(result?.days[1]?.slots).toEqual([]);
    expect(result?.nextAvailableAt).toBe("2026-12-08T09:00:00-05:00");
    expect(result?.days[0]?.slots[0]).toEqual({
      startAt: "2026-12-05T09:00:00-05:00",
      endAt: "2026-12-05T09:45:00-05:00",
      staffId: null,
    });
  });

  it("refuses an unknown service, an unknown person and an impossible date", async () => {
    const data = await setup();
    await createTeamMember(OWNER, { name: "Dana" });
    const ask = (query: { serviceId: string; from: string; staffId?: string }) =>
      getPublicAvailability(data.siteId, { days: 1, ...query }, NOW);
    await expectError(ask({ serviceId: "nope", from: "2026-12-02" }), 404, "not_found");
    await expectError(
      ask({ serviceId: data.serviceId, from: "2026-12-02", staffId: "ghost" }),
      400,
      "invalid_request",
    );
    await expectError(
      ask({ serviceId: data.serviceId, from: "2026-02-30" }),
      400,
      "invalid_request",
    );
  });

  it("owner jobs block the times, and a job assigned to someone only blocks that person", async () => {
    const data = await setup();
    const dana = await createTeamMember(OWNER, { name: "Dana" });
    const lee = await createTeamMember(OWNER, { name: "Lee" });
    const client = await createClient(OWNER, { name: "Walk In", phone: "5125550000" });
    await createJob(OWNER, {
      clientId: client.id,
      title: "Manual job",
      startAt: "2026-12-02T10:00:00-05:00",
      endAt: "2026-12-02T11:00:00-05:00",
      assigneeIds: [dana.id],
    });
    expect(await wednesday(data, dana.id)).not.toContain("10:00");
    expect(await wednesday(data, lee.id)).toContain("10:00");
    // Qualquer pessoa: o horário continua (Lee está livre).
    expect(await wednesday(data)).toContain("10:00");
  });
});

describe("createBooking", () => {
  it("creates the client, the job and the booking, and takes the time off the list", async () => {
    const data = await setup();
    expect(await wednesday(data)).toContain("10:00");

    const created = await createBooking(data.siteId, request(data, { notes: "Fade please" }), NOW);
    expect(created).not.toBeNull();
    const booking = created?.booking;
    expect(booking).toMatchObject({
      status: "confirmed",
      serviceName: "Haircut",
      startAt: "2026-12-02T10:00:00-05:00",
      endAt: "2026-12-02T10:45:00-05:00",
      staffName: null,
      customerName: "Ana Lima",
      businessName: fixtures["glow-salon"].business.name,
      timeZone: "America/New_York",
      canCancel: true,
    });
    expect(booking?.token.length).toBeGreaterThanOrEqual(32);

    // Cliente novo, vindo do site, já contatado.
    const clients = await getClientStore().listClients(OWNER);
    expect(clients).toHaveLength(1);
    expect(clients[0]).toMatchObject({
      name: "Ana Lima",
      email: "ana@example.test",
      phone: "(512) 555-0142",
      stage: "contacted",
      source: "website",
      siteId: data.siteId,
    });

    // Serviço na agenda do dono.
    const record = await getBookingStore().getByToken(booking?.token ?? "");
    expect(record?.jobId).toBeTruthy();
    const job = await getJob(OWNER, record?.jobId ?? "");
    expect(job).toMatchObject({
      title: "Haircut: Ana Lima",
      status: "scheduled",
      clientId: clients[0]?.id,
      valueCents: 4500,
      assigneeIds: [],
    });
    expect(job?.notes).toBe("Booked online\nFade please");
    expect(Date.parse(job?.startAt ?? "")).toBe(Date.parse(WED_10));
    expect(Date.parse(job?.endAt ?? "")).toBe(Date.parse("2026-12-02T10:45:00-05:00"));

    // O horário (e o que encosta nele) some da lista; o seguinte livre continua.
    const after = await wednesday(data);
    expect(after).not.toContain("10:00");
    expect(after).not.toContain("10:30");
    expect(after).toContain("11:00");

    // Aviso para os e-mails.
    expect(created?.notice).toMatchObject({
      ownerId: OWNER,
      serviceName: "Haircut",
      startAt: new Date(WED_10).toISOString(),
      timeZone: "America/New_York",
      token: booking?.token,
      customer: { name: "Ana Lima", email: "ana@example.test", notes: "Fade please" },
    });
  });

  it("reuses the client with the same email or phone and moves 'new' to 'contacted'", async () => {
    const data = await setup();
    const existing = await createClient(OWNER, {
      name: "Ana L.",
      phone: "512-555-0142",
      stage: "new",
    });
    await createBooking(data.siteId, request(data, { name: "Ana Lima" }), NOW);
    const clients = await listClients(OWNER);
    expect(clients).toHaveLength(1);
    expect(clients[0]).toMatchObject({
      id: existing.id,
      name: "Ana L.",
      stage: "contacted",
      // O e-mail que faltava entra.
      email: "ana@example.test",
    });

    // Cliente que já ganhou o serviço continua na etapa dele; e-mail igual com outras letras junta.
    const won = await createClient(OWNER, { name: "Bob", email: "bob@x.test", stage: "won" });
    await createBooking(
      data.siteId,
      request(data, {
        startAt: "2026-12-02T14:00:00-05:00",
        name: "Robert",
        phone: "(305) 555-0001",
        email: "BOB@x.test",
      }),
      NOW,
    );
    const bob = await getClientStore().getClient(OWNER, won.id);
    expect(bob?.stage).toBe("won");
    expect(await listClients(OWNER)).toHaveLength(2);
  });

  it("answers 409 slot_taken when the time was taken, is not offered or the owner is busy", async () => {
    const data = await setup();
    await createBooking(data.siteId, request(data), NOW);

    await expectError(
      createBooking(data.siteId, request(data, { name: "Late", phone: "5125550001" }), NOW),
      409,
      "slot_taken",
    );
    // Encosta no atendimento anterior (10:30 ainda é 10:00-10:45).
    await expectError(
      createBooking(
        data.siteId,
        request(data, { startAt: "2026-12-02T10:30:00-05:00", phone: "5125550002" }),
        NOW,
      ),
      409,
      "slot_taken",
    );
    // Horário que o site nunca ofereceu (fora do passo, fora do expediente, domingo, passado).
    for (const startAt of [
      "2026-12-02T10:10:00-05:00",
      "2026-12-02T20:00:00-05:00",
      "2026-12-06T10:00:00-05:00",
      "2026-11-30T10:00:00-05:00",
    ]) {
      await expectError(
        createBooking(data.siteId, request(data, { startAt, phone: "5125550003" }), NOW),
        409,
        "slot_taken",
      );
    }
    // Só uma marcação e um serviço foram criados.
    expect(await getClientStore().listClients(OWNER)).toHaveLength(1);

    const client = await createClient(OWNER, { name: "Walk In", phone: "5125550009" });
    await createJob(OWNER, {
      clientId: client.id,
      title: "Manual job",
      startAt: "2026-12-02T15:00:00-05:00",
      endAt: "2026-12-02T16:00:00-05:00",
    });
    await expectError(
      createBooking(
        data.siteId,
        request(data, { startAt: "2026-12-02T15:00:00-05:00", phone: "5125550004" }),
        NOW,
      ),
      409,
      "slot_taken",
    );
  });

  it("never books the same time twice when requests arrive together", async () => {
    const data = await setup();
    const attempts = Array.from({ length: 6 }, (_, i) =>
      createBooking(
        data.siteId,
        request(data, { name: `Customer ${i}`, phone: `51255500${10 + i}`, email: "" }),
        NOW,
      ).then(
        () => "ok" as const,
        (error: unknown) =>
          error instanceof OfficeError && error.code === "slot_taken"
            ? ("taken" as const)
            : ("error" as const),
      ),
    );
    const results = await Promise.all(attempts);
    expect(results.filter((r) => r === "ok")).toHaveLength(1);
    expect(results.filter((r) => r === "taken")).toHaveLength(5);

    const active = await getBookingStore().listActive(
      OWNER,
      "2026-12-01T00:00:00Z",
      "2026-12-31T00:00:00Z",
    );
    expect(active).toHaveLength(1);
  });

  it("books two different people at the same time and assigns the free one", async () => {
    const data = await setup();
    const dana = await createTeamMember(OWNER, { name: "Dana" });
    const lee = await createTeamMember(OWNER, { name: "Lee" });
    const first = await createBooking(data.siteId, request(data), NOW);
    const second = await createBooking(
      data.siteId,
      request(data, { name: "Bea", phone: "5125550077", email: "" }),
      NOW,
    );
    expect([first?.booking.staffName, second?.booking.staffName].sort()).toEqual(["Dana", "Lee"]);
    // Os dois ocupados: ninguém mais.
    await expectError(
      createBooking(data.siteId, request(data, { phone: "5125550078", email: "" }), NOW),
      409,
      "slot_taken",
    );
    // Quem foi escolhido recebe o serviço da agenda.
    const jobs = await Promise.all(
      [first, second].map(async (c) => {
        const record = await getBookingStore().getByToken(c?.booking.token ?? "");
        return getJob(OWNER, record?.jobId ?? "");
      }),
    );
    expect(jobs.flatMap((j) => j?.assigneeIds ?? []).sort()).toEqual([dana.id, lee.id].sort());
  });

  it("asking for a specific person books that person", async () => {
    const data = await setup();
    await createTeamMember(OWNER, { name: "Dana" });
    const lee = await createTeamMember(OWNER, { name: "Lee" });
    const created = await createBooking(data.siteId, request(data, { staffId: lee.id }), NOW);
    expect(created?.booking.staffName).toBe("Lee");
    await expectError(
      createBooking(
        data.siteId,
        request(data, { staffId: lee.id, phone: "5125550079", email: "" }),
        NOW,
      ),
      409,
      "slot_taken",
    );
    await expectError(
      createBooking(data.siteId, request(data, { staffId: "ghost" }), NOW),
      400,
      "invalid_request",
    );
  });

  it("the database function rule: a job of another person does not block, an open one does", async () => {
    const data = await setup();
    const dana = await createTeamMember(OWNER, { name: "Dana" });
    const lee = await createTeamMember(OWNER, { name: "Lee" });
    const client = await createClient(OWNER, { name: "Walk In", phone: "5125550009" });
    await createJob(OWNER, {
      clientId: client.id,
      title: "Dana's job",
      startAt: "2026-12-02T10:00:00-05:00",
      endAt: "2026-12-02T11:00:00-05:00",
      assigneeIds: [dana.id],
    });
    const base = {
      ownerId: OWNER,
      siteId: data.siteId,
      clientId: client.id,
      serviceId: data.serviceId,
      serviceName: "Haircut",
      startAt: "2026-12-02T15:00:00.000Z",
      endAt: "2026-12-02T15:45:00.000Z",
      customerName: "X",
      customerPhone: "5125550000",
      customerEmail: null,
      notes: "",
    };
    const store = getBookingStore();
    const forDana = await store.bookSlot(
      { ...base, token: "t1", staffId: dana.id },
      { bufferMinutes: 0 },
    );
    expect(forDana.ok).toBe(false);
    const forLee = await store.bookSlot(
      { ...base, token: "t2", staffId: lee.id },
      { bufferMinutes: 0 },
    );
    expect(forLee.ok).toBe(true);
    // Sem pessoa (agenda única): o serviço da Dana bloqueia.
    const single = await store.bookSlot(
      { ...base, token: "t3", staffId: null },
      { bufferMinutes: 0 },
    );
    expect(single.ok).toBe(false);
  });
});

describe("cancel", () => {
  it("the customer cancels by link: booking and job are canceled and the time reopens", async () => {
    const data = await setup();
    const created = await createBooking(data.siteId, request(data), NOW);
    const token = created?.booking.token ?? "";
    const record = await getBookingStore().getByToken(token);
    expect(await wednesday(data)).not.toContain("10:00");

    const canceled = await cancelBookingByToken(token, NOW);
    expect(canceled).toMatchObject({ status: "canceled", canCancel: false });
    expect((await getJob(OWNER, record?.jobId ?? ""))?.status).toBe("canceled");
    expect(await wednesday(data)).toContain("10:00");

    // Cancelar de novo não dá erro e não muda nada.
    expect((await cancelBookingByToken(token, NOW))?.status).toBe("canceled");
    // O link continua mostrando a marcação, agora cancelada.
    expect((await getBookingByToken(token, NOW))?.status).toBe("canceled");
    // O horário já pode ser marcado por outra pessoa.
    const again = await createBooking(
      data.siteId,
      request(data, { name: "Bea", phone: "5125550077", email: "" }),
      NOW,
    );
    expect(again?.booking.status).toBe("confirmed");
  });

  it("only future appointments can be canceled online, and unknown links are 404", async () => {
    const data = await setup();
    const created = await createBooking(data.siteId, request(data), NOW);
    const token = created?.booking.token ?? "";
    const afterStart = new Date("2026-12-02T15:30:00Z");
    expect((await getBookingByToken(token, afterStart))?.canCancel).toBe(false);
    await expectError(cancelBookingByToken(token, afterStart), 409, "conflict");
    expect((await getBookingByToken(token, NOW))?.status).toBe("confirmed");

    expect(await cancelBookingByToken("x".repeat(40), NOW)).toBeNull();
    expect(await getBookingByToken("x".repeat(40), NOW)).toBeNull();
  });

  it("when the owner cancels the job in the schedule, the booking is canceled too", async () => {
    const data = await setup();
    const created = await createBooking(data.siteId, request(data), NOW);
    const token = created?.booking.token ?? "";
    const record = await getBookingStore().getByToken(token);

    await updateJob(OWNER, record?.jobId ?? "", { status: "canceled" });
    expect((await getBookingByToken(token, NOW))?.status).toBe("canceled");
    expect(await wednesday(data)).toContain("10:00");
  });

  it("when the owner moves the job, the booking moves with it and the old time reopens", async () => {
    const data = await setup();
    const created = await createBooking(data.siteId, request(data), NOW);
    const token = created?.booking.token ?? "";
    const record = await getBookingStore().getByToken(token);

    await updateJob(OWNER, record?.jobId ?? "", {
      startAt: "2026-12-02T14:00:00-05:00",
      endAt: "2026-12-02T14:45:00-05:00",
    });
    const moved = await getBookingByToken(token, NOW);
    expect(moved?.startAt).toBe("2026-12-02T14:00:00-05:00");
    const free = await wednesday(data);
    expect(free).toContain("10:00");
    expect(free).not.toContain("14:00");
  });

  it("when the owner deletes the job, the booking is canceled", async () => {
    const data = await setup();
    const created = await createBooking(data.siteId, request(data), NOW);
    const token = created?.booking.token ?? "";
    const record = await getBookingStore().getByToken(token);

    expect(await deleteJob(OWNER, record?.jobId ?? "")).toBe(true);
    expect((await getBookingByToken(token, NOW))?.status).toBe("canceled");
    expect(await wednesday(data)).toContain("10:00");
  });
});
