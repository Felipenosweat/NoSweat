import { DEFAULT_BOOKING_SETTINGS, type BookingSettings } from "@nosweat/schema";
import { describe, expect, it } from "vitest";
import {
  bookingBusy,
  computeAvailability,
  conflicts,
  findOfferedSlot,
  jobBusy,
  type AvailabilityInput,
  type BusyInterval,
} from "./availability";
import { addDaysTo, dateKeyOf, isoInZone, weekdayOf, zonedInstant } from "./time";

const TZ = "America/New_York";
/** Terça, 1 de dezembro de 2026, meio-dia em Nova York (EST). */
const NOW = new Date("2026-12-01T17:00:00Z");

const settings = (over: Partial<BookingSettings> = {}): BookingSettings => ({
  ...DEFAULT_BOOKING_SETTINGS,
  enabled: true,
  minNoticeHours: 0,
  ...over,
});

const input = (over: Partial<AvailabilityInput> = {}): AvailabilityInput => ({
  settings: settings(),
  timeZone: TZ,
  durationMinutes: 60,
  staff: [],
  busy: [],
  now: NOW,
  ...over,
});

const busy = (start: string, end: string, staffIds: string[] = []): BusyInterval => ({
  startMs: Date.parse(start),
  endMs: Date.parse(end),
  staffIds,
});

/** "09:00", "09:30"... (hora local de cada horário do dia). */
const times = (day: { slots: { startAt: string }[] } | undefined) =>
  (day?.slots ?? []).map((slot) => slot.startAt.slice(11, 16));

const dayOf = (data: AvailabilityInput, date: string) => computeAvailability(data, date, 1).days[0];

describe("time helpers", () => {
  it("converts wall-clock times to instants and back, with the zone offset", () => {
    const ms = zonedInstant("2026-12-03", "15:30", TZ);
    expect(ms).toBe(Date.parse("2026-12-03T20:30:00Z"));
    expect(isoInZone(ms ?? 0, TZ)).toBe("2026-12-03T15:30:00-05:00");
    expect(isoInZone(Date.parse("2026-07-03T19:30:00Z"), TZ)).toBe("2026-07-03T15:30:00-04:00");
    expect(dateKeyOf(Date.parse("2026-12-04T02:00:00Z"), TZ)).toBe("2026-12-03");
    expect(addDaysTo("2026-12-31", 1)).toBe("2027-01-01");
    expect(weekdayOf("2026-12-06")).toBe(0);
  });

  it("knows which wall-clock times do not exist (spring forward)", () => {
    expect(zonedInstant("2027-03-14", "02:30", TZ)).toBeNull();
    expect(zonedInstant("2027-03-14", "03:00", TZ)).toBe(Date.parse("2027-03-14T07:00:00Z"));
  });
});

