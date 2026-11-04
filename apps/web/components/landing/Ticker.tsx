// Faixa que corre entre o hero e a parede de celulares: os ramos que a No Sweat já atende com
// site de exemplo. É enfeite (aria-hidden); só nomes de ramos, nenhum número ou cliente inventado.

const TRADES = [
  "Barbershops",
  "Law firms",
  "Landscapers",
  "Bakeries",
  "Electricians",
  "Day spas",
  "Tattoo studios",
  "Coffee shops",
  "Interior designers",
  "BBQ joints",
  "Pizzerias",
];

export function Ticker() {
  return (
    <div
      aria-hidden="true"
      className="lp-night overflow-hidden border-y border-white/10 py-5 select-none lg:py-7"
    >
      {/* Duas cópias lado a lado: anda metade da largura e recomeça sem emenda. */}
      <div className="lp-ticker flex w-max items-center">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex items-center">
            {TRADES.map((trade, index) => (
              <span key={`${copy}-${trade}`} className="flex items-center">
                <span
                  className={`lp-serif px-6 text-[clamp(1.75rem,3.6vw,3.25rem)] whitespace-nowrap lg:px-9 ${
                    index % 2 ? "lp-outline" : "text-white"
                  }`}
                >
                  {trade}
                </span>
                <span className="size-2 rounded-full bg-[var(--lp-accent)]" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
