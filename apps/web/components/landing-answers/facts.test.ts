import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { MODEL_LIBRARY } from "@nosweat/fixtures";
import { describe, expect, it } from "vitest";
import { LANDING_FAQS } from "@/components/marketing/faqs";
import { PLANS } from "@/server/billing/plans";
import {
  FEATURED_EXAMPLE,
  MORE_EXAMPLES,
  SHORT_FAQS,
  TERMS_QUOTES,
  contactEmail,
  costAnswer,
  fromPriceLine,
  monthsFreeYearly,
  priceFacts,
} from "./facts";

// A landing "Straight answers" só pode dizer o que o código cumpre. Estes testes amarram cada
// resposta à fonte: preços, Termos, FAQ, e-mail e os sites de exemplo.

const webRoot = path.resolve(__dirname, "../..");

/** Texto visível de um arquivo TSX: sem tags e com os espaços juntados. */
function visibleText(file: string): string {
  return readFileSync(path.join(webRoot, file), "utf8")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ");
}

describe("landing answers: prices", () => {
  it("reads the Starter price from plans.ts", () => {
    expect(priceFacts.starterMonthly).toBe(`$${PLANS.starter.monthlyCents / 100}`);
    expect(costAnswer).toBe(
      `$0 to describe your business. $${PLANS.starter.monthlyCents / 100} a month to put it online.`,
    );
    expect(fromPriceLine).toContain(`$${PLANS.starter.monthlyCents / 100}/mo`);
  });

  it("only strikes the regular price when it is higher than the charged one", () => {
    expect(priceFacts.starterDiscounted).toBe(
      PLANS.starter.regularMonthlyCents > PLANS.starter.monthlyCents,
    );
  });

  it("states the real Starter limits and the other plans", () => {
    expect(priceFacts.starterLines).toContain(
      `${PLANS.starter.socialPostsPerMonth} Instagram posts a month`,
    );
    expect(priceFacts.others.map((plan) => plan.monthly)).toEqual([
      `$${PLANS.pro.monthlyCents / 100}`,
      `$${PLANS.premium.monthlyCents / 100}`,
    ]);
    expect(priceFacts.others[1]?.sites).toBe(
      `Up to ${PLANS.premium.publishedSitesLimit} live websites`,
    );
  });

  it("computes the yearly discount from the annual price", () => {
    expect(PLANS.starter.annualCents).toBe(PLANS.starter.monthlyCents * (12 - monthsFreeYearly));
  });
});

describe("landing answers: leaving and contact", () => {
  it("quotes the cancellation rules word for word from the Terms", () => {
    const terms = visibleText("app/(marketing)/terms/page.tsx");
    for (const quote of Object.values(TERMS_QUOTES)) {
      expect(terms).toContain(`${quote.lead}${quote.rest}`.replace(/\s+/g, " "));
    }
  });

  it("matches the cancel answer in the FAQ", () => {
    const cancel = LANDING_FAQS.find((faq) => faq.question === "Can I cancel?");
    expect(cancel?.answer).toContain("no contract");
    expect(cancel?.answer).toContain("end of the month or year you paid for");
  });

  it("uses the public contact email", () => {
    expect(contactEmail).toBe("hello@nosweatfd.com");
  });

  it("never promises a refund anywhere on the page", () => {
    const dir = path.join(webRoot, "components/landing-answers");
    const files = readdirSync(dir).filter((file) => file.endsWith(".tsx"));
    files.push("facts.ts");
    for (const file of files) {
      expect(readFileSync(path.join(dir, file), "utf8")).not.toMatch(/refund|money.back/i);
    }
    expect(visibleText("app/(landing)/page.tsx")).not.toMatch(/refund|money.back/i);
  });
});

describe("landing answers: FAQ and examples", () => {
  it("shows FAQ entries that exist, without em dashes", () => {
    expect(SHORT_FAQS.length).toBeGreaterThanOrEqual(3);
    for (const faq of SHORT_FAQS) {
      expect(LANDING_FAQS).toContainEqual(faq);
      expect(faq.answer).not.toContain("—");
    }
  });

  it("labels each example with its real fixture name and town, and has its captures", () => {
    for (const example of [FEATURED_EXAMPLE, ...MORE_EXAMPLES]) {
      const entry = MODEL_LIBRARY.find((item) => item.slug === example.slug);
      expect(entry, example.slug).toBeDefined();
      expect(entry?.spec.business.name).toBe(example.name);
      expect(example.place).toBe(`${entry?.spec.business.city}, ${entry?.spec.business.state}`);
      for (const size of ["d", "m"]) {
        const file = path.join(webRoot, `public/landing/signature/${example.slug}-${size}.webp`);
        expect(existsSync(file), file).toBe(true);
      }
    }
  });
});
