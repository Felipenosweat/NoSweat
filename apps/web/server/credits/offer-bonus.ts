import { offerAt } from "../billing/plans";
import { addTopupCredits } from "./index";
import { getCreditStore } from "./store";

// Bônus da oferta do momento (Black Friday, Cyber Week...): créditos de IA extras, dados UMA vez
// por conta, no primeiro pagamento de um plano (Stripe ativo ou acesso manual com pagamento
// confirmado). Entram como créditos comprados (não vencem). Quem cancela e volta não ganha de novo.

export const OFFER_BONUS_KIND = "offer_bonus";

/** Desde quando procurar o bônus no livro-caixa (todos os tempos). */
const BEGINNING = "1970-01-01T00:00:00.000Z";

/**
 * Dá o bônus da oferta de `now` se a conta ainda não ganhou nenhum. Devolve os créditos dados
 * (0 se já tinha). Não lança: falha só vai para o log (o pagamento nunca depende disto).
 * Corrida (dois eventos do Stripe juntos): o índice único da migration 0036 barra o segundo.
 */
export async function grantOfferBonus(userId: string, now: Date = new Date()): Promise<number> {
  try {
    const entries = await getCreditStore().listSince(userId, BEGINNING);
    if (entries.some((entry) => entry.meta.kind === OFFER_BONUS_KIND)) return 0;
    const offer = offerAt(now);
    if (offer.bonusCredits <= 0) return 0;
    await addTopupCredits(userId, offer.bonusCredits, {
      kind: OFFER_BONUS_KIND,
      offer: offer.name,
    });
    return offer.bonusCredits;
  } catch (error) {
    console.error("[credits] could not grant the offer bonus", error);
    return 0;
  }
}
