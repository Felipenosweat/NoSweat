import { describe, expect, it } from "vitest";
import {
  buildReminderRows,
  eligibleReminders,
  firstNameOf,
  isQuietHours,
  phoneKey,
  readWindow,
  reminderHref,
  reminderMessage,
  tomorrowKey,
  type ReminderBooking,
} from "./sms-reminders";

const NY = "America/New_York";
/** Terça, 1/12/2026, 12:00 em Nova York (EST = UTC-5). */
const NOON = new Date("2026-12-01T17:00:00Z");

const booking = (over: Partial<ReminderBooking> = {}): ReminderBooking => ({
  id: "b1",
  clientId: "c1",
  status: "confirmed",
  customerName: "Ana Lima",
  customerFirstName: "Ana",
  customerPhone: "+13055550187",
  serviceName: "Balayage",
  // Quarta, 2/12/2026, 10:30 AM em Nova York.
  startAt: "2026-12-02T10:30:00-05:00",
  smsConsentAt: "2026-11-20T15:00:00.000Z",
  ...over,
});

describe("quiet hours", () => {
  const at = (iso: string, zone = NY) => isQuietHours(new Date(iso), zone);

  it("allows 8:00 AM up to (not including) 9:00 PM, business time", () => {
    expect(at("2026-12-01T07:59:00-05:00")).toBe(true);
    expect(at("2026-12-01T08:00:00-05:00")).toBe(false);
    expect(at("2026-12-01T12:00:00-05:00")).toBe(false);
    expect(at("2026-12-01T20:59:00-05:00")).toBe(false);
    expect(at("2026-12-01T21:00:00-05:00")).toBe(true);
    expect(at("2026-12-01T00:30:00-05:00")).toBe(true);
  });

  it("uses the business time zone, not the server's", () => {
    // 20:30 em Nova York ainda é permitido, mas já são 17:30 no Pacífico e 02:30 em Londres.
    const now = "2026-12-01T20:30:00-05:00";
    expect(at(now, NY)).toBe(false);
    expect(at(now, "America/Los_Angeles")).toBe(false);
    expect(at(now, "Europe/London")).toBe(true);
    // 21:30 em Nova York é silêncio lá, mas ainda 18:30 no Pacífico.
    expect(at("2026-12-01T21:30:00-05:00", NY)).toBe(true);
    expect(at("2026-12-01T21:30:00-05:00", "America/Los_Angeles")).toBe(false);
  });
});

describe("tomorrow", () => {
  it("is the next calendar day in the business time zone", () => {
    expect(tomorrowKey(NOON, NY)).toBe("2026-12-02");
    // 11 PM de terça em Nova York já é quarta em UTC, mas "amanhã" para o dono ainda é quarta.
    expect(tomorrowKey(new Date("2026-12-02T04:00:00Z"), NY)).toBe("2026-12-02");
    expect(tomorrowKey(new Date("2026-12-02T04:00:00Z"), "UTC")).toBe("2026-12-03");
  });

  it("rolls over months and years", () => {
    expect(tomorrowKey(new Date("2026-12-31T17:00:00Z"), NY)).toBe("2027-01-01");
    expect(tomorrowKey(new Date("2028-02-28T17:00:00Z"), NY)).toBe("2028-02-29");
  });

  it("reads from the database a window wide enough for any time zone", () => {
    const { fromIso, toIso } = readWindow(NOON);
    expect(Date.parse(fromIso)).toBeLessThan(NOON.getTime());
    expect(Date.parse(toIso) - NOON.getTime()).toBeGreaterThanOrEqual(2 * 24 * 60 * 60 * 1000);
  });
});

