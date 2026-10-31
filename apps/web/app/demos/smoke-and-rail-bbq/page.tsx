import { NoSweatBadge } from "@nosweat/templates";
import { CateringForm } from "@/components/demos/smoke-and-rail/CateringForm";
import {
  BUSINESS,
  FAQ,
  OFFERS,
  PEOPLE,
  QUOTES,
  TIMELINE,
} from "@/components/demos/smoke-and-rail/content";
import { Header } from "@/components/demos/smoke-and-rail/Header";
import { MenuBoard } from "@/components/demos/smoke-and-rail/MenuBoard";
import { PHOTOS } from "@/components/demos/smoke-and-rail/photos";
import { SmokeMotion } from "@/components/demos/smoke-and-rail/SmokeMotion";
import { Stage } from "@/components/demos/smoke-and-rail/Stage";
import { Timetable } from "@/components/demos/smoke-and-rail/Timetable";
import { Credit, Photo, RailMark } from "@/components/demos/smoke-and-rail/ui";

// Smoke & Rail BBQ (demonstração, negócio fictício de Kansas City). Direção escolhida:
// "Fourteen Hours" (cinematic-scrollytelling): a primeira dobra é um palco preso onde a
// rolagem é o relógio de um brisket (00 → 14 h) e o nome do lugar (o pátio de trens ao lado)
// vira o sistema: placa de partidas no cardápio, quadro de horários da semana, linha de trilho
// como progresso e linha do tempo. Carvão + uma brasa. Ver docs/design/demos/smoke-and-rail-bbq.md.
// Ordem: palco (herói + 4 cenas) → cardápio → onde achar (hoje) → o pátio (história) →
// catering e o truck (pedido demo) → perguntas → rodapé com créditos → selo No Sweat.

function SectionLabel({ index, children }: { index: string; children: string }) {
  return (
    <p className="sr-label flex items-center gap-4 text-[12px] text-[var(--sr-ember)]">
      <span className="tabular-nums">{index}</span>
      <span data-sr-draw className="h-px w-14 bg-current" aria-hidden="true" />
      {children}
    </p>
  );
}

