import { describe, expect, it } from "vitest";
import { currentMonth, isValidTimeZone, monthRangeUtc, zonedTimeToUtc } from "./service";

describe("social time zone helpers", () => {
  it("converts the owner's local time to UTC, including daylight saving", () => {
    // Nova York: -4 h no horário de verão (julho), -5 h no inverno (dezembro).
    expect(zonedTimeToUtc("2026-07-14", "10:00", "America/New_York")).toBe(
      "2026-07-14T14:00:00.000Z",
    );
    expect(zonedTimeToUtc("2026-12-01", "10:00", "America/New_York")).toBe(
      "2026-12-01T15:00:00.000Z",
    );
    expect(zonedTimeToUtc("2026-12-01", "10:00", "UTC")).toBe("2026-12-01T10:00:00.000Z");
  });

  it("gives the month range in the business time zone", () => {
    expect(monthRangeUtc("2026-12", "America/New_York")).toEqual({
      fromIso: "2026-12-01T05:00:00.000Z",
      toIso: "2027-01-01T05:00:00.000Z",
    });
  });

  it("knows the current month in the time zone", () => {
    // 2 h da manhã de 1º de dezembro em UTC ainda é 30 de novembro em Nova York.
    expect(currentMonth("America/New_York", new Date("2026-12-01T02:00:00Z"))).toBe("2026-11");
    expect(isValidTimeZone("America/Chicago")).toBe(true);
    expect(isValidTimeZone("Mars/Base")).toBe(false);
  });
});
