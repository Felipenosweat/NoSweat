import type { CSSProperties } from "react";

// Faixa de texto gigante em movimento com os ofícios (duas linhas em sentidos opostos).
// Decorativa: a lista também está em texto para leitores de tela (sr-only).
// Com o motor da landing, as linhas inclinam conforme a velocidade da rolagem (data-l-skew).

const TRADES = [
  "Plumbers",
  "House cleaners",
  "Hair salons",
  "Restaurants",
  "Landscapers",
  "Roofers",
  "Movers",
  "Auto shops",
  "Barbers",
  "Painters",
];

function Row({ reverse, outline }: { reverse?: boolean; outline?: boolean }) {
  const items = reverse ? [...TRADES].reverse() : TRADES;
  return (
    <div data-l-skew className="flex w-max">
      <div
        className={`flex w-max ${reverse ? "l-marquee-rev" : "l-marquee"}`}
        style={{ "--speed": reverse ? "55s" : "45s" } as CSSProperties}
      >
        {[0, 1].map((copy) => (
          <p
            key={copy}
            className={`l-display flex shrink-0 items-center text-[clamp(3rem,8vw,7.5rem)] leading-none whitespace-nowrap ${
              outline ? "l-outline" : "text-white"
            }`}
          >
            {items.map((trade) => (
              <span key={trade} className="flex items-center">
                <span className="px-6 lg:px-10">{trade}</span>
                <span className="l-gradient-text text-[0.5em]">✦</span>
              </span>
            ))}
          </p>
        ))}
      </div>
    </div>
  );
}

export function TradesBand() {
  return (
    <section
      aria-label="Who it’s for"
      className="relative overflow-hidden border-y border-white/10 py-10 lg:py-14"
    >
      <p className="sr-only">Made for {TRADES.join(", ")} and other local businesses.</p>
      <div aria-hidden="true" className="flex flex-col gap-2 lg:gap-4">
        <Row />
        <Row reverse outline />
      </div>
    </section>
  );
}
