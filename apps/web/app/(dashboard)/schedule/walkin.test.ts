import { describe, expect, it } from "vitest";
import { roundUpToQuarter } from "./walkin";

describe("roundUpToQuarter", () => {
  it("rounds up to the next quarter hour", () => {
    expect(roundUpToQuarter(9 * 60 + 1)).toBe("09:15");
    expect(roundUpToQuarter(9 * 60 + 14)).toBe("09:15");
    expect(roundUpToQuarter(9 * 60 + 46)).toBe("10:00");
  });

  it("keeps a time that is already on a quarter", () => {
    expect(roundUpToQuarter(14 * 60)).toBe("14:00");
    expect(roundUpToQuarter(14 * 60 + 30)).toBe("14:30");
  });

  it("never passes 11:45 PM", () => {
    expect(roundUpToQuarter(23 * 60 + 50)).toBe("23:45");
    expect(roundUpToQuarter(0)).toBe("00:00");
  });
});
