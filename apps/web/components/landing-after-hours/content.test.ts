import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { MODEL_LIBRARY } from "@nosweat/fixtures";
import { describe, expect, it } from "vitest";
import { LANDING_FAQS } from "@/components/marketing/faqs";
import { PLANS } from "@/server/billing/plans";
import { MONTHLY_CREDITS } from "@/server/credits/pricing";
import {
  EXAMPLE_SLUGS,
  exampleSites,
  HERO,
  heroProof,
  landingFaqs,
  lowestMonthly,
  OFFICE_TOOLS,
  OVERNIGHT_REQUESTS,
  planCards,
  priceLine,
  REQUEST_CAPTION,
  yearlyNote,
} from "./content";
import { photoCredits, PHOTOS } from "./photos";

// Cada número e cada fato da landing "After hours" amarrado à fonte (plans.ts, credits/pricing.ts,
// fixtures, faqs.ts), e o texto novo livre de palavras proibidas, travessões e reembolso.

const HERE = fileURLToPath(new URL(".", import.meta.url));
const WEB = join(HERE, "..", "..");
const money = (cents: number) =>
  `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: cents % 100 ? 2 : 0 })}`;

describe("prices and limits", () => {
  it("the 'Plans from' line uses the cheapest monthly price in plans.ts", () => {
    const cheapest = Math.min(...Object.values(PLANS).map((plan) => plan.monthlyCents));
    expect(lowestMonthly()).toBe(money(cheapest));
    expect(priceLine()).toContain(`Plans from ${money(cheapest)}/mo`);
  });

  it("each plan card shows the charged prices and 4 real limits", () => {
    const cards = planCards(false);
    expect(cards.map((card) => card.id)).toEqual(Object.keys(PLANS));
    for (const card of cards) {
      const plan = PLANS[card.id as keyof typeof PLANS];
      expect(card.monthly).toBe(money(plan.monthlyCents));
      expect(card.annual).toBe(money(plan.annualCents));
      expect(card.limits).toHaveLength(4);
      expect(card.limits.join(" ")).toContain(String(plan.publishedSitesLimit));
      expect(card.limits.join(" ")).toContain(
        `${MONTHLY_CREDITS[plan.id].toLocaleString("en-US")} AI credit`,
      );
      expect(card.limits.join(" ")).toContain(`${plan.socialPostsPerMonth} Instagram post`);
      expect(card.regular).toBeNull();
    }
  });

  it("only Starter carries the neutral label", () => {
    const notes = planCards(false).map((card) => card.note);
    expect(notes).toEqual(["A good place to start", null, null]);
  });

  it("struck prices only appear with the promo on and a regular price above the charged one", () => {
    for (const card of planCards(true)) {
      const plan = PLANS[card.id as keyof typeof PLANS];
      if (plan.regularMonthlyCents > plan.monthlyCents) {
        expect(card.regular?.monthly).toBe(money(plan.regularMonthlyCents));
      } else {
        expect(card.regular).toBeNull();
      }
    }
  });

  it("'2 months free' only when yearly is exactly 10 months", () => {
    const tenMonths = Object.values(PLANS).every(
      (plan) => plan.annualCents === plan.monthlyCents * 10,
    );
    expect(yearlyNote()).toBe(tenMonths ? "2 months free" : null);
  });
});

describe("examples", () => {
  it("example names, trades and cities come from the fixtures", () => {
    const sites = exampleSites();
    expect(sites.map((site) => site.slug)).toEqual([...EXAMPLE_SLUGS]);
    expect(sites).toHaveLength(4);
    for (const site of [...sites, heroProof()]) {
      const entry = MODEL_LIBRARY.find((model) => model.slug === site.slug);
      expect(entry).toBeDefined();
      expect(site.name).toBe(entry?.spec.business.name);
      expect(site.trade).toBe(entry?.spec.business.category);
      expect(site.city).toBe(entry?.spec.business.city);
      expect(site.label.endsWith("· Made-up business")).toBe(true);
      expect(existsSync(join(WEB, "public/landing/signature", `${site.slug}-d.webp`))).toBe(true);
      expect(existsSync(join(WEB, "public/landing/signature", `${site.slug}-m.webp`))).toBe(true);
    }
  });

  it("the site rising from the hero photo says it is made up", () => {
    const proof = heroProof();
    expect(proof.caption).toContain(proof.name);
    expect(proof.caption).toContain(proof.city);
    expect(proof.caption).toMatch(/An example site; the business is made up\.$/);
  });
});

