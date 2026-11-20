import { isActiveStatus } from "../billing";
import { isGrantActive, type AccessGrant } from "../billing/grants";
import type { SubscriptionRecord } from "../billing/store";

// Clientes de verdade, para decidir quando subir os preços (meta do fundador: 10 clientes ativos).
// Só conta quem pagou de fato: assinatura do Stripe ativa (o dinheiro entra sozinho) ou acesso
// manual (Pix/WhatsApp) que o admin marcou como "pagamento recebido". Admins, contas de teste e
// acessos de cortesia ficam de fora.

export const CUSTOMER_GOAL = 10;

export type RealCustomers = {
  /** Clientes de verdade agora (Stripe + manuais confirmados). */
  count: number;
  stripe: number;
  manual: number;
  goal: number;
  reached: boolean;
  /** Acessos manuais ativos SEM confirmação de pagamento (não contam, e o admin pode confirmar). */
  unconfirmed: number;
};

export function realCustomers(
  subscriptions: readonly SubscriptionRecord[],
  grants: readonly AccessGrant[],
  excluded: ReadonlySet<string>,
  now: Date = new Date(),
): RealCustomers {
  const stripe = new Set<string>();
  for (const sub of subscriptions) {
    if (!sub.plan || !isActiveStatus(sub.status) || excluded.has(sub.userId)) continue;
    stripe.add(sub.userId);
  }
  const manual = new Set<string>();
  let unconfirmed = 0;
  for (const grant of grants) {
    if (excluded.has(grant.userId) || stripe.has(grant.userId) || !isGrantActive(grant, now)) {
      continue;
    }
    if (grant.paymentConfirmedAt) manual.add(grant.userId);
    else unconfirmed += 1;
  }
  const count = stripe.size + manual.size;
  return {
    count,
    stripe: stripe.size,
    manual: manual.size,
    goal: CUSTOMER_GOAL,
    reached: count >= CUSTOMER_GOAL,
    unconfirmed,
  };
}
