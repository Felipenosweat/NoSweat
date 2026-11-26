import type { PaymentSettings, SiteSpec } from "@nosweat/schema";

// "Como os clientes pagam" mora em `business.payments` e só o dono muda (assistente de
// configuração): a IA nunca põe, troca nem tira (como o link de avaliações).

/** O spec com as formas de pagamento trocadas (`undefined` tira). Não muda o spec recebido. */
export function withPayments(spec: SiteSpec, payments: PaymentSettings | undefined): SiteSpec {
  const business = { ...spec.business };
  delete business.payments;
  if (payments && payments.methods.length > 0) business.payments = payments;
  return { ...spec, business };
}

/** `next` com as formas de pagamento de `previous` (ou sem elas, se `previous` for `null`). */
export function keepPayments(next: SiteSpec, previous: SiteSpec | null): SiteSpec {
  return withPayments(next, previous?.business.payments);
}