describe("computeAvailability: hours", () => {
  it("offers every start where the whole visit fits in the opening hours", () => {
    const day = dayOf(input(), "2026-12-02");
    const list = times(day);
    expect(list).toHaveLength(15);
    expect(list[0]).toBe("09:00");
    expect(list.at(-1)).toBe("16:00");
    expect(day?.slots[0]?.startAt).toBe("2026-12-02T09:00:00-05:00");
    expect(day?.slots[0]?.endAt).toBe("2026-12-02T10:00:00-05:00");
    expect(day?.slots[0]?.staffId).toBeNull();
  });

  it("follows the step and the service duration", () => {
    const data = input({
      settings: settings({
        slotStepMinutes: 15,
        weekly: [[], [], [], [{ start: "09:00", end: "10:30" }], [], [], []],
      }),
      durationMinutes: 45,
    });
    // 09:00, 09:15, 09:30, 09:45 (termina 10:30). 10:00 já não cabe.
    expect(times(dayOf(data, "2026-12-02"))).toEqual(["09:00", "09:15", "09:30", "09:45"]);
  });

  it("skips the lunch break between two ranges", () => {
    const lunch = settings({
      weekly: [
        [],
        [],
        [],
        [
          { start: "09:00", end: "12:00" },
          { start: "13:00", end: "15:00" },
        ],
        [],
        [],
        [],
      ],
    });
    const list = times(dayOf(input({ settings: lunch }), "2026-12-02"));
    expect(list).toEqual(["09:00", "09:30", "10:00", "10:30", "11:00", "13:00", "13:30", "14:00"]);
  });

  it("gives closed weekdays and closed dates no times, but still lists the day", () => {
    const result = computeAvailability(
      input({ settings: settings({ closedDates: ["2026-12-03"] }) }),
      "2026-12-02",
      6,
    );
    expect(result.days.map((d) => d.date)).toEqual([
      "2026-12-02",
      "2026-12-03",
      "2026-12-04",
      "2026-12-05",
      "2026-12-06",
      "2026-12-07",
    ]);
    expect(result.timeZone).toBe(TZ);
    const byDate = Object.fromEntries(result.days.map((d) => [d.date, d.slots.length]));
    expect(byDate["2026-12-03"]).toBe(0); // dia fechado
    expect(byDate["2026-12-06"]).toBe(0); // domingo
    expect(byDate["2026-12-04"]).toBeGreaterThan(0);
  });

  it("offers nothing in the past", () => {
    expect(dayOf(input(), "2026-11-30")?.slots).toEqual([]);
    // Hoje: só do horário atual em diante (agora 12:00).
    expect(times(dayOf(input(), "2026-12-01"))[0]).toBe("12:00");
  });
});

describe("computeAvailability: notice and horizon", () => {
  it("respects the minimum notice", () => {
    // Quarta 08:00 EST com 2 horas de antecedência: o primeiro horário é 10:00.
    const early = new Date("2026-12-02T13:00:00Z");
    const data = input({
      settings: settings({ minNoticeHours: 2 }),
      now: early,
      durationMinutes: 30,
    });
    expect(times(dayOf(data, "2026-12-02"))[0]).toBe("10:00");
  });

  it("stops at maxDaysAhead and looks for the next opening after the period", () => {
    const data = input({ settings: settings({ maxDaysAhead: 2 }) });
    // Hoje é terça (1/12): até quinta (3/12).
    const days = computeAvailability(data, "2026-12-02", 3).days;
    expect(days.map((d) => d.slots.length > 0)).toEqual([true, true, false]);

    const next = computeAvailability(data, "2026-12-01", 1);
    expect(next.nextAvailableAt).toBe("2026-12-02T09:00:00-05:00");
    // Depois do limite não existe próxima vaga.
    expect(computeAvailability(data, "2026-12-02", 2).nextAvailableAt).toBeNull();
  });

  it("finds the next opening past a fully booked period", () => {
    // Quarta lotada: o dia inteiro ocupado.
    const full = busy("2026-12-02T00:00:00-05:00", "2026-12-02T23:59:00-05:00");
    const result = computeAvailability(input({ busy: [full] }), "2026-12-02", 1);
    expect(result.days[0]?.slots).toEqual([]);
    expect(result.nextAvailableAt).toBe("2026-12-03T09:00:00-05:00");
  });
});

