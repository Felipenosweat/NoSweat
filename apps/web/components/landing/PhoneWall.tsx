import Image from "next/image";

// Parede de celulares logo abaixo do hero (pedido do fundador: "mais imagens do que texto"):
// duas fileiras de sites de exemplo de verdade (capturas do molde Signature no celular,
// negócios fictícios) correndo devagar em sentidos opostos, com uma frase curta e o que vem em
// todo site. As fileiras são enfeite (aria-hidden); a galeria #looks logo abaixo tem os links.

const SLUGS = [
  "still-water-spa",
  "smoke-and-rail-bbq",
  "mercer-law",
  "greenline-landscaping",
  "fade-and-co-barbers",
  "sunrise-bakery",
  "iron-lotus-tattoo",
  "hollis-interiors",
  "north-loop-coffee",
  "bright-spark-electric",
  "brick-oven-pizza",
];

const INCLUDED = ["Call button", "Contact form", "Your hours", "Set up for Google"];

function Row({ slugs, reverse = false }: { slugs: string[]; reverse?: boolean }) {
  return (
    <div className="overflow-hidden">
      {/* Duas cópias lado a lado: a fileira anda metade da largura e recomeça sem emenda. */}
      <div className={`lp-drift flex w-max gap-4 ${reverse ? "lp-drift-reverse" : ""}`}>
        {[0, 1].map((copy) =>
          slugs.map((slug) => (
            <div
              key={`${copy}-${slug}`}
              className="w-[150px] shrink-0 rounded-[1.6rem] bg-[#0b1220] p-1 sm:w-[190px]"
            >
              <Image
                src={`/landing/signature/${slug}-m.webp`}
                alt=""
                width={640}
                height={1385}
                sizes="190px"
                className="block aspect-[9/16] h-auto w-full rounded-[1.35rem] object-cover object-top"
              />
            </div>
          )),
        )}
      </div>
    </div>
  );
}

export function PhoneWall() {
  return (
    <section aria-labelledby="wall-title" className="lp-paper overflow-hidden py-14 lg:py-20">
      <div className="mx-auto mb-10 flex w-full max-w-[1240px] flex-col gap-5 px-5 sm:px-8 lg:mb-12 lg:flex-row lg:items-end lg:justify-between">
        <h2
          id="wall-title"
          className="lp-serif text-[clamp(2.2rem,4.6vw,4rem)] leading-[0.95] text-[#071b33]"
        >
          Made for the <em>phone</em> in your customer’s hand
        </h2>
        <ul className="flex flex-wrap gap-2">
          {INCLUDED.map((item) => (
            <li
              key={item}
              className="rounded-full border border-[var(--lp-line)] px-3.5 py-1.5 text-[13px] font-medium text-[#071b33]/80"
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
      <div aria-hidden="true" className="flex flex-col gap-4">
        <Row slugs={SLUGS} />
        <Row slugs={[...SLUGS].reverse()} reverse />
      </div>
      <p className="mx-auto mt-6 w-full max-w-[1240px] px-5 text-[13px] text-[#071b33]/55 sm:px-8">
        Example sites made with No Sweat. The businesses are made up.
      </p>
    </section>
  );
}
