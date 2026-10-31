import { NoSweatBadge } from "@nosweat/templates";
import { ArtistIndex } from "@/components/demos/iron-lotus/ArtistIndex";
import { ConsultSlip } from "@/components/demos/iron-lotus/ConsultSlip";
import { PRICES, STEPS, STUDIO } from "@/components/demos/iron-lotus/content";
import { LotusMark } from "@/components/demos/iron-lotus/flash";
import { FlashSheet } from "@/components/demos/iron-lotus/FlashSheet";
import { IronLotusMotion } from "@/components/demos/iron-lotus/IronLotusMotion";
import { PHOTOS } from "@/components/demos/iron-lotus/photos";
import { Rail } from "@/components/demos/iron-lotus/Rail";
import { Credit, Cutout, SheetHead } from "@/components/demos/iron-lotus/ui";

// Iron Lotus Tattoo (demonstração, estúdio fictício em Denver). Direção: "experimental-grid"
// como folha de flash: papel cor de osso, tinta preta e UM vermelho; o layout é a ideia (peças
// numeradas presas em escalas diferentes, folhas numeradas 01–06, índice na margem direita).
// Ordem: 01 Flash (a folha, com etiqueta por peça) → 02 Artistas (índice) → 03 Preços (quadro
// de preços) → 04 Como marcar (passos + carimbo de 18+) → 05 Ficha de consulta (demo, não
// envia nada) → 06 Visita (endereço, horário, contato) → rodapé com créditos → selo No Sweat.
// Todo fato vem da fixture iron-lotus-tattoo (regra 8). Ver docs/design/demos/iron-lotus-tattoo.md.

const wrap = "mx-auto w-full max-w-[1320px] px-5 sm:px-8 lg:px-12";

function Stamp() {
  return (
    <svg
      viewBox="0 0 200 200"
      role="img"
      aria-label="You must be 18 or older with a valid photo ID"
      data-il-stamp
      className="il-stamp"
    >
      <defs>
        <path id="il-stamp-ring" d="M100 100m-72 0a72 72 0 1 1 144 0a72 72 0 1 1-144 0" />
      </defs>
      <circle cx="100" cy="100" r="94" fill="none" strokeWidth="4" />
      <circle cx="100" cy="100" r="58" fill="none" strokeWidth="2" />
      <text className="il-stamp-ring">
        <textPath href="#il-stamp-ring" startOffset="0" textLength={446} lengthAdjust="spacing">
          Must be 18 or older • Bring a valid photo ID •
        </textPath>
      </text>
      <text x="100" y="118" textAnchor="middle" className="il-stamp-big">
        18+
      </text>
    </svg>
  );
}

