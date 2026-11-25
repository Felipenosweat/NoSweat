import { describe, expect, it } from "vitest";
import { createHrefForPlan, parsePlanId } from "./chosen-plan";

describe("chosen plan (pricing → create → billing)", () => {
  it("accepts only real plan ids", () => {
    expect(parsePlanId("pro")).toBe("pro");
    expect(parsePlanId(" Premium ")).toBe("premium");
    expect(parsePlanId(["starter", "pro"])).toBe("starter");
    expect(parsePlanId("enterprise")).toBeNull();
    expect(parsePlanId("pro; Path=/")).toBeNull();
    expect(parsePlanId(undefined)).toBeNull();
  });

  it("builds the /create link for each plan button", () => {
    expect(createHrefForPlan("pro")).toBe("/create?plan=pro");
  });
});
