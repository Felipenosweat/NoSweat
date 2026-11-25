import { PlanId } from "@nosweat/schema";

// Plano escolhido na /pricing (botões "Build my website" → /create?plan=pro). Fica num cookie
// simples (só o id do plano, 30 dias) para o /billing destacar esse plano mais tarde, quando o
// dono for publicar. Não muda preço nem forma de pagar: no modo manual o botão continua sendo o
// contato por WhatsApp/e-mail.

export const PLAN_COOKIE = "ns_plan";
export const PLAN_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

/** Id de plano válido ou `null` (qualquer outra coisa é ignorada). */
export function parsePlanId(value: string | string[] | null | undefined): PlanId | null {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = PlanId.safeParse(raw?.trim().toLowerCase());
  return parsed.success ? parsed.data : null;
}

/** Link da /pricing para o /create levando o plano. */
export function createHrefForPlan(plan: PlanId): string {
  return `/create?plan=${plan}`;
}
