import { smsConsentIntro as schemaIntro } from "@nosweat/schema";
import { describe, expect, it } from "vitest";
import {
  buildBookingBody,
  cancellationHoursText,
  checkPhone,
  consentsGiven,
  countryLabel,
  EMPTY_BOOKING_DETAILS,
  findCountry,
  formatNationalInput,
  nationalDigits,
  PHONE_COUNTRIES,
  smsConsentIntro,
  validateDetails,
  visibleErrors,
  type BookingDetails,
} from "./booking-form";

const US = findCountry("US");
const SLOT = {
  startAt: "2026-12-02T10:00:00-05:00",
  endAt: "2026-12-02T10:45:00-05:00",
  staffId: null,
};
const PICK = { serviceId: "svc", slot: SLOT };

const valid: BookingDetails = {
  ...EMPTY_BOOKING_DETAILS,
  firstName: " Ana ",
  lastName: "Lima",
  phone: "(305) 555-0187",
  email: "ana@example.com",
  acceptPrivacy: true,
};

describe("country list", () => {
  it("starts with the United States and has the common countries, without repeats", () => {
    expect(PHONE_COUNTRIES[0]?.code).toBe("US");
    expect(countryLabel(US)).toBe("United States +1");
    const codes = PHONE_COUNTRIES.map((country) => country.code);
    expect(new Set(codes).size).toBe(codes.length);
    expect(PHONE_COUNTRIES.length).toBeGreaterThanOrEqual(25);
    for (const code of ["CA", "MX", "BR", "GB", "ES", "CO", "DO", "PR", "CU", "VE", "IN", "PH"]) {
      expect(codes).toContain(code);
    }
    for (const country of PHONE_COUNTRIES) {
      expect(country.code).toMatch(/^[A-Z]{2}$/);
      expect(country.dial).toMatch(/^\d{1,3}$/);
    }
  });

  it("falls back to the United States for an unknown code", () => {
    expect(findCountry("ZZ").code).toBe("US");
    expect(findCountry("MX").dial).toBe("52");
  });
});

describe("phone input", () => {
  it("formats US numbers as the person types", () => {
    expect(formatNationalInput("", US)).toBe("");
    expect(formatNationalInput("3", US)).toBe("(3");
    expect(formatNationalInput("30555", US)).toBe("(305) 55");
    expect(formatNationalInput("3055550187", US)).toBe("(305) 555-0187");
    expect(formatNationalInput("30555501879999", US)).toBe("(305) 555-0187");
  });

  it("drops a leading 1 or +1 and ignores letters and punctuation", () => {
    expect(nationalDigits("+1 (305) 555-0187", US)).toBe("3055550187");
    expect(nationalDigits("1-305-555-0187", US)).toBe("3055550187");
    expect(nationalDigits("305.555.0187 ext", US)).toBe("3055550187");
  });

  it("keeps other countries as plain digits and removes the trunk zero", () => {
    const gb = findCountry("GB");
    expect(formatNationalInput("07700 900123", gb)).toBe("7700900123");
    expect(nationalDigits("+44 7700 900123", gb)).toBe("7700900123");
    expect(nationalDigits("55119876543219999", findCountry("MX")).length).toBe(14);
  });
});

describe("checkPhone", () => {
  it("normalises US and Canada to E.164", () => {
    expect(checkPhone("(305) 555-0187", US)).toEqual({
      ok: true,
      e164: "+13055550187",
      national: "3055550187",
    });
    expect(checkPhone("416 555 0100", findCountry("CA"))).toMatchObject({ e164: "+14165550100" });
    expect(checkPhone("787-555-0100", findCountry("PR"))).toMatchObject({ e164: "+17875550100" });
  });

  it("needs exactly 10 digits for +1 countries", () => {
    for (const bad of ["", "555-0187", "30555501", "+1 305 555 018"]) {
      expect(checkPhone(bad, US).ok).toBe(false);
    }
    expect(checkPhone("555-0187", US)).toMatchObject({
      message: "Enter a 10-digit phone number, like (305) 555-0187.",
    });
    expect(checkPhone("", US)).toMatchObject({ message: "Please enter your phone number." });
  });

  it("accepts 6 to 14 digits elsewhere and builds the E.164", () => {
    expect(checkPhone("5512345678", findCountry("MX"))).toMatchObject({ e164: "+525512345678" });
    expect(checkPhone("07700 900123", findCountry("GB"))).toMatchObject({ e164: "+447700900123" });
    expect(checkPhone("12345", findCountry("ES")).ok).toBe(false);
    expect(checkPhone("123456", findCountry("ES")).ok).toBe(true);
    expect(checkPhone("abc", findCountry("ES")).ok).toBe(false);
  });
});