describe("eligibleReminders", () => {
  const run = (
    bookings: ReminderBooking[],
    clients: { id: string; phone: string | null; smsOptOut?: boolean }[] = [],
    now = NOON,
  ) => eligibleReminders({ now, timeZone: NY, bookings, clients });

  it("lists confirmed bookings of tomorrow that have SMS consent, in time order", () => {
    const later = booking({ id: "b2", startAt: "2026-12-02T15:00:00-05:00" });
    const earlier = booking({ id: "b3", startAt: "2026-12-02T09:00:00-05:00" });
    expect(run([later, booking(), earlier]).map((b) => b.id)).toEqual(["b3", "b1", "b2"]);
  });

  it("skips bookings without consent, canceled ones and other days", () => {
    expect(run([booking({ smsConsentAt: null })])).toEqual([]);
    expect(run([booking({ smsConsentAt: undefined })])).toEqual([]);
    expect(run([booking({ status: "canceled" })])).toEqual([]);
    expect(run([booking({ startAt: "2026-12-01T16:00:00-05:00" })])).toEqual([]);
    expect(run([booking({ startAt: "2026-12-03T10:00:00-05:00" })])).toEqual([]);
  });

  it("decides 'tomorrow' by the business day, around midnight", () => {
    // 23:30 de quarta em Nova York (04:30Z de quinta) ainda é quarta.
    const lateWed = booking({ startAt: "2026-12-02T23:30:00-05:00" });
    expect(run([lateWed])).toHaveLength(1);
    const earlyThu = booking({ startAt: "2026-12-03T00:30:00-05:00" });
    expect(run([earlyThu])).toHaveLength(0);
  });

  it("blocks clients who replied STOP, by id and by the same phone", () => {
    const stopped = { id: "c1", phone: "(305) 555-0187", smsOptOut: true };
    expect(run([booking()], [stopped])).toEqual([]);
    // Outro cadastro com o mesmo telefone: continua bloqueado.
    const other = booking({ id: "b9", clientId: "c9" });
    expect(run([other], [stopped])).toEqual([]);
    // Cliente sem STOP não bloqueia ninguém.
    expect(run([booking()], [{ id: "c1", phone: "(305) 555-0187", smsOptOut: false }])).toHaveLength(
      1,
    );
    expect(run([booking()], [{ id: "c7", phone: "(786) 555-0100", smsOptOut: true }])).toHaveLength(
      1,
    );
  });

  it("needs a phone and a client to record a STOP on", () => {
    expect(run([booking({ customerPhone: "" })])).toEqual([]);
    expect(run([booking({ clientId: null })])).toEqual([]);
  });
});

describe("phoneKey", () => {
  it("compares only the digits, without the US country code", () => {
    expect(phoneKey("+13055550187")).toBe("3055550187");
    expect(phoneKey("(305) 555-0187")).toBe("3055550187");
    expect(phoneKey("1-305-555-0187")).toBe("3055550187");
    expect(phoneKey("")).toBeNull();
    expect(phoneKey(null)).toBeNull();
  });
});

describe("message and link", () => {
  it("writes the reminder with the first name, business, service, tomorrow and the STOP line", () => {
    expect(
      reminderMessage({
        firstName: "Ana",
        businessName: "Glow Salon",
        serviceName: "Balayage",
        time: "10:30 AM",
      }),
    ).toBe(
      "Hi Ana, this is Glow Salon reminding you of your Balayage appointment tomorrow at 10:30 AM. Reply STOP to opt out.",
    );
  });

  it("does not say 'appointment appointment' and copes with a missing business name", () => {
    const text = reminderMessage({
      firstName: "Ana",
      businessName: " ",
      serviceName: "Dental appointment",
      time: "9:00 AM",
    });
    expect(text).toContain("your Dental appointment tomorrow at 9:00 AM");
    expect(text).not.toMatch(/appointment appointment/i);
    expect(text).toContain("this is your service provider");
    expect(text.endsWith("Reply STOP to opt out.")).toBe(true);
  });

  it("takes the first name from the form's field or from the full name", () => {
    expect(firstNameOf({ customerName: "Ana Lima", customerFirstName: "Ana" })).toBe("Ana");
    expect(firstNameOf({ customerName: "  Ana Maria Lima ", customerFirstName: null })).toBe("Ana");
    expect(firstNameOf({ customerName: "  ", customerFirstName: null })).toBe("there");
  });

  it("builds an sms: link that works on iPhone and Android with the text encoded", () => {
    const body = "Hi Ana, see you tomorrow & bring ID. Reply STOP to opt out.";
    const href = reminderHref("+1 (305) 555-0187", body);
    // "?&body=" abre o app de mensagens com o texto no iOS e no Android; o telefone só tem + e dígitos.
    expect(href.startsWith("sms:+13055550187?&body=")).toBe(true);
    expect(href).not.toContain(" ");
    expect(decodeURIComponent(href.split("body=")[1] ?? "")).toBe(body);
    // Nada de "sms:...&body=" sem o "?" (o Android ignoraria o texto).
    expect(href).not.toMatch(/^sms:[^?]*&body=/);
  });

  it("builds the rows of the list with time, message and link", () => {
    const rows = buildReminderRows({
      now: NOON,
      timeZone: NY,
      businessName: "Glow Salon",
      bookings: [booking()],
      clients: [{ id: "c1", phone: "(305) 555-0187" }],
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      bookingId: "b1",
      clientId: "c1",
      name: "Ana Lima",
      serviceName: "Balayage",
      timeLabel: "10:30 AM",
    });
    expect(rows[0]?.message).toContain("this is Glow Salon");
    expect(rows[0]?.message).toContain("tomorrow at 10:30 AM");
    expect(rows[0]?.href).toBe(reminderHref("+13055550187", rows[0]?.message ?? ""));
  });

  it("shows nobody once the client is marked STOP", () => {
    const rows = buildReminderRows({
      now: NOON,
      timeZone: NY,
      businessName: "Glow Salon",
      bookings: [booking()],
      clients: [{ id: "c1", phone: "(305) 555-0187", smsOptOut: true }],
    });
    expect(rows).toEqual([]);
  });
});
