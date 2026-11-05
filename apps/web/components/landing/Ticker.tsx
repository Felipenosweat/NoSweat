// Faixa que corre entre o hero e a parede de celulares: os sites de exemplo (negócios fictícios,
// avisado na galeria). É enfeite (aria-hidden); nenhum cliente real, número ou logo inventado.

const TRADES = [
  "Still Water Spa",
  "Smoke & Rail BBQ",
  "Mercer Law",
  "Greenline Landscaping",
  "Fade & Co. Barbers",
  "Sunrise Bakery",
  "Iron Lotus Tattoo",
  "Hollis Interiors",
  "North Loop Coffee",
  "Bright Spark Electric",
  "Brick Oven Pizza Co.",
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
                  className={`lp-serif px-6 text-[clamp(2rem,4vw,3.75rem)] whitespace-nowrap lg:px-9 ${
                    index % 2 ? "italic text-white/60" : "text-white"
                  }`}
                >
                  {trade}
                </span>
                <span className="size-1.5 rotate-45 bg-white/40" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