describe("after hours", () => {
  it("the hero promise matches what the product does after hours", () => {
    // Pedidos do formulário e marcações viram e-mail ao dono (server/notify).
    expect(existsSync(join(WEB, "server/notify/lead-email.ts"))).toBe(true);
    expect(existsSync(join(WEB, "server/notify/booking-email.ts"))).toBe(true);
    expect(HERO.lead).toMatch(/requests and bookings/);
  });

  it("the overnight list is three labeled examples through the night", () => {
    expect(OVERNIGHT_REQUESTS).toHaveLength(3);
    expect(REQUEST_CAPTION).toBe("Example");
    expect(OVERNIGHT_REQUESTS.map((request) => request.time)).toEqual([
      "9:42 PM",
      "11:18 PM",
      "6:05 AM",
    ]);
    expect(OVERNIGHT_REQUESTS.some((request) => request.kind === "Booking")).toBe(true);
  });

  it("every office tool exists in the dashboard", () => {
    for (const tool of OFFICE_TOOLS) {
      expect(existsSync(join(WEB, "app/(dashboard)", tool.route, "page.tsx"))).toBe(true);
    }
    expect(existsSync(join(WEB, "app/(dashboard)/invoices/page.tsx"))).toBe(true);
  });
});

describe("photos", () => {
  it("has one photo per role", () => {
    expect(Object.keys(PHOTOS).sort()).toEqual(["closing", "hero", "office", "overnight"]);
  });

  it("every photo has an Unsplash source, alt text and photographer credit", () => {
    for (const photo of Object.values(PHOTOS)) {
      expect(photo.src.startsWith("https://images.unsplash.com/")).toBe(true);
      expect(photo.alt.length).toBeGreaterThan(20);
      expect(photo.alt).not.toMatch(/customer|client of|no sweat/i);
      expect(photo.photographer.length).toBeGreaterThan(0);
      expect(photo.profile).toMatch(/^https:\/\/unsplash\.com\/@/);
      expect(photo.page).toContain(photo.id);
    }
  });

  it("the credits line lists every photographer once", () => {
    const names = new Set(Object.values(PHOTOS).map((photo) => photo.photographer));
    expect(photoCredits().map((credit) => credit.name)).toEqual([...names]);
  });
});

describe("FAQ", () => {
  it("shows 6 questions, word for word from faqs.ts", () => {
    const faqs = landingFaqs();
    expect(faqs).toHaveLength(6);
    for (const faq of faqs) expect(LANDING_FAQS).toContainEqual(faq);
  });
});

describe("copy rules", () => {
  // Todo o texto novo: os arquivos desta pasta (menos este teste) e as perguntas mostradas.
  const sources = readdirSync(HERE)
    .filter((file) => /\.tsx?$/.test(file) && !file.endsWith(".test.ts"))
    .map((file) => readFileSync(join(HERE, file), "utf8"));
  const text = [...sources, ...landingFaqs().map((faq) => `${faq.question} ${faq.answer}`)].join(
    "\n",
  );

  it("has no em dashes", () => {
    expect(text).not.toContain("—");
  });

  it("has no banned words", () => {
    for (const banned of [
      /\bnot just\b/i,
      /seamless/i,
      /\belevat/i,
      /\bunlock/i,
      /ai magic/i,
      /supercharg/i,
      /trusted by/i,
      /game[- ]changer/i,
    ]) {
      expect(text).not.toMatch(banned);
    }
  });

  it("makes no refund claim", () => {
    expect(text).not.toMatch(/refund|money[- ]back/i);
  });

  it("shows no ratings or invented stats", () => {
    expect(text).not.toMatch(/★|\b\d(\.\d)? stars?\b|\d+[,.]?\d*\+? (customers|businesses|users)/i);
  });
});