describe("computeAvailability: busy times", () => {
  it("removes times that touch a job and keeps the buffer around it", () => {
    const job = busy("2026-12-02T10:00:00-05:00", "2026-12-02T11:00:00-05:00");
    const noBuffer = times(dayOf(input({ busy: [job] }), "2026-12-02"));
    expect(noBuffer).toContain("09:00"); // 09:00-10:00 encosta mas não bate
    expect(noBuffer).not.toContain("09:30");
    expect(noBuffer).not.toContain("10:30");
    expect(noBuffer).toContain("11:00");

    const withBuffer = times(
      dayOf(input({ busy: [job], settings: settings({ bufferMinutes: 15 }) }), "2026-12-02"),
    );
    // 15 minutos de folga antes e depois: 09:00 (terminaria 10:00 + 15) e 11:00 (começa antes de 11:15) saem.
    expect(withBuffer).not.toContain("09:00");
    expect(withBuffer).not.toContain("11:00");
    expect(withBuffer[0]).toBe("11:30");
  });

  it("uses the same overlap rule as the database function", () => {
    const span = { startMs: 1_000 * 60, endMs: 2_000 * 60 };
    const bufferMs = 10 * 60_000;
    // fim do ocupado + folga
    expect(conflicts({ startMs: 2_000 * 60, endMs: 3_000 * 60 }, span, 0)).toBe(false);
    expect(conflicts({ startMs: 2_000 * 60, endMs: 3_000 * 60 }, span, bufferMs)).toBe(true);
    // início do ocupado - folga do novo atendimento
    expect(conflicts({ startMs: 0, endMs: 1_000 * 60 }, span, 0)).toBe(false);
    expect(conflicts({ startMs: 0, endMs: 1_000 * 60 }, span, bufferMs)).toBe(true);
  });

  it("ignores canceled jobs, jobs without a time and treats an open-ended job as one hour", () => {
    const base = { assigneeIds: [] as string[], endAt: null };
    expect(jobBusy({ ...base, status: "canceled", startAt: "2026-12-02T15:00:00Z" })).toBeNull();
    expect(jobBusy({ ...base, status: "unscheduled", startAt: null })).toBeNull();
    const open = jobBusy({ ...base, status: "scheduled", startAt: "2026-12-02T15:00:00Z" });
    expect(open && open.endMs - open.startMs).toBe(60 * 60_000);
    const sized = jobBusy({
      ...base,
      status: "scheduled",
      startAt: "2026-12-02T15:00:00Z",
      endAt: "2026-12-02T17:00:00Z",
    });
    expect(sized && sized.endMs - sized.startMs).toBe(2 * 60 * 60_000);
  });

  it("an open-ended job and a confirmed booking both block the time", () => {
    const job = jobBusy({
      status: "scheduled",
      startAt: "2026-12-02T15:00:00Z", // 10:00 EST
      endAt: null,
      assigneeIds: [],
    });
    const booking = bookingBusy({
      startAt: "2026-12-02T17:00:00Z", // 12:00 EST
      endAt: "2026-12-02T18:00:00Z",
      staffId: null,
    });
    const list = times(dayOf(input({ busy: [job ?? booking, booking] }), "2026-12-02"));
    expect(list).not.toContain("10:00");
    expect(list).not.toContain("12:00");
    expect(list).toContain("11:00");
    expect(list).toContain("13:00");
  });
});

describe("computeAvailability: staff", () => {
  const staff = [{ id: "a" }, { id: "b" }];
  const jobA = busy("2026-12-02T15:00:00Z", "2026-12-02T16:00:00Z", ["a"]); // 10:00-11:00 EST

  it("without a team, one calendar: any job blocks, and the slot has no staff", () => {
    const data = input({ busy: [jobA] });
    const day = dayOf(data, "2026-12-02");
    expect(times(day)).not.toContain("10:00");
    expect(day?.slots.every((slot) => slot.staffId === null)).toBe(true);
  });

  it("a job assigned to one person only blocks that person", () => {
    const forA = times(dayOf(input({ staff, staffId: "a", busy: [jobA] }), "2026-12-02"));
    const forB = times(dayOf(input({ staff, staffId: "b", busy: [jobA] }), "2026-12-02"));
    expect(forA).not.toContain("10:00");
    expect(forB).toContain("10:00");
  });

  it("any person: unique starts, each with someone free", () => {
    const day = dayOf(input({ staff, busy: [jobA] }), "2026-12-02");
    const list = times(day);
    expect(new Set(list).size).toBe(list.length);
    const ten = day?.slots.find((slot) => slot.startAt.includes("T10:00"));
    expect(ten?.staffId).toBe("b");
  });

  it("any person: a time is gone only when everyone is busy", () => {
    const jobB = busy("2026-12-02T15:00:00Z", "2026-12-02T16:00:00Z", ["b"]);
    expect(times(dayOf(input({ staff, busy: [jobA, jobB] }), "2026-12-02"))).not.toContain("10:00");
  });

  it("a job with nobody assigned blocks the whole team", () => {
    const everyone = busy("2026-12-02T15:00:00Z", "2026-12-02T16:00:00Z", []);
    expect(times(dayOf(input({ staff, busy: [everyone] }), "2026-12-02"))).not.toContain("10:00");
    expect(
      times(dayOf(input({ staff, staffId: "b", busy: [everyone] }), "2026-12-02")),
    ).not.toContain("10:00");
  });

  it("with 'any person' the least busy person gets the time", () => {
    // A tem um serviço de manhã; no horário livre das 14:00 quem atende é B (menos carga).
    const day = dayOf(input({ staff, busy: [jobA] }), "2026-12-02");
    const two = day?.slots.find((slot) => slot.startAt.includes("T14:00"));
    expect(two?.staffId).toBe("b");
  });

  it("an unknown person has no times", () => {
    expect(dayOf(input({ staff, staffId: "ghost" }), "2026-12-02")?.slots).toEqual([]);
  });
});

