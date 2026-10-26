import { AureliaMotion } from "@/components/demos/aurelia/AureliaMotion";
import { ESTATE, FACTS } from "@/components/demos/aurelia/content";
import { Experiences } from "@/components/demos/aurelia/Experiences";
import { Gallery } from "@/components/demos/aurelia/Gallery";
import { Nav } from "@/components/demos/aurelia/Nav";
import { Opening } from "@/components/demos/aurelia/Opening";
import { PHOTOS } from "@/components/demos/aurelia/photos";
import { Reserve } from "@/components/demos/aurelia/Reserve";
import { Suites } from "@/components/demos/aurelia/Suites";
import { Credit, Crest, Photo } from "@/components/demos/aurelia/ui";

// Aurelia Royal Estate (demonstração, hotel fictício). Direção escolhida: "Gilded Nocturne"
// (o palácio à noite: preto quente, ouro antigo, clarete) com capítulos em papel marfim no
// jeito "livro de registro" (a segunda direção estudada), para dar ritmo noite/dia.
// Ordem: abertura com portas → salão (hero) → I. A propriedade (editorial) → II. Suítes
// (arcos) → III. Experiências (foto presa que troca) → IV. Galeria (enfilada lateral) →
// V. Reserva (três passos, demonstração) → rodapé com créditos. Ver docs/design/aurelia.md.

const wrap = "mx-auto w-full max-w-[1400px] px-5 sm:px-10";

function Chapter({
  numeral,
  title,
  tone = "dark",
}: {
  numeral: string;
  title: string;
  tone?: "dark" | "light";
}) {
  return (
    <p
      className={`a-caps flex items-center gap-4 text-[11px] ${tone === "dark" ? "text-[var(--a-gold)]" : "text-[var(--a-claret)]"}`}
    >
      <span className="a-display text-base normal-case italic">{numeral}</span>
      <span data-a-line className="h-px w-12 bg-current" aria-hidden="true" />
      {title}
    </p>
  );
}

