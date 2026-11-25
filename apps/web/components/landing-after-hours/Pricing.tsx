import { checkoutReady } from "@/server/billing";
import { currentOffer, promoActive } from "@/server/billing/plans";
import { planCards, PRICING_INTRO, PRICING_TITLE, yearlyNote } from "./content";
import { PricingTable } from "./PricingTable";

// 5. "Quanto custa?" Três planos em colunas no branco, separados por linhas de 1px (sem cartões
// com sombra); o Starter tem o contorno ink de 2px (raio de 2px). Preço riscado só com oferta valendo
// (promoActive) e preço normal maior que o mensal, com o nome da oferta do momento.
// Sem promessa de reembolso: a política não existe no main.

export function Pricing() {
  const promo = promoActive();
  return (
    <section
      id="pricing"
      aria-labelledby="pricing-title"
      className="ah-grid scroll-mt-16 border-t border-slate-200 bg-white py-24 md:py-32 lg:py-40"
    >
      <div className="col-[2/14] lg:col-[2/10]">
        <h2 id="pricing-title" className="ah-display ah-h2 text-ink">
          {PRICING_TITLE}
        </h2>
        <p className="mt-6 max-w-[52ch] text-[17px] leading-[1.6] text-pretty text-slate-600 md:text-[18px]">
          {PRICING_INTRO}
        </p>
      </div>
      <div className="col-[2/14] mt-12 md:mt-16">
        <PricingTable
          plans={planCards(promo)}
          checkout={checkoutReady()}
          offerName={currentOffer()}
          yearlyNote={yearlyNote()}
        />
      </div>
    </section>
  );
}