export default function SmokeAndRailPage() {
  return (
    <>
      <a href="#menu" className="sr-skip sr-focus">
        Skip to the menu
      </a>
      <Header />
      <main id="main">
        <Stage />

        {/* 01. CARDÁPIO — placa de partidas */}
        <section
          id="menu"
          aria-labelledby="menu-title"
          className="sr-section scroll-mt-16 bg-[var(--sr-coal)] pt-24 pb-24 lg:pt-36 lg:pb-32"
        >
          <div className="sr-wrap">
            <div className="mb-12 grid gap-6 lg:mb-16 lg:grid-cols-12 lg:items-end">
              <div className="lg:col-span-7">
                <SectionLabel index="01">Thursday to Saturday at the pit</SectionLabel>
                <h2
                  id="menu-title"
                  data-sr-rise
                  className="sr-display mt-6 text-[clamp(4.2rem,12vw,11rem)] leading-[0.8]"
                >
                  Menu
                </h2>
              </div>
              <p className="max-w-[42ch] text-[17px] leading-[1.6] text-[var(--sr-smoke)]/85 lg:col-span-4 lg:col-start-9">
                Prices at the pit, cut to order. We stay open until we sell out, so if you are
                coming later in the day, preorder.
              </p>
            </div>
            <MenuBoard />
          </div>
        </section>

        {/* 02. ONDE ACHAR — quadro da semana sobre o pátio à noite */}
        <section
          id="find"
          aria-labelledby="find-title"
          className="sr-section relative isolate scroll-mt-16 overflow-hidden py-24 lg:py-36"
        >
          <div className="absolute inset-0 -z-10" aria-hidden="true">
            <Photo
              photo={PHOTOS.night}
              sizes="100vw"
              alt=""
              className="size-full object-cover opacity-45"
            />
            <div className="sr-veil-find absolute inset-0" />
          </div>
          <div className="sr-wrap grid gap-14 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-7">
              <SectionLabel index="02">Where to find us</SectionLabel>
              <h2
                id="find-title"
                data-sr-rise
                className="sr-display mt-6 max-w-[12ch] text-[clamp(3.2rem,7vw,6.8rem)] leading-[0.84]"
              >
                The pit and the truck this week
              </h2>
              <div className="mt-10">
                <Timetable />
              </div>
            </div>
            <aside
              aria-labelledby="pit-title"
              className="sr-ticket self-start p-6 sm:p-8 lg:col-span-4 lg:col-start-9 lg:mt-40"
            >
              <p className="sr-label text-[11px] text-[var(--sr-ember)]">The pit</p>
              <h3
                id="pit-title"
                className="sr-display mt-3 text-[clamp(2.4rem,4vw,3.4rem)] leading-[0.9]"
              >
                {BUSINESS.street}
              </h3>
              <p className="mt-3 text-[16px] leading-[1.6] text-[var(--sr-smoke)]/85">
                {BUSINESS.city} · {BUSINESS.neighborhood}, next to the rail yard. Thursday to
                Saturday, 11 AM until we sell out. Preorder pickup is at the pit.
              </p>
              <div className="mt-6 grid gap-3">
                <a
                  href={BUSINESS.directions}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sr-btn sr-focus inline-flex h-12 items-center justify-center px-5 text-[13px]"
                >
                  Get directions
                </a>
                <a
                  href={BUSINESS.phoneHref}
                  className="sr-btn-ghost sr-focus inline-flex h-12 items-center justify-center px-5 text-[13px]"
                >
                  Call {BUSINESS.phone}
                </a>
              </div>
              <p className="mt-6 border-t border-[var(--sr-line)] pt-5 text-[14px] leading-[1.6] text-[var(--sr-ash)]">
                The truck parks at the Crossroads on Tuesdays and at River Market on Wednesdays, 11
                AM – 2 PM.
              </p>
            </aside>
          </div>
        </section>

        {/* 03. O PÁTIO — de onde vem o nome */}
        <section
          id="story"
          aria-labelledby="story-title"
          className="sr-section scroll-mt-16 bg-[var(--sr-coal)] pt-24 pb-24 lg:pt-36 lg:pb-36"
        >
          <div className="sr-wrap">
            <SectionLabel index="03">The rail yard</SectionLabel>
            <h2
              id="story-title"
              data-sr-rise
              className="sr-display mt-6 max-w-[14ch] text-[clamp(3.2rem,8vw,8rem)] leading-[0.82]"
            >
              Named for the rail yard next door
            </h2>
          </div>
          <figure className="mt-12 lg:mt-16">
            <div data-sr-wipe className="sr-wrap-bleed overflow-hidden">
              <Photo
                photo={PHOTOS.yard}
                sizes="100vw"
                ratio={2.4}
                className="aspect-[4/3] w-full object-cover sm:aspect-[2.4]"
              />
            </div>
            <figcaption className="sr-wrap mt-3 text-[13px] text-[var(--sr-ash)]">
              A freight yard at golden hour · <Credit photo={PHOTOS.yard} />
            </figcaption>
          </figure>
          <div className="sr-wrap mt-16 grid gap-14 lg:mt-24 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-5">
              <p data-sr-rise className="text-[clamp(1.25rem,1.8vw,1.5rem)] leading-[1.55]">
                Darnell Hayes started smoking meat in his backyard in 2011. He put the truck on the
                road in 2018 and opened the pit at 1500 Genessee St in 2022, next to the West
                Bottoms rail yard, which is where the name comes from.
              </p>
              <p className="mt-6 text-[17px] leading-[1.65] text-[var(--sr-smoke)]/80">
                His wife Keisha runs catering and the truck.
              </p>
              <dl className="mt-10 grid grid-cols-2 gap-6 border-t border-[var(--sr-line)] pt-6">
                {PEOPLE.map((person) => (
                  <div key={person.name}>
                    <dt className="sr-display text-[clamp(1.6rem,2.4vw,2rem)] leading-none">
                      {person.name}
                    </dt>
                    <dd className="sr-label mt-2 text-[11px] text-[var(--sr-ash)]">
                      {person.role}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="lg:col-span-6 lg:col-start-7">
              <h3 className="sr-label text-[12px] text-[var(--sr-ash)]">Three stops</h3>
              <div className="sr-line relative mt-8">
                <span className="sr-line-rail" aria-hidden="true">
                  <span data-sr-draw="y" className="sr-line-fill" />
                </span>
                <ol className="sr-line-stops">
                  {TIMELINE.map((stop) => (
                    <li key={stop.year} data-sr-rise className="sr-line-stop">
                      <span className="sr-display sr-line-year text-[clamp(3rem,5vw,4.6rem)] leading-none text-[var(--sr-ember)]">
                        {stop.year}
                      </span>
                      <span className="sr-display mt-2 block text-[26px] leading-none">
                        {stop.title}
                      </span>
                      <span className="mt-2 block max-w-[30ch] text-[15px] leading-[1.55] text-[var(--sr-ash)]">
                        {stop.body}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
              <figure className="mt-14 border-l-2 border-[var(--sr-ember)] pl-6">
                <blockquote className="sr-display text-[clamp(1.9rem,3vw,2.6rem)] leading-[1]">
                  “{QUOTES.ray.quote}”
                </blockquote>
                <figcaption className="sr-label mt-4 text-[11px] text-[var(--sr-ash)]">
                  {QUOTES.ray.author} · a customer
                </figcaption>
              </figure>
            </div>
          </div>
        </section>

        {/* 04. CATERING E O TRUCK — passagens + pedido demo */}
        <section
          id="catering"
          aria-labelledby="catering-title"
          className="sr-section scroll-mt-16 border-t border-[var(--sr-line)] bg-[var(--sr-char)] pt-24 pb-24 lg:pt-36 lg:pb-32"
        >
          <div className="sr-wrap">
            <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
              <div className="lg:col-span-7">
                <SectionLabel index="04">Catering &amp; the truck</SectionLabel>
                <h2
                  id="catering-title"
                  data-sr-rise
                  className="sr-display mt-6 max-w-[12ch] text-[clamp(3.2rem,7vw,6.8rem)] leading-[0.84]"
                >
                  Book catering or the truck
                </h2>
              </div>
              <p className="max-w-[40ch] text-[17px] leading-[1.6] text-[var(--sr-smoke)]/85 lg:col-span-4 lg:col-start-9">
                Keisha runs catering and the truck. Tell her the date and how many people.
              </p>
            </div>

            <ul className="sr-offers mt-14 lg:mt-20">
              {OFFERS.map((offer) => (
                <li key={offer.key} data-sr-rise className="sr-offer" data-offer={offer.key}>
                  <div>
                    <h3 className="sr-display text-[clamp(1.9rem,3vw,2.6rem)] leading-[0.95]">
                      {offer.name}
                    </h3>
                    <p className="mt-2 max-w-[36ch] text-[15px] leading-[1.55] text-[var(--sr-ash)]">
                      {offer.body}
                    </p>
                  </div>
                  <p className="sr-offer-price">
                    <span className="sr-display text-[clamp(3rem,5.4vw,5rem)] leading-none text-[var(--sr-ember)]">
                      {offer.price}
                    </span>
                    <span className="sr-label ml-2 text-[11px] text-[var(--sr-ash)]">
                      {offer.unit}
                    </span>
                  </p>
                  <ul className="sr-offer-terms sr-label text-[11px] text-[var(--sr-smoke)]">
                    {offer.terms.map((term) => (
                      <li key={term}>{term}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>

            <div className="mt-16 grid gap-12 lg:mt-24 lg:grid-cols-12 lg:gap-10">
              <div className="lg:col-span-5">
                <div data-sr-wipe className="overflow-hidden">
                  <Photo
                    photo={PHOTOS.tray}
                    sizes="(min-width: 1024px) 38vw, 100vw"
                    ratio={1.1}
                    className="aspect-[1.1] w-full object-cover"
                  />
                </div>
                <p className="mt-3 text-[13px] text-[var(--sr-ash)]">
                  Meats and sides on a tray · <Credit photo={PHOTOS.tray} />
                </p>
                <figure className="mt-10">
                  <blockquote className="sr-display text-[clamp(1.9rem,3vw,2.6rem)] leading-[1]">
                    “{QUOTES.wedding.quote}”
                  </blockquote>
                  <figcaption className="sr-label mt-4 text-[11px] text-[var(--sr-ash)]">
                    {QUOTES.wedding.author} · wedding catering
                  </figcaption>
                </figure>
              </div>
              <div className="lg:col-span-7">
                <CateringForm />
              </div>
            </div>
          </div>
        </section>

        {/* 05. PERGUNTAS */}
        <section
          id="questions"
          aria-labelledby="faq-title"
          className="sr-section scroll-mt-16 bg-[var(--sr-coal)] py-24 lg:py-32"
        >
          <div className="sr-wrap grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <SectionLabel index="05">Before you come</SectionLabel>
              <h2
                id="faq-title"
                data-sr-rise
                className="sr-display mt-6 text-[clamp(3.2rem,6vw,5.6rem)] leading-[0.84]"
              >
                Questions
              </h2>
            </div>
            <div className="lg:col-span-7 lg:col-start-6">
              {FAQ.map((item) => (
                <details key={item.q} className="sr-faq group">
                  <summary className="sr-focus-inset flex cursor-pointer list-none items-center justify-between gap-6 py-5">
                    <span className="sr-display text-[clamp(1.6rem,2.6vw,2.2rem)] leading-[1]">
                      {item.q}
                    </span>
                    <span
                      aria-hidden="true"
                      className="sr-faq-icon grid size-10 shrink-0 place-items-center border border-[var(--sr-line-strong)] text-[var(--sr-ember)]"
                    >
                      +
                    </span>
                  </summary>
                  <p className="max-w-[56ch] pb-6 text-[17px] leading-[1.65] text-[var(--sr-smoke)]/85">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="sr-footer border-t border-[var(--sr-line)] bg-[var(--sr-coal)] pt-20 pb-10 text-[var(--sr-smoke)]">
        <div className="sr-wrap">
          <p className="sr-footer-mark sr-display" aria-hidden="true" data-word="Smoke & Rail" />
          <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-12">
            <div className="lg:col-span-2">
              <p className="sr-label text-[11px] text-[var(--sr-ember)]">The pit</p>
              <p className="mt-3 text-[15px] leading-[1.7]">
                {BUSINESS.name}
                <br />
                {BUSINESS.street}
                <br />
                {BUSINESS.city}
              </p>
              <a
                href={BUSINESS.directions}
                target="_blank"
                rel="noopener noreferrer"
                className="sr-link mt-2 inline-block text-[15px]"
              >
                Directions
              </a>
            </div>
            <div className="lg:col-span-3">
              <p className="sr-label text-[11px] text-[var(--sr-ember)]">Hours</p>
              <ul className="mt-3 text-[15px] leading-[1.7]">
                <li>Thu–Sat · the pit · 11 AM – sold out</li>
                <li>Tue · truck at the Crossroads · 11 AM – 2 PM</li>
                <li>Wed · truck at River Market · 11 AM – 2 PM</li>
              </ul>
            </div>
            <div className="lg:col-span-3">
              <p className="sr-label text-[11px] text-[var(--sr-ember)]">Contact</p>
              <p className="mt-3 text-[15px] leading-[1.7]">
                <a href={BUSINESS.phoneHref} className="sr-link">
                  {BUSINESS.phone}
                </a>
                <br />
                <a href={`mailto:${BUSINESS.email}`} className="sr-link break-words">
                  {BUSINESS.email}
                </a>
                <br />
                <a
                  href={BUSINESS.order}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sr-link"
                >
                  Preorder pickup
                </a>
              </p>
            </div>
            <div className="sm:col-span-2 lg:col-span-4">
              <p className="sr-label text-[11px] text-[var(--sr-ember)]">About this site</p>
              <p className="mt-3 text-[14px] leading-[1.65] text-[var(--sr-smoke)]/80">
                Smoke &amp; Rail BBQ, its people and its menu are fictional. This is a design
                demonstration by{" "}
                <a href="https://www.nosweatfd.com/" className="sr-link">
                  No Sweat
                </a>
                . The phone number is a 555 number, the order and email addresses do not exist and
                the catering form does not send or store anything.
              </p>
            </div>
          </div>
          <div className="mt-12 border-t border-[var(--sr-line)] pt-6">
            <p className="sr-label flex items-center gap-3 text-[11px] text-[var(--sr-ash)]">
              <RailMark className="h-3 w-6 text-[var(--sr-ember)]" />
              Photography
            </p>
            <ul className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1 text-[12px] text-[var(--sr-ash)] sm:grid-cols-2 lg:grid-cols-4">
              {Object.values(PHOTOS).map((photo) => (
                <li key={photo.id}>
                  <Credit photo={photo} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </footer>
      <div className="sr-badge">
        <NoSweatBadge />
      </div>
      <SmokeMotion />
    </>
  );
}