describe("computeAvailability: daylight saving time", () => {
  it("fall back (Nov 1, 2026): offsets change inside the day and no hour is lost twice", () => {
    const data = input({
      settings: settings({
        weekly: [[{ start: "00:30", end: "03:00" }], [], [], [], [], [], []],
        slotStepMinutes: 30,
      }),
      durationMinutes: 30,
      now: new Date("2026-10-30T12:00:00Z"),
    });
    const day = dayOf(data, "2026-11-01");
    expect(day?.slots.map((s) => s.startAt)).toEqual([
      "2026-11-01T00:30:00-04:00",
      "2026-11-01T01:00:00-04:00",
      "2026-11-01T01:30:00-04:00",
      "2026-11-01T02:00:00-05:00",
      "2026-11-01T02:30:00-05:00",
    ]);
    const ms = (iso: string) => Date.parse(iso);
    const starts = day?.slots.map((s) => ms(s.startAt)) ?? [];
    expect(new Set(starts).size).toBe(starts.length);
  });

  it("spring forward (Mar 14, 2027): the 2 AM hour does not exist and is skipped", () => {
    const data = input({
      settings: settings({
        weekly: [[{ start: "01:00", end: "04:00" }], [], [], [], [], [], []],
        slotStepMinutes: 30,
        maxDaysAhead: 365,
      }),
      durationMinutes: 30,
      now: new Date("2027-03-10T12:00:00Z"),
    });
    const day = dayOf(data, "2027-03-14");
    expect(day?.slots.map((s) => s.startAt)).toEqual([
      "2027-03-14T01:00:00-05:00",
      "2027-03-14T01:30:00-05:00",
      "2027-03-14T03:00:00-04:00",
      "2027-03-14T03:30:00-04:00",
    ]);
  });

  it("a visit that crosses the changeover is measured in real minutes", () => {
    const data = input({
      settings: settings({
        weekly: [[{ start: "01:00", end: "04:00" }], [], [], [], [], [], []],
        slotStepMinutes: 30,
        maxDaysAhead: 365,
      }),
      durationMinutes: 60,
      now: new Date("2027-03-10T12:00:00Z"),
    });
    const day = dayOf(data, "2027-03-14");
    const first = day?.slots[0];
    // 01:00 EST + 60 minutos reais = 03:00 EDT.
    expect(first?.endAt).toBe("2027-03-14T03:00:00-04:00");
  });
});

describe("findOfferedSlot", () => {
  it("returns the slot (with its staff) when the time is offered and null otherwise", () => {
    const data = input({ staff: [{ id: "a" }] });
    const start = Date.parse("2026-12-02T14:00:00Z"); // 09:00 EST
    expect(findOfferedSlot(data, start)?.staffId).toBe("a");
    // fora do horário
    expect(findOfferedSlot(data, Date.parse("2026-12-02T03:00:00Z"))).toBeNull();
    // fora do passo
    expect(findOfferedSlot(data, Date.parse("2026-12-02T14:10:00Z"))).toBeNull();
    // ocupado
    const taken = input({
      staff: [{ id: "a" }],
      busy: [busy("2026-12-02T14:00:00Z", "2026-12-02T15:00:00Z", ["a"])],
    });
    expect(findOfferedSlot(taken, start)).toBeNull();
  });
});
