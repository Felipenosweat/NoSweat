import { describe, expect, it } from "vitest";
import {
  AI_COST_PER_USE_USD,
  AI_USAGE_KINDS,
  estimateAiCostUsd,
  estimateKindCostUsd,
  formatUsd,
  totalUses,
} from "./costs";

describe("AI cost estimate", () => {
  it("uses the price table for every kind", () => {
    expect(AI_COST_PER_USE_USD).toEqual({
      generate: 0.06,
      ai_edit: 0.01,
      social_plan: 0.03,
      social_caption: 0.002,
    });
    expect([...AI_USAGE_KINDS].sort()).toEqual(Object.keys(AI_COST_PER_USE_USD).sort());
  });

  it("multiplies uses by the price of each kind and adds them up", () => {
    expect(estimateKindCostUsd("generate", 10)).toBe(0.6);
    expect(estimateKindCostUsd("social_caption", 3)).toBe(0.006);
    // 10 × 0.06 + 5 × 0.01 + 2 × 0.03 + 7 × 0.002 = 0.6 + 0.05 + 0.06 + 0.014 = 0.724
    expect(estimateAiCostUsd({ generate: 10, ai_edit: 5, social_plan: 2, social_caption: 7 })).toBe(
      0.724,
    );
  });

  it("does not drift with many small uses", () => {
    expect(estimateAiCostUsd({ social_caption: 1000 })).toBe(2);
    expect(estimateAiCostUsd({ ai_edit: 333 })).toBe(3.33);
  });

  it("treats missing, negative or fractional counts safely", () => {
    expect(estimateAiCostUsd({})).toBe(0);
    expect(estimateAiCostUsd({ generate: -4 })).toBe(0);
    expect(estimateAiCostUsd({ generate: 2.9 })).toBe(0.12);
    expect(totalUses({ generate: 2, social_caption: 5 })).toBe(7);
  });

  it("formats dollars, never showing $0.00 for something that cost money", () => {
    expect(formatUsd(0)).toBe("$0.00");
    expect(formatUsd(0.004)).toBe("<$0.01");
    expect(formatUsd(0.724)).toBe("$0.72");
    expect(formatUsd(1234.5)).toBe("$1,234.50");
  });
});
