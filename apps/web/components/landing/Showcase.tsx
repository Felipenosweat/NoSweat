import Image from "next/image";
import Link from "next/link";

// Galeria de sites de exemplo (#looks): capturas reais do molde Signature (public/landing/
// signature, tiradas das páginas /examples/[slug]). Negócios fictícios, avisado no texto.
// No computador a galeria anda de lado presa na tela (LandingMotion); no celular o dedo rola.

const SITES = [
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

export function Showcase() {
  return (
    <section
      id="looks"
      aria-labelledby="looks-title"
      data-lp-hscroll
      className="lp-hscroll lp-night relative scroll-mt-0 border-t border-white/10"
    >
      <div className="lp-hscroll-sticky py-16 lg:py-0">
        <div className="mx-auto mb-8 grid w-full max-w-[1240px] grid-cols-1 gap-6 px-5 sm:px-8 lg:mb-10 lg:grid-cols-12 lg:items-end">
          <h2
            id="looks-title"
            className="lp-serif text-[clamp(2.4rem,5vw,4.5rem)] leading-[0.95] text-white lg:col-span-7"
          >
            Open any of them <em>and scroll.</em>
          </h2>
          <p className="max-w-[42ch] text-base leading-relaxed text-white/65 lg:col-span-4 lg:col-start-9">
            These businesses are made up. The sites are real No Sweat sites, built from the same
            pieces yours will use.
          </p>
        </div>

        <ul className="lp-rail">
          {SITES.map((site, index) => (
            <li key={site.slug} className="w-[78vw] sm:w-[62vw] lg:w-[46vw] lg:max-w-[720px]">
              <Link
                href={`/examples/${site.slug}`}
                className="group block rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              >
                <span className="lp-zoom block overflow-hidden rounded-lg ring-1 ring-white/10">
                  <Image
                    src={`/landing/signature/${site.slug}-d.webp`}
                    alt=""
                    width={1600}
                    height={1000}
                    sizes="(min-width: 1024px) 46vw, 78vw"
                    className="hidden h-auto w-full sm:block"
                  />
                  <Image
                    src={`/landing/signature/${site.slug}-m.webp`}
                    alt=""
                    width={640}
                    height={1385}
                    sizes="78vw"
                    className="block aspect-[4/5] h-auto w-full object-cover object-top sm:hidden"
                  />
                </span>
                <span className="mt-4 flex items-baseline justify-between gap-4">
                  <span className="lp-serif text-2xl text-white lg:text-[1.75rem]">
                    <span className="mr-3 align-middle font-sans text-[12px] tracking-[0.14em] text-white/45">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {site.name}
                  </span>
                  <span className="shrink-0 text-sm text-white/55 transition-colors group-hover:text-white">
                    {site.kind}, {site.place}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
