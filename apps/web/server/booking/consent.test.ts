import { smsConsentText, type CreateBookingRequest } from "@nosweat/schema";
import { describe, expect, it } from "vitest";
import { OfficeError } from "../office/types";
import {
  cancellationSnapshot,
  consentFor,
  customerNameOf,
  formatPhoneDisplay,
  policyOf,
  smsConsentFor,
} from "./consent";

const NOW = new Date("2026-12-01T17:00:00Z");

const oldShape: CreateBookingRequest = {
  serviceId: "svc",
  startAt: "2026-12-02T10:00:00-05:00",
  name: " Ana Lima ",
  phone: "(512) 555-0142",
  email: "ana@example.test",
};
const newShape: CreateBookingRequest = {
  ...oldShape,
  name: "Ana Lima",
  firstName: " Ana ",
  lastName: "Lima",
  phone: "+15125550142",
  phoneCountry: "us",
  acceptedPrivacy: true,
};

function refusal(run: () => unknown): OfficeError {
  try {
    run();
  } catch (error) {
    if (error instanceof OfficeError) return error;
    throw error;
  }
  throw new Error("expected an OfficeError");
}

describe("formatPhoneDisplay", () => {
  it("formats +1 numbers and leaves everything else as it came", () => {
    expect(formatPhoneDisplay("+13055550187")).toBe("(305) 555-0187");
    expect(formatPhoneDisplay("(512) 555-0142")).toBe("(512) 555-0142");
    expect(formatPhoneDisplay("+447700900123")).toBe("+447700900123");
    expect(formatPhoneDisplay("+1305555018")).toBe("+1305555018");
  });
});

describe("cancellation snapshot", () => {
  it("is null without a policy and joins the free-cancel window when there is one", () => {
    expect(cancellationSnapshot({})).toBeNull();
    expect(cancellationSnapshot({ cancellationPolicy: "   " })).toBeNull();
    expect(policyOf({ cancellationPolicy: "  Be kind.  " })).toBe("Be kind.");
    expect(cancellationSnapshot({ cancellationPolicy: "Be kind." })).toBe("Be kind.");
    expect(cancellationSnapshot({ cancellationPolicy: "Be kind.", cancellationHours: 0 })).toBe(
      "Be kind.",
    );
    expect(cancellationSnapshot({ cancellationPolicy: "Be kind.", cancellationHours: 1 })).toBe(
      "Be kind.\nCancel free up to 1 hour before.",
    );
    expect(cancellationSnapshot({ cancellationPolicy: "Be kind.", cancellationHours: 48 })).toBe(
      "Be kind.\nCancel free up to 48 hours before.",
    );
  });
});

describe("consentFor", () => {
  it("records nothing for the old shape, even when the owner has a policy", () => {
    expect(consentFor(oldShape, { cancellationPolicy: "Be kind." }, NOW)).toBeNull();
  });

  it("answers 422 when the new shape does not accept the privacy policy", () => {
    const error = refusal(() => consentFor({ ...newShape, acceptedPrivacy: undefined }, {}, NOW));
    expect(error.status).toBe(422);
    expect(error.code).toBe("invalid_request");
    expect(error.message).toMatch(/Privacy Policy/);
  });

  it("answers 422 without the cancellation consent only when a policy exists", () => {
    const settings = { cancellationPolicy: "Be kind." };
    const error = refusal(() => consentFor(newShape, settings, NOW));
    expect(error.status).toBe(422);
    expect(error.message).toMatch(/cancellation policy/);
    expect(consentFor(newShape, {}, NOW)).toMatchObject({ cancellationAcceptedAt: null });
    expect(consentFor({ ...newShape, acceptedCancellation: true }, settings, NOW)).not.toBeNull();
  });

  it("builds the record with dates, trimmed names, country and the policy snapshot", () => {
    const consent = consentFor(
      { ...newShape, acceptedCancellation: true },
      { cancellationPolicy: "Be kind.", cancellationHours: 24 },
      NOW,
    );
    expect(consent).toEqual({
      customerFirstName: "Ana",
      customerLastName: "Lima",
      customerPhoneCountry: "US",
      privacyAcceptedAt: NOW.toISOString(),
      cancellationAcceptedAt: NOW.toISOString(),
      cancellationPolicySnapshot: "Be kind.\nCancel free up to 24 hours before.",
    });
  });
});

describe("customerNameOf", () => {
  it("is 'First Last' in the new shape and the trimmed name in the old one", () => {
    expect(customerNameOf(newShape)).toBe("Ana Lima");
    expect(customerNameOf({ ...newShape, lastName: undefined })).toBe("Ana");
    expect(customerNameOf(oldShape)).toBe("Ana Lima");
  });
});

describe("smsConsentFor", () => {
  const on = { smsReminders: true };

  it("records nothing without the box, or when the owner has text reminders off", () => {
    expect(smsConsentFor({}, on, "Glow Salon", NOW)).toBeNull();
    expect(smsConsentFor({ acceptedSms: true }, {}, "Glow Salon", NOW)).toBeNull();
    const off = { smsReminders: false };
    expect(smsConsentFor({ acceptedSms: true }, off, "Glow Salon", NOW)).toBeNull();
  });

  it("builds the exact disclosure on the server, with the business name and the time", () => {
    const consent = smsConsentFor({ acceptedSms: true }, on, " Glow Salon ", NOW);
    expect(consent).toEqual({
      smsConsentAt: NOW.toISOString(),
      smsConsentText: smsConsentText("Glow Salon"),
    });
    expect(consent?.smsConsentText).toContain("text messages from Glow Salon");
    expect(consent?.smsConsentText).toContain("Reply STOP to opt out or HELP for help.");
    expect(consent?.smsConsentText.endsWith("See our Privacy Policy.")).toBe(true);
  });

  it("does not depend on the old or new request shape", () => {
    expect(smsConsentFor({ ...oldShape, acceptedSms: true }, on, "Glow", NOW)).not.toBeNull();
    expect(smsConsentFor({ ...newShape, acceptedSms: true }, on, "Glow", NOW)).not.toBeNull();
    // E o aceite normal continua como antes.
    expect(consentFor({ ...newShape, acceptedSms: true }, {}, NOW)).toMatchObject({
      privacyAcceptedAt: NOW.toISOString(),
    });
  });
});
