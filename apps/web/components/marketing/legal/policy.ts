// Textos de cancelamento e reembolso, num lugar só: o FAQ (landing e /pricing), os Termos, a
// página /refund e o diálogo de publicar usam exatamente as mesmas frases (auditoria J11/J12).
// Decisão do fundador (nov/2026): garantia de 30 dias com devolução total do PRIMEIRO pagamento
// de qualquer plano; renovações não são devolvidas, mas dá para cancelar a qualquer hora.
// O cancelamento descreve o que o código faz hoje: checkout online (Stripe) renova sozinho e
// cancela pelo portal ("Manage billing" em /billing), mantendo o plano até o fim do período pago;
// pagamento direto (acesso manual liberado pelo admin) não renova e acaba na data da conta.
// Quando o plano acaba, o site sai do ar (ownerHasLiveAccess); o rascunho continua na conta.
// TEXTO JURÍDICO: revisar com o fundador/advogado antes de mudar.

/** Dias da garantia de devolução do primeiro pagamento. */
export const REFUND_WINDOW_DAYS = 30;

/** Uma linha sobre a garantia (preços, diálogo de publicar). */
export const GUARANTEE_LINE = `${REFUND_WINDOW_DAYS}-day money-back guarantee on your first payment.`;

/** Regras de cancelamento: as MESMAS palavras no FAQ e nos Termos (#renewal). */
export const CANCELLATION_TERMS =
  "There’s no contract. Plans bought through online checkout renew automatically until you cancel; you can cancel anytime in your account, in a few clicks, and you keep your plan until the end of the month or year you already paid for. If you pay us directly, your plan does not renew automatically; it ends on the date shown in your account unless you renew. When a plan ends, your website goes offline; your draft stays in your account.";

/** Resumo da garantia: as MESMAS palavras no FAQ, nos Termos (#refunds) e na /refund. */
export const REFUND_TERMS = `Your first payment for any plan comes with a ${REFUND_WINDOW_DAYS}-day money-back guarantee: if you ask within ${REFUND_WINDOW_DAYS} days of that payment, we refund it in full and your website is unpublished. Renewals after your first payment are not refunded, but you can cancel anytime so you aren’t charged again.`;