export default function IronLotusPage() {
  return (
    <>
      <Rail />
      <div className="il-page">
        <main id="main">
          {/* 01 · FLASH — a folha */}
          <section id="flash" aria-labelledby="il-title" className="il-hero scroll-mt-16">
            <div
              className={`${wrap} grid min-h-[100svh] content-center gap-10 pt-24 pb-14 md:pt-28 lg:grid-cols-12 lg:gap-8 lg:py-10`}
            >
              <div className="flex flex-col lg:col-span-5">
                <p className="il-mono flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] tracking-[0.08em] uppercase">
                  <span className="text-[var(--il-red)]">Sheet 01 / 06</span>
                  <span aria-hidden="true" className="h-px w-8 bg-[var(--il-ink)]" />
                  <span>
                    {STUDIO.street} · {STUDIO.area}, {STUDIO.city}
                  </span>
                </p>
                <h1 id="il-title" className="il-title mt-6 lg:mt-8">
                  <span className="il-title-line">
                    <span>Iron</span>
                  </span>
                  <span className="il-title-line">
                    <span>Lotus</span>
                  </span>
                  <span className="il-title-sub il-mono">Tattoo · Denver, CO</span>
                </h1>
                <p className="il-hero-copy mt-6 max-w-[42ch] text-[18px] leading-[1.55]">
                  A private custom studio on Larimer St. Mara, Theo and Lena do blackwork, fine
                  line, color realism and cover-ups, and every drawing gets changed with you until
                  it&apos;s right.
                </p>
                <div className="il-hero-copy mt-7 flex flex-wrap gap-3">
                  <a href="#consult" className="il-btn il-btn-red">
                    Request a consult
                  </a>
                  <a href={STUDIO.phoneHref} className="il-btn il-btn-line">
                    Call {STUDIO.phone}
                  </a>
                </div>
                <dl className="il-facts il-hero-copy mt-10 grid grid-cols-2 gap-x-6 gap-y-4 lg:mt-auto lg:pt-10">
                  <div>
                    <dt>Open</dt>
                    <dd>Tue–Sat, 12–8 PM</dd>
                  </div>
                  <div>
                    <dt>Age</dt>
                    <dd>18+ with photo ID</dd>
                  </div>
                  <div>
                    <dt>Deposit</dt>
                    <dd>$100 holds your date</dd>
                  </div>
                  <div>
                    <dt>Flash Fridays</dt>
                    <dd>Walk-in, from $100</dd>
                  </div>
                </dl>
              </div>
              <div className="lg:col-span-7">
                <FlashSheet />
              </div>
            </div>
          </section>

          {/* 02 · ARTISTAS — índice */}
          <section
            id="artists"
            aria-labelledby="artists-title"
            className="scroll-mt-16 py-20 lg:pt-32 lg:pb-36"
          >
            <div className={wrap}>
              <SheetHead id="artists" aside="Three artists · one studio" />
              <div className="mt-10 mb-12 grid gap-6 lg:mb-14 lg:grid-cols-12 lg:items-end">
                <h2 id="artists-title" data-il-rise className="il-h2 lg:col-span-7">
                  Pick the hand closest to your idea
                </h2>
                <p
                  data-il-rise
                  className="max-w-[46ch] text-[17px] leading-[1.6] lg:col-span-4 lg:col-start-9"
                >
                  Mara Quinn owns the studio. Theo Banks and Lena Ruiz each work in a style of their
                  own, so bring your idea to the artist whose work is closest to it.
                </p>
              </div>
              <ArtistIndex />
            </div>
          </section>

          {/* 03 · PREÇOS — quadro */}
          <section
            id="prices"
            aria-labelledby="prices-title"
            className="il-ruled scroll-mt-16 py-20 lg:py-24"
          >
            <div className={wrap}>
              <SheetHead id="prices" aside="As listed by the studio" />
              <div className="mt-10 grid gap-8 lg:grid-cols-12 lg:items-end">
                <h2 id="prices-title" data-il-rise className="il-h2 lg:col-span-6">
                  What it costs
                </h2>
                <p
                  data-il-rise
                  className="max-w-[40ch] text-[17px] leading-[1.6] lg:col-span-3 lg:col-start-7"
                >
                  Hourly for custom work, a set price for full days, and flash on Fridays. A $100
                  deposit holds your date and comes off your last session.
                </p>
                <div className="relative z-10 w-[62%] max-w-[260px] justify-self-end sm:w-[40%] lg:col-span-3 lg:-mb-6 lg:w-[86%] lg:max-w-[240px]">
                  <Cutout
                    photo={PHOTOS.stencil}
                    sizes="(min-width: 1024px) 20vw, 60vw"
                    ratio={1}
                    tilt={4}
                  />
                </div>
              </div>
              <ul className="il-board mt-12" data-il-stagger>
                {PRICES.map((price) => (
                  <li
                    key={price.no}
                    className="il-plate"
                    data-wide={price.wide || undefined}
                    data-red={price.red || undefined}
                  >
                    <p className="il-mono flex items-center gap-3 text-[12px] tracking-[0.08em] uppercase">
                      <span className="il-plate-key" aria-hidden="true">
                        {price.no}
                      </span>
                      {price.name}
                    </p>
                    <p className="mt-6 flex flex-wrap items-baseline gap-x-3">
                      <span className="il-display text-[clamp(3.4rem,6vw,5.5rem)] leading-[0.85]">
                        {price.amount}
                      </span>
                      {price.unit ? (
                        <span className="il-mono text-[13px] tracking-[0.04em] uppercase">
                          {price.unit}
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-4 max-w-[34ch] text-[15px] leading-[1.5]">{price.detail}</p>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* 04 · COMO MARCAR */}
          <section
            id="booking"
            aria-labelledby="booking-title"
            className="scroll-mt-16 py-20 lg:pt-28 lg:pb-32"
          >
            <div className={wrap}>
              <SheetHead id="booking" aside="Consult · deposit · drawing" />
              <h2 id="booking-title" data-il-rise className="il-h2 mt-10 max-w-[14ch]">
                How booking works
              </h2>
              <ol className="il-steps mt-12" data-il-stagger>
                {STEPS.map((step) => (
                  <li key={step.no} className="il-step">
                    <span className="il-step-no il-display" aria-hidden="true">
                      {step.no}
                    </span>
                    <h3 className="il-display mt-4 text-[28px] leading-none uppercase">
                      {step.title}
                    </h3>
                    <p className="mt-3 max-w-[30ch] text-[16px] leading-[1.55]">{step.body}</p>
                  </li>
                ))}
              </ol>
              <div className="mt-16 grid items-center gap-12 lg:mt-20 lg:grid-cols-12 lg:gap-8">
                <div className="flex justify-center lg:col-span-3 lg:justify-start">
                  <Stamp />
                </div>
                <ul className="il-rules lg:col-span-5" data-il-stagger>
                  <li>
                    <span className="il-mono">Age</span>
                    You must be 18 or older, with a valid photo ID.
                  </li>
                  <li>
                    <span className="il-mono">Moving a date</span>
                    You can move your appointment once with 48 hours notice and keep the deposit.
                  </li>
                  <li>
                    <span className="il-mono">The drawing</span>
                    Shown on the day of your appointment, not before.
                  </li>
                  <li>
                    <span className="il-mono">Flash Fridays</span>
                    No booking: walk in, first come.
                  </li>
                </ul>
                <div className="mx-auto w-full max-w-[380px] lg:col-span-4 lg:max-w-none">
                  <Cutout
                    photo={PHOTOS.drawing}
                    sizes="(min-width: 1024px) 28vw, 80vw"
                    ratio={5 / 4}
                    tilt={-2.5}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* 05 · FICHA DE CONSULTA (demonstração) */}
          <section
            id="consult"
            aria-labelledby="consult-title"
            className="il-ruled scroll-mt-16 py-20 lg:py-32"
          >
            <div className={wrap}>
              <SheetHead id="consult" aside="Demonstration · nothing is sent" />
              <div className="mt-10 grid gap-12 lg:grid-cols-12 lg:gap-10">
                <div className="lg:col-span-4">
                  <h2 id="consult-title" data-il-rise className="il-h2">
                    Fill out a consult slip
                  </h2>
                  <p data-il-rise className="mt-6 max-w-[40ch] text-[17px] leading-[1.6]">
                    The way you would at the counter: where it goes, how big, what kind of work, who
                    you want, and your idea. The price guide at the foot of the slip shows the
                    studio&apos;s own prices for what you pick.
                  </p>
                  <p className="il-mono mt-6 max-w-[40ch] border-l-2 border-[var(--il-red)] pl-4 text-[12px] leading-[1.6] tracking-[0.02em]">
                    Demonstration: the slip sends nothing and stores nothing. A reference image you
                    add stays in this browser tab.
                  </p>
                  <div className="mt-10 border-t border-[var(--il-rule)] pt-6">
                    <p className="il-mono text-[11px] tracking-[0.1em] text-[var(--il-ink-soft)] uppercase">
                      Rather talk?
                    </p>
                    <p className="mt-2 text-[17px] leading-[1.7]">
                      <a href={STUDIO.phoneHref} className="il-link">
                        {STUDIO.phone}
                      </a>
                      <br />
                      <a href={`mailto:${STUDIO.email}`} className="il-link break-all">
                        {STUDIO.email}
                      </a>
                    </p>
                  </div>
                </div>
                <div className="lg:col-span-8">
                  <ConsultSlip />
                </div>
              </div>
            </div>
          </section>

          {/* 06 · VISITA */}
          <section
            id="visit"
            aria-labelledby="visit-title"
            className="scroll-mt-16 pt-20 pb-24 lg:pt-28 lg:pb-40"
          >
            <div className={wrap}>
              <SheetHead id="visit" aside="RiNo · Denver, CO" />
              <div className="mt-10 grid gap-12 lg:grid-cols-12 lg:gap-10">
                <div className="lg:col-span-7">
                  <h2
                    id="visit-title"
                    data-il-rise
                    className="il-display text-[clamp(3.6rem,10vw,9.5rem)] leading-[0.82] uppercase"
                  >
                    {STUDIO.street}
                  </h2>
                  <p className="il-mono mt-5 text-[13px] tracking-[0.08em] uppercase">
                    {STUDIO.area} · {STUDIO.city}, {STUDIO.state} · a private custom studio
                  </p>
                  <div className="mt-12 grid gap-10 sm:grid-cols-2">
                    <div>
                      <p className="il-mono text-[11px] tracking-[0.1em] text-[var(--il-ink-soft)] uppercase">
                        Hours
                      </p>
                      <table className="il-hours mt-3 w-full">
                        <tbody>
                          {STUDIO.hours.map((row) => (
                            <tr key={row.days}>
                              <th scope="row">{row.days}</th>
                              <td>{row.time}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div>
                      <p className="il-mono text-[11px] tracking-[0.1em] text-[var(--il-ink-soft)] uppercase">
                        Reach the studio
                      </p>
                      <ul className="mt-3 grid gap-3">
                        <li>
                          <a href={STUDIO.phoneHref} className="il-btn il-btn-line w-full">
                            Call {STUDIO.phone}
                          </a>
                        </li>
                        <li>
                          <a href="#consult" className="il-btn il-btn-red w-full">
                            Request a consult
                          </a>
                        </li>
                        <li>
                          <a
                            href={`mailto:${STUDIO.email}`}
                            className="il-link text-[15px] break-all"
                          >
                            {STUDIO.email}
                          </a>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="mx-auto w-full max-w-[420px] lg:col-span-4 lg:col-start-9 lg:max-w-none lg:pt-6">
                  <Cutout
                    photo={PHOTOS.denver}
                    sizes="(min-width: 1024px) 28vw, 80vw"
                    ratio={4 / 3}
                    tilt={3}
                  />
                </div>
              </div>
            </div>
          </section>
        </main>

        <footer className="il-footer">
          <div className={`${wrap} grid gap-12 pt-20 pb-12 lg:grid-cols-12`}>
            <div className="lg:col-span-5">
              <LotusMark className="il-footer-mark size-16" />
              <p className="il-display mt-5 text-[40px] leading-[0.9] uppercase">
                Iron Lotus Tattoo
              </p>
              <p className="mt-4 text-[15px] leading-[1.7] text-[var(--il-on-ink-soft)]">
                {STUDIO.street}, {STUDIO.area}, {STUDIO.city}, {STUDIO.state}
                <br />
                Tue–Sat, 12 PM – 8 PM ·{" "}
                <a href={STUDIO.phoneHref} className="il-link">
                  {STUDIO.phone}
                </a>
              </p>
            </div>
            <div className="lg:col-span-6 lg:col-start-7">
              <p className="il-mono text-[11px] tracking-[0.1em] text-[var(--il-red-on-ink)] uppercase">
                About this page
              </p>
              <p className="mt-3 text-[15px] leading-[1.7] text-[var(--il-on-ink-soft)]">
                Iron Lotus Tattoo, its artists and its clients are fictional. This is a design
                demonstration by{" "}
                <a href="https://www.nosweatfd.com/" className="il-link">
                  No Sweat
                </a>
                . The flash designs were drawn for this demo, the photos are example scenes, not the
                artists&apos; work, and the consult slip sends nothing.
              </p>
              <p className="il-mono mt-8 text-[11px] tracking-[0.1em] text-[var(--il-red-on-ink)] uppercase">
                Photography
              </p>
              <ul className="mt-3 grid gap-x-6 gap-y-1.5 text-[13px] text-[var(--il-on-ink-soft)] sm:grid-cols-2">
                {Object.values(PHOTOS).map((photo) => (
                  <li key={photo.id}>
                    <Credit photo={photo} />
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="il-footer-word il-display" aria-hidden="true" data-word="Iron Lotus" />
        </footer>
        <div
          className="@container il-badge"
          style={{ ["--nsb-bg" as string]: "#171513", ["--nsb-fg" as string]: "#f2ede3" }}
        >
          <NoSweatBadge />
        </div>
      </div>
      <IronLotusMotion />
    </>
  );
}
