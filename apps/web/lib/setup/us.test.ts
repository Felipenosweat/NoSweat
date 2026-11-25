import { describe, expect, it } from "vitest";
import { cleanZip, formatUsPhone, timeZoneForState, timeZoneLabel, usHolidays } from "./us";

const dateOf = (year: number, id: string) => usHolidays(year).find((h) => h.id === id)?.date;

describe("usHolidays", () => {
  it("computes the moving holidays for 2026", () => {
    expect(dateOf(2026, "mlk")).toBe("2026-01-19");
    expect(dateOf(2026, "presidents")).toBe("2026-02-16");
    expect(dateOf(2026, "memorial")).toBe("2026-05-25");
    expect(dateOf(2026, "labor")).toBe("2026-09-07");
    expect(dateOf(2026, "thanksgiving")).toBe("2026-11-26");
  });

  it("computes the moving holidays for 2027", () => {
    expect(dateOf(2027, "mlk")).toBe("2027-01-18");
    expect(dateOf(2027, "presidents")).toBe("2027-02-15");
    expect(dateOf(2027, "memorial")).toBe("2027-05-31");
    expect(dateOf(2027, "labor")).toBe("2027-09-06");
    expect(dateOf(2027, "thanksgiving")).toBe("2027-11-25");
  });

  it("has the fixed dates and stays in date order", () => {
    const list = usHolidays(2026);
    expect(list).toHaveLength(10);
    expect(dateOf(2026, "new-year")).toBe("2026-01-01");
    expect(dateOf(2026, "juneteenth")).toBe("2026-06-19");
    expect(dateOf(2026, "july4")).toBe("2026-07-04");
    expect(dateOf(2026, "xmas-eve")).toBe("2026-12-24");
    expect(dateOf(2026, "xmas")).toBe("2026-12-25");
    const dates = list.map((h) => h.date);
    expect([...dates].sort()).toEqual(dates);
  });

  it("finds Thanksgiving when November starts on a Thursday", () => {
    // 1º de novembro de 2029 é uma quinta-feira: a 4ª é dia 22.
    expect(dateOf(2029, "thanksgiving")).toBe("2029-11-22");
  });
});

describe("time zones", () => {
  it("derives the zone from the state", () => {
    expect(timeZoneForState("FL")).toBe("America/New_York");
    expect(timeZoneForState("ga")).toBe("America/New_York");
    expect(timeZoneForState("TX")).toBe("America/Chicago");
    expect(timeZoneForState("IL")).toBe("America/Chicago");
    expect(timeZoneForState("CO")).toBe("America/Denver");
    expect(timeZoneForState("AZ")).toBe("America/Phoenix");
    expect(timeZoneForState("CA")).toBe("America/Los_Angeles");
    expect(timeZoneForState("WA")).toBe("America/Los_Angeles");
    expect(timeZoneForState("AK")).toBe("America/Anchorage");
    expect(timeZoneForState("HI")).toBe("Pacific/Honolulu");
    expect(timeZoneForState("ZZ")).toBeNull();
    expect(timeZoneForState(undefined)).toBeNull();
  });

  it("names the zones the American way", () => {
    expect(timeZoneLabel("America/New_York")).toBe("Eastern Time (ET)");
    expect(timeZoneLabel("America/Chicago")).toBe("Central Time (CT)");
    expect(timeZoneLabel("Europe/Paris")).toBe("Europe/Paris");
  });
});

describe("US formats", () => {
  it("formats phones as you type", () => {
    expect(formatUsPhone("5")).toBe("5");
    expect(formatUsPhone("51255")).toBe("(512) 55");
    expect(formatUsPhone("5125550100")).toBe("(512) 555-0100");
    expect(formatUsPhone("+1 512-555-0100")).toBe("(512) 555-0100");
  });

  it("keeps a ZIP to five digits", () => {
    expect(cleanZip("78701-1234")).toBe("78701");
    expect(cleanZip("ab12")).toBe("12");
  });
});
