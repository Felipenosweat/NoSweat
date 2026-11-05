import Link from "next/link";

// Exemplos (#looks): uma lista numerada só de texto, cada linha abre o site de exemplo de verdade
// (/examples/<slug>). Negócios fictícios, avisado no texto. Sem imagens.

const SITES = [
  { slug: "still-water-spa", name: "Still Water Spa", kind: "Day spa", place: "Scottsdale" },
  { slug: "smoke-and-rail-bbq", name: "Smoke & Rail BBQ", kind: "Barbecue", place: "Kansas City" },
  { slug: "mercer-law", name: "Mercer Law", kind: "Family law", place: "Columbus" },
  {
    slug: "greenline-landscaping",
    name: "Greenline Landscaping",
    kind: "Landscaping",
    place: "Charlotte",
  },
  { slug: "fade-and-co-barbers", name: "Fade & Co. Barbers", kind: "Barbershop", place: "Chicago" },
  { slug: "sunrise-bakery", name: "Sunrise Bakery", kind: "Bakery", place: "Sacramento" },
  { slug: "iron-lotus-tattoo", name: "Iron Lotus Tattoo", kind: "Tattoo studio", place: "Denver" },
  {
    slug: "hollis-interiors",
    name: "Hollis Interiors",
    kind: "Interior design",
    place: "Nashville",
  },
  {
    slug: "north-loop-coffee",
    name: "North Loop Coffee",
    kind: "Coffee shop",
    place: "Minneapolis",
  },
  {
    slug: "bright-spark-electric",
    name: "Bright Spark Electric",
    kind: "Electrician",
    place: "Phoenix",
  },
];

export function Examples() {
  return (
    <section
      id="looks"
      aria-labelledby="looks-title"
      className="lp-tint border-y border-[var(--lp-line)] py-16 lg:py-24"
    >
      <div className="mx-auto w-full max-w-[1240px] px-5 sm:px-8">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:items-end">
          <h2
            id="looks-title"
            data-lp-rise
            className="lp-serif text-[clamp(2.4rem,5.5vw,5rem)] lg:col-span-8"
          >
            Open any of them <em>and scroll.</em>
          </h2>
          <p className="max-w-[40ch] text-lg leading-relaxed text-[#071b33]/70 lg:col-span-4">
            Made-up businesses, real No Sweat sites. Pick one to look around.
          </p>
        </div>
        <ul className="mt-10 border-b border-[var(--lp-line)] lg:mt-14">
          {SITES.map((site, index) => (
            <li key={site.slug} className="border-t border-[var(--lp-line)]">
              <Link
                href={`/examples/${site.slug}`}
                className="lp-row group flex min-h-16 items-baseline gap-4 rounded-sm py-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0066ff] sm:gap-8"
              >
                <span className="w-7 shrink-0 text-[13px] font-semibold tracking-[0.14em] text-[#071b33]/45">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="lp-row-name lp-serif min-w-0 flex-1 text-[clamp(1.6rem,3.4vw,2.75rem)] leading-none transition-colors duration-300">
                  {site.name}
                </span>
                <span className="hidden shrink-0 text-sm text-[#071b33]/60 sm:block">
                  {site.kind}, {site.place}
                </span>
                <span
                  aria-hidden="true"
                  className="shrink-0 text-xl text-[#0066ff] transition-transform duration-300 group-hover:translate-x-1"
                >
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