describe("validateDetails and consents", () => {
  it("accepts a full form and flags every empty or bad field", () => {
    expect(validateDetails(valid)).toEqual({});
    const errors = validateDetails({ ...EMPTY_BOOKING_DETAILS });
    expect(Object.keys(errors).sort()).toEqual(["email", "firstName", "lastName", "phone"]);
    expect(validateDetails({ ...valid, email: "ana@" }).email).toMatch(/valid email/);
    expect(validateDetails({ ...valid, lastName: "  " }).lastName).toBeDefined();
  });

  it("gates the button on privacy, and on cancellation only when the owner wrote a policy", () => {
    const none = { ...valid, acceptPrivacy: false };
    expect(consentsGiven(none, false)).toBe(false);
    expect(consentsGiven(valid, false)).toBe(true);
    expect(consentsGiven(valid, true)).toBe(false);
    expect(consentsGiven({ ...valid, acceptCancellation: true }, true)).toBe(true);
    expect(consentsGiven({ ...none, acceptCancellation: true }, true)).toBe(false);
  });
});

describe("visibleErrors", () => {
  it("shows an error only after the field was visited or the send was tried", () => {
    const all = validateDetails(EMPTY_BOOKING_DETAILS);
    expect(visibleErrors(all, {}, false)).toEqual({});
    expect(Object.keys(visibleErrors(all, { phone: true }, false))).toEqual(["phone"]);
    expect(Object.keys(visibleErrors(all, {}, true)).sort()).toEqual([
      "email",
      "firstName",
      "lastName",
      "phone",
    ]);
  });
});

describe("buildBookingBody", () => {
  it("sends full name, split names, E.164, country and consent", () => {
    const body = buildBookingBody(valid, PICK, false);
    expect(body).toMatchObject({
      serviceId: "svc",
      startAt: SLOT.startAt,
      name: "Ana Lima",
      firstName: "Ana",
      lastName: "Lima",
      phone: "+13055550187",
      phoneCountry: "US",
      email: "ana@example.com",
      acceptedPrivacy: true,
    });
    expect(body).not.toHaveProperty("acceptedCancellation");
  });

  it("adds acceptedCancellation only with a policy and refuses a missing consent", () => {
    const accepted = { ...valid, acceptCancellation: true };
    expect(buildBookingBody(accepted, PICK, true)).toMatchObject({ acceptedCancellation: true });
    expect(buildBookingBody(valid, PICK, true)).toBeNull();
    expect(buildBookingBody({ ...valid, phone: "1" }, PICK, false)).toBeNull();
  });
});

describe("cancellationHoursText", () => {
  it("writes the free-cancellation window", () => {
    expect(cancellationHoursText(24)).toBe("Cancel free up to 24 hours before.");
    expect(cancellationHoursText(1)).toBe("Cancel free up to 1 hour before.");
    expect(cancellationHoursText(0)).toBeNull();
    expect(cancellationHoursText(undefined)).toBeNull();
  });
});

describe("text reminders consent (optional)", () => {
  it("starts unchecked", () => {
    expect(EMPTY_BOOKING_DETAILS.acceptSms).toBe(false);
  });

  it("never gates the button: the box is optional", () => {
    expect(consentsGiven(valid, false)).toBe(true);
    expect(consentsGiven({ ...valid, acceptSms: false }, true)).toBe(false);
    expect(consentsGiven({ ...valid, acceptSms: true }, false)).toBe(true);
  });

  it("books without the box, with or without the owner's text reminders on", () => {
    for (const smsReminders of [false, true]) {
      const body = buildBookingBody(valid, PICK, false, smsReminders);
      expect(body).not.toBeNull();
      expect(body).not.toHaveProperty("acceptedSms");
    }
  });

  it("sends acceptedSms only when the box was checked AND the owner uses text reminders", () => {
    const checked = { ...valid, acceptSms: true };
    expect(buildBookingBody(checked, PICK, false, true)).toMatchObject({ acceptedSms: true });
    expect(buildBookingBody(checked, PICK, false, false)).not.toHaveProperty("acceptedSms");
    // O formato antigo da chamada (3 argumentos) segue valendo.
    expect(buildBookingBody(checked, PICK, false)).not.toHaveProperty("acceptedSms");
  });
});

describe("smsConsentIntro", () => {
  it("is word for word the text the server stores (schema)", () => {
    for (const name of ["Glow Salon", " Fade & Co ", "", "   "]) {
      expect(smsConsentIntro(name)).toBe(schemaIntro(name));
    }
  });
});
