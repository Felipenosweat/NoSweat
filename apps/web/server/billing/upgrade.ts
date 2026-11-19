import type { PlanId } from "@nosweat/schema";
import type { Plan } from "./plans";

// Convite para o próximo plano (painel "Your plan" em /billing): qual é o próximo e o que ele
// acrescenta. Só números que já existem em plans.ts e credits/pricing.ts; nada de promessa nova.

const ORDER: PlanId[] = ["starter", "pro", "premium"];

/** Plano logo acima (`null` no último). */
export function nextPlanId(plan: PlanId): PlanId | null {
  return ORDER[ORDER.indexOf(plan) + 1] ?? null;
}

const count = (value: number) => value.toLocaleString("en-US");

/** O que `to` tem a mais que `from`, em frases curtas (só o que de fato aumenta). */
export function upgradeGains(
  from: Plan,
  to: Plan,
  credits: { from: number; to: number },
): string[] {
  const gains: string[] = [];
  if (to.publishedSitesLimit > from.publishedSitesLimit) {
    gains.push(
      `${count(to.publishedSitesLimit)} live websites (you have ${from.publishedSitesLimit})`,
    );
  }
  if (credits.to > credits.from) {
    gains.push(`${count(credits.to)} AI credits every month (you have ${count(credits.from)})`);
  }
  if (to.socialPostsPerMonth > from.socialPostsPerMonth) {
    gains.push(
      `${count(to.socialPostsPerMonth)} Instagram posts a month (you have ${from.socialPostsPerMonth})`,
    );
  }
  return gains;
}
