import { fixtures } from "@nosweat/fixtures";
import { SiteSpec } from "@nosweat/schema";
import { describe, expect, it } from "vitest";
import { keepPayments, withPayments } from "./payments";

const glow = SiteSpec.parse(fixtures["glow-salon"]);
const rosa = SiteSpec.parse(fixtures["rosas-kitchen"]);

describe("payments on the spec", () => {
  it("withPayments sets, replaces and clears without touching the input", () => {
    const next = withPayments(rosa, { methods: [{ method: "cash" }] });
    expect(next.business.payments).toEqual({ methods: [{ method: "cash" }] });
    expect(rosa.business.payments).toBeUndefined();
    expect(withPayments(glow, undefined).business.payments).toBeUndefined();
    expect(withPayments(glow, { methods: [] }).business.payments).toBeUndefined();
    expect(glow.business.payments).toBeDefined();
  });

  it("keepPayments gives the AI no say: it restores the owner's choice or removes the AI's", () => {
    const aiInvented = withPayments(rosa, { methods: [{ method: "venmo", handle: "@ai" }] });
    expect(keepPayments(aiInvented, null).business.payments).toBeUndefined();
    expect(keepPayments(aiInvented, glow).business.payments).toEqual(glow.business.payments);
    const aiRemoved = withPayments(glow, undefined);
    expect(keepPayments(aiRemoved, glow).business.payments).toEqual(glow.business.payments);
  });
});
