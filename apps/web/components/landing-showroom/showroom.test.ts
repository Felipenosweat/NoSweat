import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { exampleParams } from "@/app/examples/[slug]/example-spec";
import {
  DISPLAY_PLANS,
  planLimits,
  regularOf,
  renewalTerms,
} from "@/components/marketing/PricingPlans";
import { PLANS } from "@/server/billing/plans";
import { CREDIT_COSTS, MONTHLY_CREDITS } from "@/server/credits/pricing";
import { creditsLine, fromPrice, priceLine, showroomPlates } from "./data";

// Landing "Showroom": as pranchas apontam para exemplos que existem, com capturas no disco e
// rótulo de negócio inventado; os preços e créditos mostrados vêm do código de cobrança.

const publicDir = fileURLToPath(new URL("../../public", import.meta.url));

describe("landing Showroom", () => {
  const plates = showroomPlates();

  it("mostra seis pranchas numeradas 01-06, cada uma com as duas capturas no disco", () => {
    expect(plates.map((plate) => plate.number)).toEqual(["01", "02", "03", "04", "05", "06"]);
    for (const plate of plates) {
      expect(existsSync(`${publicDir}${plate.desktopSrc}`)).toBe(true);
      expect(existsSync(`${publicDir}${plate.mobileSrc}`)).toBe(true);
    }
  });

  it("cada prancha abre um /examples/<slug> que existe no build", () => {
    const slugs = new Set(exampleParams().map(({ slug }) => slug));
    for (const plate of plates) {
      expect(plate.href).toBe(`/examples/${plate.slug}`);
      expect(slugs.has(plate.slug)).toBe(true);
    }
  });

  it("diz que todo exemplo é um negócio inventado, com ramo e cidade da fixture", () => {
    const electric = plates.find((plate) => plate.slug === "bright-spark-electric");
    expect(electric?.name).toBe("Bright Spark Electric");
    expect(electric?.meta).toBe("Electrician · Phoenix, AZ · Made-up business");
    for (const plate of plates) expect(plate.meta.endsWith("· Made-up business")).toBe(true);
  });

  it("lê o preço inicial e os créditos do código de cobrança", () => {
    const cheapest = Math.min(...Object.values(PLANS).map((plan) => plan.monthlyCents));
    expect(fromPrice()).toBe(`$${cheapest / 100}`);
    expect(priceLine()).toBe(
      `Describing your business is free. Plans from ${fromPrice()}/mo when you build.`,
    );
    expect(creditsLine()).toContain(`${CREDIT_COSTS.ai_edit} credits`);
    expect(creditsLine()).toContain(`${MONTHLY_CREDITS.starter} a month`);
  });

  it("os planos mostrados batem com os preços cobrados e os limites de cada plano", () => {
    for (const shown of DISPLAY_PLANS) {
      const billing = PLANS[shown.id as keyof typeof PLANS];
      expect(shown.monthly).toBe(`$${(billing.monthlyCents / 100).toLocaleString("en-US")}`);
      expect(shown.annual).toBe(`$${(billing.annualCents / 100).toLocaleString("en-US")}`);
      const limits = planLimits(shown.id);
      expect(limits).toHaveLength(4);
      expect(limits.join(" ")).toContain(
        `${MONTHLY_CREDITS[billing.id].toLocaleString("en-US")} AI credits`,
      );
    }
    expect(planLimits("starter")[0]).toBe("1 live website");
    expect(planLimits("pro")[0]).toBe(`Up to ${PLANS.pro.publishedSitesLimit} live websites`);
  });

  it("só risca o preço normal quando ele é maior que o cobrado", () => {
    for (const shown of DISPLAY_PLANS) {
      const billing = PLANS[shown.id as keyof typeof PLANS];
      const off = regularOf(shown.id).percentOff;
      expect(off > 0).toBe(billing.regularMonthlyCents > billing.monthlyCents);
    }
  });

  it("as regras de renovação junto do botão seguem o modo de venda", () => {
    const starter = DISPLAY_PLANS[0]!;
    expect(renewalTerms(starter, false, true)).toContain(`every month at ${starter.monthly}`);
    expect(renewalTerms(starter, true, true)).toContain(`every year at ${starter.annual}`);
    expect(renewalTerms(starter, false, false)).toContain("does not renew automatically");
  });
});