export default function AureliaPage() {
  return (
    <>
      <Opening />
      <Nav />
      <main id="main">
        {/* SALÃO — o hero */}
        <section
          id="top"
          data-a-hero
          aria-labelledby="a-title"
          className="relative isolate flex min-h-svh flex-col justify-end overflow-hidden bg-[var(--a-night)] text-[var(--a-ivory)]"
        >
          <div className="a-hero-zoom absolute inset-0 -z-10">
            <Photo photo={PHOTOS.hero} sizes="100vw" priority className="size-full object-cover" />
            <div className="a-hero-veil absolute inset-0" />
          </div>
          <div data-a-hero-title className={`${wrap} pb-10 sm:pb-14`}>
            <p className="a-caps a-hero-in text-[11px] text-[var(--a-gold-bright)]">
              A royal summer palace on {ESTATE.place} · Since {ESTATE.founded}
            </p>
            <h1
              id="a-title"
              className="a-display a-hero-title mt-4 text-[clamp(5.4rem,22vw,19rem)] leading-[0.78] tracking-[-0.03em] italic"
            >
              Aurelia
            </h1>
            <div className="mt-6 flex flex-col gap-6 border-t border-[var(--a-gold)]/40 pt-6 sm:flex-row sm:items-end sm:justify-between">
              <p className="a-caps a-hero-in text-[12px] tracking-[0.4em] text-[var(--a-ivory)]">
                Royal Estate
              </p>
              <p className="a-hero-in max-w-[38ch] text-[15px] leading-relaxed text-[var(--a-ivory)]/80 sm:text-right">
                Forty-eight suites in the palace the queens of Valcora built for the summer.
              </p>
            </div>
          </div>
          <a
            href="#estate"
            className="a-caps a-focus a-hero-in absolute right-5 bottom-28 hidden items-center gap-3 text-[10px] text-[var(--a-ivory)]/70 sm:right-10 lg:flex"
            style={{ writingMode: "vertical-rl" }}
          >
            Enter the estate
            <span aria-hidden="true" className="a-scroll-line h-14 w-px bg-[var(--a-gold)]" />
          </a>
        </section>

        {/* I. A PROPRIEDADE — editorial em marfim */}
        <section
          id="estate"
          aria-labelledby="estate-title"
          className="a-ivory scroll-mt-20 py-24 lg:py-40"
        >
          <div className={`${wrap} grid gap-14 lg:grid-cols-12 lg:gap-10`}>
            <div className="lg:col-span-7">
              <Chapter numeral="I" title="The Estate" tone="light" />
              <h2
                id="estate-title"
                data-a-rise
                className="a-display mt-8 text-[clamp(2.8rem,6.4vw,6.6rem)] leading-[0.92] tracking-[-0.02em] text-[var(--a-ink)]"
              >
                A palace kept <em className="text-[var(--a-claret)]">for the summer</em>, opened to
                a few guests.
              </h2>
              <div
                data-a-rise
                className="a-columns mt-12 max-w-[64rem] text-[17px] leading-[1.75] text-[var(--a-ink)]/80"
              >
                <p className="a-dropcap">
                  The queens of Valcora finished the palace in {ESTATE.founded} and came every June,
                  when the city grew hot and the lake turned the colour of slate. They brought their
                  libraries, their cooks and their musicians, and they left behind rooms that were
                  made for long evenings: high ceilings, tall shutters, and gilding that catches
                  candlelight.
                </p>
                <p className="mt-6">
                  Today the estate keeps forty-eight suites and apartments, a kitchen that cooks
                  from its own gardens, and a ballroom that still opens on Saturdays. Nothing has
                  been hurried. The restoration took eleven years, room by room, with the same
                  plasterers and gilders throughout.
                </p>
              </div>
              <dl className="mt-14 grid grid-cols-3 gap-6 border-t border-[var(--a-ink)]/15 pt-8">
                {FACTS.map((fact) => (
                  <div key={fact.label} data-a-rise>
                    <dt className="sr-only">{fact.label}</dt>
                    <dd>
                      <span className="a-display block text-[clamp(2.4rem,4.6vw,4.4rem)] leading-none text-[var(--a-ink)]">
                        {fact.value}
                      </span>
                      <span className="a-caps mt-3 block text-[10px] text-[var(--a-ink)]/75">
                        {fact.label}
                      </span>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
            <figure className="relative mx-auto w-full max-w-[520px] lg:col-span-5 lg:max-w-none lg:pt-24">
              <div data-a-arch className="overflow-hidden rounded-t-full">
                <Photo
                  photo={PHOTOS.stair}
                  sizes="(min-width: 1024px) 38vw, 100vw"
                  ratio={0.72}
                  className="aspect-[0.72] w-full object-cover"
                />
              </div>
              <div
                data-a-arch
                className="absolute -bottom-10 -left-6 hidden w-[42%] overflow-hidden rounded-t-full border-[6px] border-[var(--a-ivory-bg)] lg:block"
              >
                <Photo
                  photo={PHOTOS.lion}
                  sizes="16vw"
                  ratio={0.75}
                  className="aspect-[0.75] w-full object-cover"
                />
              </div>
              <figcaption className="mt-4 text-right text-[12px] text-[var(--a-ink)]/75 lg:mt-16">
                The grand staircase, east wing · <Credit photo={PHOTOS.stair} />
              </figcaption>
            </figure>
          </div>
        </section>

        {/* II. SUÍTES — arcos à noite */}
        <section
          id="suites"
          aria-labelledby="suites-title"
          className="scroll-mt-20 bg-[var(--a-night)] py-24 text-[var(--a-ivory)] lg:py-36"
        >
          <div className={wrap}>
            <div className="mb-12 grid gap-6 lg:mb-16 lg:grid-cols-12 lg:items-end">
              <div className="lg:col-span-7">
                <Chapter numeral="II" title="Suites & Apartments" />
                <h2
                  id="suites-title"
                  data-a-rise
                  className="a-display mt-6 text-[clamp(2.8rem,6vw,6rem)] leading-[0.92] tracking-[-0.02em]"
                >
                  Rooms with <em className="text-[var(--a-gold-bright)]">a history</em>
                </h2>
              </div>
              <p className="max-w-[40ch] text-[15px] leading-relaxed text-[var(--a-ivory)]/70 lg:col-span-4 lg:col-start-9">
                Four ways to stay, from the lake rooms of the summer wing to the private salons
                above the ballroom. Every suite is serviced twice a day.
              </p>
            </div>
            <Suites />
          </div>
        </section>

        {/* III. EXPERIÊNCIAS — foto presa que troca */}
        <section
          id="experiences"
          aria-labelledby="exp-title"
          className="a-parchment scroll-mt-20 py-24 lg:py-36"
        >
          <div className={wrap}>
            <div className="mb-10 lg:mb-4">
              <Chapter numeral="III" title="Experiences" tone="light" />
              <h2
                id="exp-title"
                data-a-rise
                className="a-display mt-6 text-[clamp(2.8rem,6vw,6rem)] leading-[0.92] tracking-[-0.02em] text-[var(--a-ink)]"
              >
                The days, <em className="text-[var(--a-claret)]">slowly</em>
              </h2>
            </div>
            <Experiences />
          </div>
        </section>

        {/* IV. GALERIA — enfilada */}
        <section
          id="gallery"
          aria-labelledby="gallery-title"
          data-a-enfilade
          className="a-enfilade scroll-mt-20 bg-[var(--a-night)] text-[var(--a-ivory)]"
        >
          <div className="a-enfilade-sticky py-24 lg:py-0">
            <div
              className={`${wrap} mb-10 flex flex-col gap-6 lg:mb-12 lg:flex-row lg:items-end lg:justify-between`}
            >
              <div>
                <Chapter numeral="IV" title="The Enfilade" />
                <h2
                  id="gallery-title"
                  className="a-display mt-6 text-[clamp(2.6rem,5vw,5rem)] leading-[0.92] tracking-[-0.02em]"
                >
                  Room after <em className="text-[var(--a-gold-bright)]">room</em>
                </h2>
              </div>
              <div className="flex items-center gap-4 lg:w-[30%]">
                <span className="a-caps text-[10px] text-[var(--a-ivory)]/60">Nine views</span>
                <span className="relative h-px flex-1 bg-[var(--a-ivory)]/20">
                  <span
                    data-a-progress
                    className="absolute inset-0 origin-left scale-x-0 bg-[var(--a-gold)]"
                  />
                </span>
              </div>
            </div>
            <div className="a-enfilade-rail overflow-x-auto px-5 [scrollbar-width:none] sm:px-10 lg:px-[max(2.5rem,calc((100vw-1400px)/2+2.5rem))]">
              <Gallery />
            </div>
          </div>
        </section>

        {/* V. RESERVA — pedido em três passos (demonstração) */}
        <section
          id="reserve"
          aria-labelledby="reserve-title"
          className="a-ivory scroll-mt-20 py-24 lg:py-36"
        >
          <div className={`${wrap} grid gap-14 lg:grid-cols-12 lg:gap-10`}>
            <div className="lg:col-span-5">
              <Chapter numeral="V" title="Reservations" tone="light" />
              <h2
                id="reserve-title"
                data-a-rise
                className="a-display mt-6 text-[clamp(2.8rem,5.6vw,5.6rem)] leading-[0.92] tracking-[-0.02em] text-[var(--a-ink)]"
              >
                Request <em className="text-[var(--a-claret)]">a stay</em>
              </h2>
              <p className="mt-6 max-w-[40ch] text-[16px] leading-relaxed text-[var(--a-ink)]/70">
                Tell us when you would like to come. The concierge answers every request in person,
                usually within the day.
              </p>
              <div data-a-arch className="mt-12 hidden overflow-hidden rounded-t-full lg:block">
                <Photo
                  photo={PHOTOS.feast}
                  sizes="36vw"
                  ratio={0.95}
                  className="aspect-[0.95] w-full object-cover"
                />
              </div>
            </div>
            <div className="lg:col-span-6 lg:col-start-7 lg:pt-20">
              <Reserve />
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[var(--a-night)] pt-20 pb-10 text-[var(--a-ivory)]">
        <div className={`${wrap} grid gap-12 lg:grid-cols-12`}>
          <div className="lg:col-span-5">
            <Crest className="h-20 w-16 text-[var(--a-gold)]" />
            <p className="a-display mt-6 text-4xl italic">Aurelia Royal Estate</p>
            <p className="mt-4 text-[14px] leading-relaxed text-[var(--a-ivory)]/65">
              {ESTATE.address}
              <br />
              <a href={`mailto:${ESTATE.email}`} className="a-link">
                {ESTATE.email}
              </a>
            </p>
          </div>
          <div className="lg:col-span-6 lg:col-start-7">
            <p className="a-caps text-[10px] text-[var(--a-gold)]">About this site</p>
            <p className="mt-3 text-[14px] leading-relaxed text-[var(--a-ivory)]/70">
              Aurelia Royal Estate, Lake Valcora and everything about them are fictional. This is a
              design demonstration by{" "}
              <a href="https://www.nosweatfd.com/" className="a-link">
                No Sweat
              </a>
              . The reservation form does not send or store anything.
            </p>
            <p className="a-caps mt-8 text-[10px] text-[var(--a-gold)]">Photography</p>
            <ul className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1 text-[12px] text-[var(--a-ivory)]/60 sm:grid-cols-2">
              {Object.values(PHOTOS).map((photo) => (
                <li key={photo.id}>
                  <Credit photo={photo} />
                </li>
              ))}
            </ul>
          </div>
        </div>
        {/* Palavra-fantasma decorativa: vem do CSS (content) para não ser lida como texto. */}
        <p
          className="a-ghost a-display mt-20 overflow-hidden text-center text-[18vw] leading-[0.8] text-[var(--a-ivory)]/[0.06] italic select-none"
          aria-hidden="true"
          data-word="Aurelia"
        />
      </footer>
      <AureliaMotion />
    </>
  );
}
