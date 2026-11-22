import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { LANDING_FAQS } from "@/components/marketing/faqs";
import { PLANS, promoPercentOff } from "@/server/billing/plans";
import { CREDIT_COSTS, MONTHLY_CREDITS } from "@/server/credits/pricing";
import {
  FREE_MONTHS,
  LIVE_FAQS,
  LOWEST_MONTHLY,
  OFFICE_EXTRAS,
  OFFICE_TABS,
  PLAN_ORDER,
  TRADES,
  dollars,
  limitRows,
  planColumns,
  type LimitRow,
} from "./content";

// Amarra cada número e cada afirmação da landing "Live" à fonte: preços a plans.ts, créditos a
// credits/pricing.ts, perguntas a faqs.ts, exemplos a app/demos e capturas a public/landing/real.
// Também varre o texto dos componentes: nada de reembolso, travessão ou palavra proibida, e
// nenhum preço escrito à mão.

const here = dirname(fileURLToPath(import.meta.url));
const web = join(here, "..", "..");

const sources = readdirSync(here)
  .filter((name) => name.endsWith(".tsx") || name === "content.ts")
  .map((name) => ({ name, text: readFileSync(join(here, name), "utf8") }));
const pageText = readFileSync(join(web, "app", "(landing)", "page.tsx"), "utf8");

/** Só o texto que o visitante lê (tira comentários de linha e de bloco). */
const visible = (text: string) =>
  text
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "")
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "");

describe("landing live: prices come from plans.ts", () => {
  it("formats cents", () => {
    expect(dollars(1900)).toBe("$19");
    expect(dollars(129000)).toBe("$1,290");
    expect(dollars(19000 / 12)).toBe("$15.83");
  });

  it("shows the lowest monthly price", () => {
    const lowest = Math.min(...Object.values(PLANS).map((plan) => plan.monthlyCents));
    expect(LOWEST_MONTHLY).toBe(dollars(lowest));
  });

  it("has a column per plan with the charged prices", () => {
    const columns = planColumns();
    expect(columns.map((column) => column.id)).toEqual(Object.keys(PLANS));
    for (const column of columns) {
      const plan = PLANS[column.id];
      expect(column.name).toBe(plan.name);
      expect(column.monthly).toBe(dollars(plan.monthlyCents));
      expect(column.annual).toBe(dollars(plan.annualCents));
      expect(column.annualPerMonth).toBe(dollars(plan.annualCents / 12));
      expect(column.percentOff).toBe(promoPercentOff(plan));
      // Riscado só onde o preço normal é maior que o cobrado.
      if (plan.regularMonthlyCents > plan.monthlyCents) {
        expect(column.regularMonthly).toBe(dollars(plan.regularMonthlyCents));
        expect(column.regularAnnual).toBe(dollars(plan.regularMonthlyCents * 10));
      } else {
        expect(column.regularMonthly).toBeNull();
        expect(column.regularAnnual).toBeNull();
      }
    }
  });

  it("'2 months free' is exact (yearly = 10x monthly on every plan)", () => {
    expect(FREE_MONTHS).toBe(2);
    for (const plan of Object.values(PLANS)) expect(plan.annualCents).toBe(plan.monthlyCents * 10);
  });
});

describe("landing live: limits come from plans.ts and credits/pricing.ts", () => {
  const row = (label: string): LimitRow => {
    const found = limitRows().find((item) => item.label === label);
    if (!found) throw new Error(`missing row ${label}`);
    return found;
  };

  it("live websites", () => {
    for (const id of PLAN_ORDER)
      expect(row("Live websites").values[id]).toBe(String(PLANS[id].publishedSitesLimit));
  });

  it("monthly AI credits and credit costs", () => {
    for (const id of PLAN_ORDER)
      expect(row("AI credits every month").values[id]).toBe(
        MONTHLY_CREDITS[id].toLocaleString("en-US"),
      );
    expect(row("AI credits every month").note).toContain(`uses ${CREDIT_COSTS.generate}.`);
    expect(row("AI credits every month").note).toContain(`uses ${CREDIT_COSTS.ai_edit}.`);
  });

  it("Instagram posts and own domain", () => {
    for (const id of PLAN_ORDER) {
      expect(row("Instagram posts a month").values[id]).toBe(String(PLANS[id].socialPostsPerMonth));
      expect(row("Your own domain").values[id]).toBe(PLANS[id].customDomain ? "Yes" : "No");
    }
  });
});

describe("landing live: examples, captures and tools exist", () => {
  it("every trade tab points at a demo under app/demos", () => {
    expect(TRADES.length).toBeGreaterThanOrEqual(5);
    for (const trade of TRADES) {
      expect(existsSync(join(web, "app", "demos", trade.slug, "page.tsx")), trade.slug).toBe(true);
    }
  });

  it("every office tab uses a real capture", () => {
    for (const tab of OFFICE_TABS) {
      expect(existsSync(join(web, "public", tab.src)), tab.src).toBe(true);
    }
  });

  it("every 'also in the office' tool has a real dashboard page", () => {
    for (const tool of OFFICE_EXTRAS) {
      expect(existsSync(join(web, "app", "(dashboard)", tool.route, "page.tsx")), tool.route).toBe(
        true,
      );
    }
  });
});

describe("landing live: FAQ", () => {
  it("shows 6 questions copied from faqs.ts, and the JSON-LD uses the same list", () => {
    expect(LIVE_FAQS).toHaveLength(6);
    for (const faq of LIVE_FAQS) expect(LANDING_FAQS).toContainEqual(faq);
    expect(pageText).toContain("faqPage(LIVE_FAQS");
    expect(pageText).not.toContain("faqPage(LANDING_FAQS");
  });
});

describe("landing live: honest copy", () => {
  const everything = [
    ...sources.map((source) => ({ name: source.name, text: visible(source.text) })),
    ...LIVE_FAQS.map((faq) => ({ name: faq.question, text: `${faq.question} ${faq.answer}` })),
  ];

  it("has no refund wording", () => {
    for (const { name, text } of everything) expect(text, name).not.toMatch(/refund/i);
  });

  it("has no em dashes or banned words", () => {
    for (const { name, text } of everything) {
      expect(text, name).not.toContain("—");
      expect(text, name).not.toMatch(
        /\b(seamless|elevate|unlock|AI magic|not just|trusted by|testimonial)\b/i,
      );
    }
  });

  it("writes no price by hand in the components", () => {
    for (const source of sources.filter((item) => item.name.endsWith(".tsx"))) {
      expect(visible(source.text), source.name).not.toMatch(/\$\d/);
    }
  });

  it("labels the examples as made up", () => {
    const text = sources.map((source) => source.text).join("\n");
    expect(text).toContain("Made-up business.");
    expect(text).toContain("Real No Sweat screen. The data is made up.");
  });
});
