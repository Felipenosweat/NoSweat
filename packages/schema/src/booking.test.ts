import { describe, expect, it } from "vitest";
import {
  BookingSettings,
  Client,
  CreateBookingRequest,
  DEFAULT_BOOKING_SETTINGS,
  PublicBookingInfo,
  SMS_CONSENT_PRIVACY,
  smsConsentIntro,
  smsConsentText,
} from "./index";

const booking = {
  serviceId: "svc",
  startAt: "2026-12-02T10:00:00-05:00",
  name: "Ana Lima",
  phone: "+13055550187",
};

describe("text reminders: contract", () => {
  it("keeps the old request shape valid and accepts only `true` for the optional box", () => {
    expect(CreateBookingRequest.safeParse(booking).success).toBe(true);
    expect(CreateBookingRequest.safeParse({ ...booking, acceptedSms: true }).success).toBe(true);
    expect(CreateBookingRequest.safeParse({ ...booking, acceptedSms: false }).success).toBe(false);
    expect(CreateBookingRequest.safeParse({ ...booking, acceptedSms: "yes" }).success).toBe(false);
  });

  it("is off by default and optional on the settings and the public info", () => {
    expect(DEFAULT_BOOKING_SETTINGS.smsReminders).toBeUndefined();
    expect(BookingSettings.safeParse(DEFAULT_BOOKING_SETTINGS).success).toBe(true);
    expect(
      BookingSettings.safeParse({ ...DEFAULT_BOOKING_SETTINGS, smsReminders: true }).success,
    ).toBe(true);
    const info = {
      businessName: "Glow",
      businessPhone: null,
      timeZone: "America/New_York",
      services: [],
      staff: [],
      maxDaysAhead: 30,
      note: "",
    };
    expect(PublicBookingInfo.safeParse(info).success).toBe(true);
    expect(PublicBookingInfo.safeParse({ ...info, smsReminders: true }).success).toBe(true);
  });

  it("lets a client carry the STOP mark, and works without it", () => {
    const client = {
      id: "c1",
      name: "Ana",
      email: null,
      phone: null,
      address: null,
      stage: "new",
      source: "manual",
      siteId: null,
      notes: "",
      followUpOn: null,
      lastActivityAt: "2026-12-01T00:00:00.000Z",
      totalJobsCents: 0,
      jobsCount: 0,
      createdAt: "2026-12-01T00:00:00.000Z",
      updatedAt: "2026-12-01T00:00:00.000Z",
    };
    expect(Client.safeParse(client).success).toBe(true);
    const stopped = { ...client, smsOptOut: true, smsOptOutAt: "2026-12-02T00:00:00.000Z" };
    expect(Client.parse(stopped).smsOptOut).toBe(true);
  });
});

describe("SMS consent disclosure", () => {
  it("says what the customer agrees to, in order, with the business name", () => {
    const text = smsConsentText("Glow Salon");
    const parts = [
      "Text me reminders about my appointment.",
      "By checking this box, you agree to receive text messages from Glow Salon at the phone number above about your appointment.",
      "Message frequency varies.",
      "Message and data rates may apply.",
      "Reply STOP to opt out or HELP for help.",
      "Consent is not a condition of booking.",
      "See our Privacy Policy.",
    ];
    let from = 0;
    for (const part of parts) {
      const at = text.indexOf(part, from);
      expect(at, part).toBeGreaterThanOrEqual(from);
      from = at + part.length;
    }
    expect(text).toBe(parts.join(" "));
  });

  it("is the intro plus the privacy line, and never promises automatic texts", () => {
    expect(smsConsentText("Glow")).toBe(`${smsConsentIntro("Glow")} ${SMS_CONSENT_PRIVACY}`);
    expect(smsConsentText("Glow")).not.toMatch(/automatic/i);
  });

  it("copes with a blank business name", () => {
    expect(smsConsentText("  ")).toContain("text messages from this business at");
    expect(smsConsentText(" Glow ")).toContain("messages from Glow at");
  });
});
