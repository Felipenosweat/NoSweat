import { describe, expect, it } from "vitest";
import { getBalance } from "./index";
import { grantOfferBonus } from "./offer-bonus";
import { getCreditStore } from "./store";

describe("grantOfferBonus", () => {
  it("gives the offer bonus once per account", async () => {
    const userId = `bonus-${Math.random().toString(36).slice(2)}`;
    const now = new Date("2026-11-26T12:00:00Z");
    expect(await grantOfferBonus(userId, now)).toBe(100);
    expect(await grantOfferBonus(userId, now)).toBe(0);
    const entries = await getCreditStore().listSince(userId, "1970-01-01T00:00:00.000Z");
    expect(entries.filter((entry) => entry.meta.kind === "offer_bonus")).toHaveLength(1);
    expect(entries[0]?.meta.offer).toBe("Black Friday");
    const balance = await getBalance({ id: userId }, now);
    expect(balance.topup).toBe(100);
  });
});
