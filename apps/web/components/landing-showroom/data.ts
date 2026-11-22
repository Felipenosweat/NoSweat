import { MODEL_LIBRARY } from "@nosweat/fixtures";
import { PLANS } from "@/server/billing/plans";
import { CREDIT_COSTS, MONTHLY_CREDITS } from "@/server/credits/pricing";

// Dados da landing "Showroom": as seis pranchas (sites de exemplo fictícios, mostrados grandes) e
// os números do preço. Tudo lido do código (fixtures, planos, créditos): nada digitado à mão.

/** Ordem das pranchas 01-06. Cada slug tem capturas em public/landing/signature/<slug>-{d,m}.webp. */
export const PLATE_SLUGS = [
  "smoke-and-rail-bbq",
  "bright-spark-electric",
  "still-water-spa",
  "mercer-law",
  "greenline-landscaping",
  "fade-and-co-barbers",
] as const;

export type Plate = {
  slug: string;
  /** "01", "02"... */
  number: string;
  name: string;
  /** "Electrician · Phoenix, AZ · Made-up business" */
  meta: string;
  href: string;
  desktopSrc: string;
  mobileSrc: string;
};

/** As pranchas com nome, ramo e cidade do negócio fictício, tirados da fixture de cada uma. */
export function showroomPlates(): Plate[] {
  return PLATE_SLUGS.map((slug, index) => {
    const entry = MODEL_LIBRARY.find((model) => model.slug === slug);
    if (!entry) throw new Error(`Showroom: fixture "${slug}" not found`);
    const { name, category, city, state } = entry.spec.business;
    const place = [city, state].filter(Boolean).join(", ");
    return {
      slug,
      number: String(index + 1).padStart(2, "0"),
      name,
      meta: [category, place, "Made-up business"].filter(Boolean).join(" · "),
      href: `/examples/${slug}`,
      desktopSrc: `/landing/signature/${slug}-d.webp`,
      mobileSrc: `/landing/signature/${slug}-m.webp`,
    };
  });
}

const dollars = (cents: number) =>
  `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

/** Menor preço mensal entre os planos ("$19"). */
export function fromPrice(): string {
  return dollars(Math.min(...Object.values(PLANS).map((plan) => plan.monthlyCents)));
}

/** Linha de preço embaixo dos botões principais. */
export function priceLine(): string {
  return `Describing your business is free. Plans from ${fromPrice()}/mo when you build.`;
}

/** Linha dos créditos da seção "How it gets built" (preços de server/credits/pricing.ts). */
export function creditsLine(): string {
  return `Asking the AI for a change costs ${CREDIT_COSTS.ai_edit} credits, and Starter includes ${MONTHLY_CREDITS.starter} a month. Editing by hand is always free.`;
}
