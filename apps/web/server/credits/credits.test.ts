import { ApiError } from "@nosweat/schema";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getGrantStore } from "../billing";
import { refundUse, remainingUses, reserveUse } from "../quota";
import type { Actor } from "../sites";
import { getSiteStore } from "../store";
import {
  adminAdjustCredits,
  addTopupCredits,
  creditCost,
  getBalance,
  MONTHLY_CREDITS,
  refundCredits,
  spendCredits,
} from "./index";
import { periodEnd, periodStart } from "./pricing";

// Sem Supabase nos testes: créditos, planos e uso da IA ficam na memória.

const ALLOWANCE = 10;
let previousAllowance: string | undefined;

beforeEach(() => {
  previousAllowance = process.env.CREDITS_MONTHLY_NO_PLAN;
  process.env.CREDITS_MONTHLY_NO_PLAN = String(ALLOWANCE);
});

afterEach(() => {
  if (previousAllowance === undefined) delete process.env.CREDITS_MONTHLY_NO_PLAN;
  else process.env.CREDITS_MONTHLY_NO_PLAN = previousAllowance;
});

/** Conta nova (sem plano, sem gastos) para cada teste. */
function newUser(): Extract<Actor, { kind: "user" }> {
  return { kind: "user", user: { id: `credits-${crypto.randomUUID()}`, email: null } };
}

describe("credit balance", () => {
  it("starts with the monthly allowance of an account without a plan", async () => {
    const actor = newUser();
    const balance = await getBalance(actor.user);
    expect(balance).toMatchObject({
      unlimited: false,
      monthlyAllowance: ALLOWANCE,
      monthlyUsed: 0,
      monthlyLeft: ALLOWANCE,
      topup: 0,
      total: ALLOWANCE,
    });
    expect(balance.resetsAt).toBe(periodEnd().toISOString());
  });

  it("uses the allowance of the active plan", async () => {
    const actor = newUser();
    await getGrantStore().upsert({
      userId: actor.user.id,
      plan: "pro",
      expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
      note: null,
      grantedBy: null,
      updatedAt: new Date().toISOString(),
    });
    expect((await getBalance(actor.user)).monthlyAllowance).toBe(MONTHLY_CREDITS.pro);
  });

  it("spends the monthly allowance first, then top-up credits", async () => {
    const actor = newUser();
    await addTopupCredits(actor.user.id, 20);
    const cost = creditCost("generate");
    // Gasta até sobrar menos que um uso na cota do mês.
    let spent = 0;
    while (ALLOWANCE - spent >= cost) {
      expect(await spendCredits(actor, "generate")).toBeNull();
      spent += cost;
    }
    expect(await getBalance(actor.user)).toMatchObject({ monthlyUsed: spent, topup: 20 });
    // O próximo sai do resto da cota e do top-up.
    expect(await spendCredits(actor, "generate")).toBeNull();
    const after = await getBalance(actor.user);
    expect(after.monthlyLeft).toBe(0);
    expect(after.topup).toBe(20 - (cost - (ALLOWANCE - spent)));
    expect(after.total).toBe(ALLOWANCE + 20 - spent - cost);
  });

  it("answers 402 out_of_credits when the balance is not enough", async () => {
    process.env.CREDITS_MONTHLY_NO_PLAN = String(creditCost("generate") - 1);
    const actor = newUser();
    const res = await spendCredits(actor, "generate");
    expect(res?.status).toBe(402);
    const body = ApiError.parse(await res?.json());
    expect(body.error.code).toBe("out_of_credits");
    expect(body.error.message).toMatch(/credits/);
    // Nada foi descontado.
    expect((await getBalance(actor.user)).monthlyUsed).toBe(0);
  });

  it("refunds the last spend when the AI fails", async () => {
    const actor = newUser();
    await spendCredits(actor, "ai_edit", "site-1");
    expect((await getBalance(actor.user)).monthlyUsed).toBe(creditCost("ai_edit"));
    await refundCredits(actor, "ai_edit");
    expect((await getBalance(actor.user)).monthlyUsed).toBe(0);
    // Devolver de novo não dá crédito extra.
    await refundCredits(actor, "ai_edit");
    expect((await getBalance(actor.user)).monthlyLeft).toBe(ALLOWANCE);
  });

  it("resets the monthly allowance next month and keeps top-up credits", async () => {
    const actor = newUser();
    await addTopupCredits(actor.user.id, 7);
    await spendCredits(actor, "ai_edit");
    const nextMonth = new Date(periodEnd().getTime() + 60_000);
    expect(periodStart(nextMonth).toISOString()).toBe(periodEnd().toISOString());
    expect(await getBalance(actor.user, nextMonth)).toMatchObject({
      monthlyUsed: 0,
      monthlyLeft: ALLOWANCE,
      topup: 7,
    });
  });

  it("lets the admin add and remove credits, never below zero", async () => {
    const actor = newUser();
    expect((await adminAdjustCredits(actor.user.id, 15, "Courtesy")).topup).toBe(15);
    expect((await adminAdjustCredits(actor.user.id, -100, "Fix")).topup).toBe(0);
    await expect(adminAdjustCredits(actor.user.id, 1.5, null)).rejects.toThrow();
  });

  it("does not charge guests (they keep the GUEST_* limits)", async () => {
    expect(await spendCredits({ kind: "guest", guestId: "g-credits" }, "generate")).toBeNull();
  });
});

describe("quota with credits", () => {
  it("blocks signed-in AI use without credits and logs nothing", async () => {
    process.env.CREDITS_MONTHLY_NO_PLAN = "0";
    const actor = newUser();
    const res = await reserveUse(actor, "ai_edit");
    expect(res?.status).toBe(402);
    expect(ApiError.parse(await res?.json()).error.code).toBe("out_of_credits");
    expect(
      await getSiteStore().countAiUsage(actor.user.id, "ai_edit", "1970-01-01T00:00:00Z"),
    ).toBe(0);
    expect(await remainingUses(actor, "ai_edit")).toBe(0);
  });

  it("charges credits, logs the use and refunds on failure", async () => {
    const actor = newUser();
    expect(await reserveUse(actor, "ai_edit")).toBeNull();
    expect(
      await getSiteStore().countAiUsage(actor.user.id, "ai_edit", "1970-01-01T00:00:00Z"),
    ).toBe(1);
    expect((await getBalance(actor.user)).monthlyUsed).toBe(creditCost("ai_edit"));
    expect(await remainingUses(actor, "ai_edit")).toBe(
      Math.floor((ALLOWANCE - creditCost("ai_edit")) / creditCost("ai_edit")),
    );
    await refundUse(actor, "ai_edit");
    expect((await getBalance(actor.user)).monthlyUsed).toBe(0);
  });
});
