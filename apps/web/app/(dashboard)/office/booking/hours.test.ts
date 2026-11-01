import { DEFAULT_BOOKING_SETTINGS } from "@nosweat/schema";
import { describe, expect, it } from "vitest";
import {
  addClosedDate,
  copyMondayToAll,
  formatClosedDate,
  formatHours,
  secondRangeAfter,
  shiftTime,
  weeklyProblem,
  withCurrent,
} from "./hours";

describe("booking hours helpers", () => {
  it("shifts times inside the day", () => {
    expect(shiftTime("12:00", 60)).toBe("13:00");
    expect(shiftTime("23:30", 120)).toBe("23:59");
    expect(shiftTime("00:10", -30)).toBe("00:00");
  });

  it("proposes a second block after the first", () => {
    expect(secondRangeAfter({ start: "09:00", end: "12:00" })).toEqual({
      start: "13:00",
      end: "16:00",
    });
    expect(secondRangeAfter({ start: "09:00", end: "23:30" })).toBeNull();
  });

  it("accepts the default week", () => {
    expect(weeklyProblem(DEFAULT_BOOKING_SETTINGS.weekly)).toBeNull();
  });

  it("flags reversed and overlapping blocks", () => {
    const week = DEFAULT_BOOKING_SETTINGS.weekly.map((day) => day.map((range) => ({ ...range })));
    week[2] = [{ start: "17:00", end: "09:00" }];
    expect(weeklyProblem(week)).toBe("Tuesday: the closing time must be after the opening.");
    week[2] = [
      { start: "09:00", end: "13:00" },
      { start: "12:00", end: "17:00" },
    ];
    expect(weeklyProblem(week)).toBe("Tuesday: the two blocks overlap.");
  });

  it("copies Monday to every day, including a closed Monday", () => {
    const copied = copyMondayToAll(DEFAULT_BOOKING_SETTINGS.weekly);
    expect(copied).toHaveLength(7);
    expect(copied.every((day) => day.length === 1 && day[0]?.start === "09:00")).toBe(true);
    const closed = DEFAULT_BOOKING_SETTINGS.weekly.map((day, i) => (i === 1 ? [] : day));
    expect(copyMondayToAll(closed).every((day) => day.length === 0)).toBe(true);
  });

  it("keeps select options and closed dates tidy", () => {
    expect(withCurrent([15, 30, 60], 45)).toEqual([15, 30, 45, 60]);
    expect(withCurrent([15, 30, 60], 30)).toEqual([15, 30, 60]);
    expect(addClosedDate(["2026-12-25"], "2026-01-01")).toEqual(["2026-01-01", "2026-12-25"]);
    expect(addClosedDate(["2026-12-25"], "2026-12-25")).toEqual(["2026-12-25"]);
    expect(formatClosedDate("2026-12-25")).toBe("Fri, Dec 25, 2026");
    expect(formatHours(0)).toBe("No minimum");
    expect(formatHours(24)).toBe("24 hours");
    expect(formatHours(48)).toBe("2 days");
  });
});
