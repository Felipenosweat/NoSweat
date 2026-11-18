import { container, h1Class, leadClass } from "@/components/marketing/styles";
import { HeroPhone } from "./HeroPhone";
import { HeroStepper } from "./HeroStepper";
import { PriceLine, PriceReceipt } from "./PriceReceipt";

// Topo da landing: à esquerda (7 colunas) o título, a frase, as quatro perguntas e o preço como
// recibo; à direita (5 colunas) o celular com um site de exemplo que acompanha a 1ª resposta. No
// celular e no tablet: título, frase, perguntas, a linha do preço e o celular centralizado abaixo.
// Sem animação de entrada: o h1 é o maior elemento do primeiro quadro e aparece parado.

export function Hero({ fromPrice }: { fromPrice?: string }) {
  return (
    <section
      id="start"
      aria-labelledby="hero-title"
      data-hide-mobile-cta
      className="scroll-mt-16 bg-white"
    >
      <div
        className={`${container} grid grid-cols-1 gap-y-12 pt-6 pb-12 lg:grid-cols-12 lg:gap-x-8 lg:pt-16 lg:pb-24`}
      >
        <div className="lg:col-span-7">
          <h1 id="hero-title" className={h1Class}>
            A website that books the job.
          </h1>
          <p className={`mt-4 lg:mt-6 ${leadClass}`}>
            And the office behind it: every request, estimate, invoice and Google review request in
            one place. Answer four questions. It’s free until your site goes live.
          </p>
          <div className="mt-8 lg:mt-10">
            <HeroStepper />
          </div>
          {fromPrice && (
            <>
              <PriceLine fromPrice={fromPrice} className="mt-2 lg:hidden" />
              <PriceReceipt fromPrice={fromPrice} className="mt-6 hidden lg:block" />
            </>
          )}
        </div>
        <div className="flex justify-center lg:col-span-5 lg:justify-end lg:pt-2">
          <HeroPhone />
        </div>
      </div>
    </section>
  );
}
