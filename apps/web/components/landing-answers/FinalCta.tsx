import Link from "next/link";
import { fromPriceLine } from "./facts";
import { primaryButton, shell } from "./ui";

// O único bloco escuro da página: um pedido só, "Start my website" → /create. O fio ciano só
// aparece aqui (ciano só sobre o ink). `data-hide-mobile-cta`: a barra fixa do celular some
// enquanto este botão está na tela.

export function FinalCta() {
  return (
    <section aria-labelledby="start-title" data-hide-mobile-cta className="bg-ink">
      <div className={`${shell} py-20 lg:grid lg:grid-cols-12 lg:gap-x-10 lg:py-32`}>
        <div className="lg:col-span-9">
          <span aria-hidden="true" className="block h-px w-10 bg-accent" />
          <h2
            id="start-title"
            className="mt-6 max-w-[16ch] font-display text-[2.5rem] leading-[1.02] font-bold tracking-[-0.04em] text-balance text-white sm:text-[3.5rem] lg:text-[4.5rem]"
          >
            Tell us what you do and where. We’ll build the rest.
          </h2>
        </div>
        <div className="mt-10 lg:col-span-3 lg:mt-0 lg:self-end">
          <Link href="/create" className={`w-full sm:w-auto lg:w-full ${primaryButton}`}>
            Start my website
          </Link>
          <p className="mt-4 max-w-[34ch] text-[15px] leading-relaxed text-slate-300">
            {fromPriceLine}
          </p>
        </div>
      </div>
    </section>
  );
}
