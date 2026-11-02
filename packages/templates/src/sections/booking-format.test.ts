import type { BookingSlot } from "@nosweat/schema";
import { describe, expect, it } from "vitest";
import {
  addDaysToKey,
  dateKeyInZone,
  dayLabel,
  dayLabelLong,
  formatDateTime,
  formatDuration,
  formatNextOpening,
  formatPrice,
  formatTime,
  groupSlots,
  isAvailabilityResponse,
  isPublicBookingInfo,
  manageBookingUrl,
  partOfDay,
  safeTimeZone,
  slotDateKey,
  zoneAbbreviation,
} from "./booking-format";

const NY = "America/New_York";

function slot(startAt: string, staffId: string | null = null): BookingSlot {
  return { startAt, endAt: startAt, staffId };
}

describe("time zone handling", () => {
  it("formats times in the business zone, not the visitor's", () => {
    // 19:30 UTC = 2:30 PM em Nova York (inverno, EST).
    expect(formatTime("2026-12-03T19:30:00Z", NY)).toBe("2:30 PM");
    expect(formatTime("2026-12-03T19:30:00Z", "America/Los_Angeles")).toBe("11:30 AM");
  });

  it("uses the business date even when UTC is already the next day", () => {
    expect(slotDateKey("2026-12-04T02:30:00Z", NY)).toBe("2026-12-03");
    expect(dateKeyInZone(new Date("2026-12-04T02:30:00Z"), "Asia/Tokyo")).toBe("2026-12-04");
  });

  it("shows the zone abbreviation in the long date", () => {
    expect(formatDateTime("2026-12-03T19:30:00Z", NY)).toBe("Thu, Dec 3 at 2:30 PM EST");
    expect(zoneAbbreviation("2026-07-03T19:30:00Z", NY)).toBe("EDT");
  });

  it("falls back to UTC for an unknown zone instead of throwing", () => {
    expect(safeTimeZone("Not/AZone")).toBe("UTC");
    expect(formatTime("2026-12-03T19:30:00Z", "Not/AZone")).toBe("7:30 PM");
  });
});

describe("day labels", () => {
  it("adds days across month and year ends", () => {
    expect(addDaysToKey("2026-12-30", 3)).toBe("2027-01-02");
    expect(addDaysToKey("2026-02-27", 2)).toBe("2026-03-01");
  });

  it("labels today, tomorrow and later days", () => {
    expect(dayLabel("2026-12-02", "2026-12-02")).toBe("Today");
    expect(dayLabel("2026-12-03", "2026-12-02")).toBe("Tomorrow");
    expect(dayLabel("2026-12-09", "2026-12-02")).toBe("Wed 9");
    expect(dayLabelLong("2026-12-09")).toBe("Wednesday, Dec 9");
  });

  it("describes the next opening relative to today", () => {
    const today = "2026-12-02";
    expect(formatNextOpening("2026-12-02T20:00:00Z", NY, today)).toBe("Today 3:00 PM");
    expect(formatNextOpening("2026-12-03T14:00:00Z", NY, today)).toBe("Tomorrow 9:00 AM");
    expect(formatNextOpening("2026-12-08T20:30:00Z", NY, today)).toBe("Tue 3:30 PM");
    expect(formatNextOpening("2026-12-15T20:30:00Z", NY, today)).toBe("Tue, Dec 15, 3:30 PM");
  });
});

describe("grouping", () => {
  it("splits the day into morning, afternoon and evening by the business hour", () => {
    expect(partOfDay("2026-12-03T16:59:00Z", NY)).toBe("morning"); // 11:59
    expect(partOfDay("2026-12-03T17:00:00Z", NY)).toBe("afternoon"); // 12:00
    expect(partOfDay("2026-12-03T21:59:00Z", NY)).toBe("afternoon"); // 16:59
    expect(partOfDay("2026-12-03T22:00:00Z", NY)).toBe("evening"); // 17:00
    expect(partOfDay("2026-12-03T05:00:00Z", NY)).toBe("morning"); // 00:00
  });

  it("sorts, drops empty groups and merges the same time from several people", () => {
    const groups = groupSlots(
      [
        slot("2026-12-03T22:30:00Z", "a"),
        slot("2026-12-03T14:00:00Z", "a"),
        slot("2026-12-03T14:00:00Z", "b"),
        slot("2026-12-03T14:30:00Z", "b"),
      ],
      NY,
    );
    expect(groups.map((group) => group.label)).toEqual(["Morning", "Evening"]);
    expect(groups[0]?.slots.map((item) => item.startAt)).toEqual([
      "2026-12-03T14:00:00Z",
      "2026-12-03T14:30:00Z",
    ]);
    expect(groups[0]?.slots[0]?.staffId).toBe("a");
    expect(groupSlots([], NY)).toEqual([]);
  });
});

describe("labels for services", () => {
  it("formats durations", () => {
    expect(formatDuration(30)).toBe("30 min");
    expect(formatDuration(60)).toBe("1 h");
    expect(formatDuration(90)).toBe("1 h 30 min");
  });

  it("formats prices from cents", () => {
    expect(formatPrice(4500)).toBe("$45");
    expect(formatPrice(4550)).toBe("$45.50");
  });
});

describe("manage link", () => {
  it("is relative on the platform and absolute on a customer domain", () => {
    expect(manageBookingUrl("abc", "www.nosweatfd.com")).toBe("/booking/abc");
    expect(manageBookingUrl("abc", "localhost")).toBe("/booking/abc");
    expect(manageBookingUrl("abc", "joesbarbers.com")).toBe(
      "https://www.nosweatfd.com/booking/abc",
    );
  });
});

describe("response guards", () => {
  it("accepts the public info shape and rejects junk", () => {
    expect(
      isPublicBookingInfo({
        businessName: "Fade & Co",
        businessPhone: null,
        timeZone: NY,
        services: [],
        staff: [],
        maxDaysAhead: 30,
        note: "",
      }),
    ).toBe(true);
    expect(isPublicBookingInfo(null)).toBe(false);
    expect(isPublicBookingInfo({ error: { code: "not_found" } })).toBe(false);
    expect(isAvailabilityResponse({ days: [], timeZone: NY, nextAvailableAt: null })).toBe(true);
    expect(isAvailabilityResponse({})).toBe(false);
  });
});
