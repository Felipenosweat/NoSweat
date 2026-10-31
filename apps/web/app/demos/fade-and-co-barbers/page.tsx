import { NoSweatBadge } from "@nosweat/templates";
import type { CSSProperties } from "react";
import { Booking } from "@/components/demos/fade-and-co/Booking";
import {
  ABOUT,
  BARBERS,
  BUSINESS,
  CLOSED_DAYS,
  FAQ,
  MAP_HREF,
  OPEN_HOURS,
  PHONE_HREF,
  PRACTICAL,
  REVIEWS,
  SERVICES,
  SERVICE_GROUPS,
} from "@/components/demos/fade-and-co/content";
import { FadeMotion } from "@/components/demos/fade-and-co/FadeMotion";
import { HoursStatus } from "@/components/demos/fade-and-co/HoursStatus";
import { Nav } from "@/components/demos/fade-and-co/Nav";
import { PHOTOS } from "@/components/demos/fade-and-co/photos";
import { Credit, Kicker, Letters, Lines, Photo } from "@/components/demos/fade-and-co/ui";

// Fade & Co. Barbers (demonstração, barbearia fictícia). Direção "kinetic-type": a letra é a
// imagem. A ideia que só serve a esta casa: o nome FAZ uma fade, como um corte degradê, cada
// linha de baixo mais fina que a de cima (peso 900 → 120, largura 112 → 74 no eixo da Anybody).
// Superfície em blocos de uma cor só: vermelho de barbearia, osso e quase-preto, alternando.
// Ordem: herói (vermelho) → faixa de preços correndo (preto) → frase do corte (osso) →
// quadro de preços (preto) → barbeiros (vermelho) → reservar (osso) → horário e endereço
// (vermelho) → rodapé (preto) com o selo da No Sweat. Ver docs/design/demos/fade-and-co-barbers.md.

const wrap = "mx-auto w-full max-w-[1440px] px-4 sm:px-8 lg:px-10";

/** As linhas da "fade" abaixo do nome: peso e largura caem a cada linha (o degradê). */
const FADE_ROWS = [
  { wg: 640, wd: 100, guard: "No. 2" },
  { wg: 380, wd: 88, guard: "No. 1" },
  { wg: 140, wd: 74, guard: "No. 0" },
];

const DAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

/** "Tue–Fri" → "2,3,4,5" (para o HoursStatus marcar a linha de hoje). */
function dayList(days: string) {
  const [from, to] = days.split("–");
  const start = DAY_INDEX[from ?? ""] ?? 0;
  const end = DAY_INDEX[to ?? from ?? ""] ?? start;
  const list: number[] = [];
  for (let day = start; ; day = (day + 1) % 7) {
    list.push(day);
    if (day === end) break;
  }
  return list.join(",");
}

const STATEMENT = "Every cut ends with a neck shave and a hot towel.".split(" ");
const groupPhoto = { Cuts: PHOTOS.shears, "Beard & shave": PHOTOS.beard } as const;

export default function FadeAndCoPage() {
  const phone = BUSINESS.phone ?? "";
  const hours = BUSINESS.hours ?? [];
  const darnell = BARBERS[0];

  return (
    <>
      <a href="#main" className="f-skip f-focus">
        Skip to content
      </a>
      <Nav phone={phone} phoneHref={PHONE_HREF} />

      <main id="main">
        {/* HERÓI — o nome faz a fade */}
        <section id="top" data-f-hero aria-labelledby="f-title" className="f-hero f-red">
          <div className={`${wrap} f-hero-inner`}>
            <div className="f-hero-meta">
              <p>Barbershop · Logan Square, Chicago</p>
              <p className="hidden sm:block">{BUSINESS.address} · Since 2017</p>
            </div>

            <h1 id="f-title" className="f-hero-name">
              <span className="sr-only">Fade &amp; Co. Barbers</span>
              <span aria-hidden="true" className="f-hero-name-vis">
                <span className="f-hero-word">
                  <Letters text="FADE" weights={900} widths={112} clip />
                </span>{" "}
                <span className="f-hero-word">
                  <Letters text="&" weights={900} widths={112} clip />
                  <span className="f-space" />
                  <Letters text="CO." weights={900} widths={112} clip />
                </span>
              </span>
            </h1>

            <div className="f-hero-body">
              <div aria-hidden="true" className="f-fade-rows">
                {FADE_ROWS.map((row, index) => (
                  <div
                    key={row.guard}
                    className="f-fade-row"
                    style={{ "--row": index } as CSSProperties}
                  >
                    <span className="f-fade-word">
                      <Letters text="FADE" weights={row.wg} widths={row.wd} clip />
                    </span>
                    <span className="f-guard">{row.guard}</span>
                  </div>
                ))}
              </div>

              <div className="f-hero-side">
                <p className="f-hero-lede">
                  A four-chair barbershop on Milwaukee Ave for fades, scissor cuts, beards and
                  straight-razor shaves.
                </p>
                <p className="f-hero-small">Walk-ins are welcome. Booking guarantees your chair.</p>
                <p className="f-hero-small sm:hidden">{BUSINESS.address} · Since 2017</p>
                <div className="f-hero-ctas">
                  <a href="#book" className="f-btn f-btn-bone f-focus">
                    Book a chair
                  </a>
                  <a href={PHONE_HREF} className="f-btn f-btn-line f-focus">
                    {phone}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PREÇOS CORRENDO — faixa preta (decorativa: o quadro de verdade vem logo abaixo) */}
        <div className="f-marquee f-ink" aria-hidden="true">
          <div className="f-marquee-track">
            {[0, 1].map((copy) => (
              <p key={copy} className="f-marquee-run">
                {SERVICES.map((item) => (
                  <span key={item.id} className="f-marquee-item">
                    {item.name}
                    <span className="f-marquee-price">{item.price}</span>
                    <span className="f-marquee-sep">/</span>
                  </span>
                ))}
              </p>
            ))}
          </div>
        </div>

        {/* O CORTE — a frase do dono ganha peso com a rolagem */}
        <section aria-labelledby="f-every" className="f-bone f-every">
          <div className={`${wrap} grid gap-12 lg:grid-cols-12 lg:gap-10`}>
            <div className="lg:col-span-8">
              <Kicker index="01">Every visit</Kicker>
              <h2 id="f-every" className="f-statement" data-f-weigh>
                {STATEMENT.map((word, index) => (
                  <span key={index}>
                    <span data-f-word className="f-word">
                      {word}
                    </span>
                    {word === "shave" ? (
                      <span aria-hidden="true" className="f-chip">
                        <Photo
                          photo={PHOTOS.neck}
                          sizes="12rem"
                          ratio={1.6}
                          className="size-full object-cover"
                        />
                      </span>
                    ) : null}{" "}
                  </span>
                ))}
              </h2>
            </div>
            <figure className="f-every-fig lg:col-span-4" data-f-rise>
              <Photo
                photo={PHOTOS.clipper}
                sizes="(min-width: 1024px) 30vw, 100vw"
                ratio={0.8}
                className="aspect-[0.8] w-full object-cover"
              />
              <figcaption className="f-cap">
                Clipper work · Photo: <Credit photo={PHOTOS.clipper} />
              </figcaption>
            </figure>
          </div>

          <div className={`${wrap} mt-16 lg:mt-24`}>
            <dl className="f-facts">
              <div data-f-rise>
                <dt className="sr-only">Chairs</dt>
                <dd>
                  <span className="f-fact-n">4</span>
                  <span className="f-fact-l">chairs on Milwaukee Ave</span>
                </dd>
              </div>
              <div data-f-rise>
                <dt className="sr-only">Barbers</dt>
                <dd>
                  <span className="f-fact-n">{BARBERS.length}</span>
                  <span className="f-fact-l">barbers, ask for any of them by name</span>
                </dd>
              </div>
              <div data-f-rise>
                <dt className="sr-only">Opened</dt>
                <dd>
                  <span className="f-fact-n">2017</span>
                  <span className="f-fact-l">
                    the year {darnell?.first ?? "the owner"} opened the shop
                  </span>
                </dd>
              </div>
            </dl>
          </div>
        </section>

        {/* QUADRO DE PREÇOS — preto, como a tabela na parede */}
        <section id="prices" aria-labelledby="f-prices" className="f-ink f-board">
          <div className={wrap}>
            <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
              <div className="lg:col-span-8">
                <Kicker index="02">Prices</Kicker>
                <Lines id="f-prices" lines={["Cuts, beards", "and shaves"]} className="f-h2" />
              </div>
              <p className="f-board-note lg:col-span-4">
                Every cut ends with a neck shave and a hot towel. Cash and cards.
              </p>
            </div>

            <div className="f-board-cols">
              {SERVICE_GROUPS.map((group) => {
                const photo = groupPhoto[group as keyof typeof groupPhoto];
                return (
                  <div key={group} className="f-board-group">
                    <div className="f-board-head">
                      <h3 className="f-board-title">{group}</h3>
                      {photo ? (
                        <Photo
                          photo={photo}
                          sizes="(min-width: 1024px) 14rem, 40vw"
                          ratio={2.2}
                          className="f-board-photo"
                        />
                      ) : null}
                    </div>
                    <ul className="f-rows">
                      {SERVICES.filter((item) => item.group === group).map((item) => (
                        <li key={item.id} className="f-row">
                          <div className="f-row-main">
                            <h4 className="f-row-name">{item.name}</h4>
                            <p className="f-row-desc">{item.description}</p>
                          </div>
                          <p className="f-row-price">
                            {item.price}
                            {item.detail ? <span className="f-row-time">{item.detail}</span> : null}
                          </p>
                          <a href="#book" data-f-pick={item.id} className="f-row-book f-focus">
                            Book<span className="sr-only"> a {item.name.toLowerCase()}</span>
                            <span aria-hidden="true"> →</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
            <p className="f-cap mt-10">
              Photos: <Credit photo={PHOTOS.shears} /> · <Credit photo={PHOTOS.beard} />
            </p>
          </div>
        </section>

        {/* BARBEIROS — vermelho; cada nome ocupa a linha inteira pela largura da letra */}
        <section id="barbers" aria-labelledby="f-barbers" className="f-red f-barbers">
          <div className={wrap}>
            <Kicker index="03">The barbers</Kicker>
            <Lines id="f-barbers" lines={["Three barbers,", "four chairs"]} className="f-h2" />

            <div className="f-barber-list">
              {BARBERS.map((barber) => (
                <article key={barber.id} className="f-barber" aria-labelledby={`f-b-${barber.id}`}>
                  <div className="f-barber-box">
                    <h3
                      id={`f-b-${barber.id}`}
                      className="f-barber-name"
                      data-f-fit
                      data-f-stretch
                      style={
                        {
                          "--wd":
                            barber.first.length > 5 ? 56 : barber.first.length > 3 ? 110 : 150,
                        } as CSSProperties
                      }
                    >
                      {barber.first.toUpperCase()}
                    </h3>
                  </div>
                  <p className="f-barber-meta">
                    <span className="f-barber-full">{barber.name}</span>
                    <span>{barber.role}</span>
                    <span>{barber.note}</span>
                  </p>
                </article>
              ))}
            </div>

            <div className="f-barbers-foot">
              <p className="f-about">{ABOUT.body}</p>
              <figure className="f-quotes">
                <figcaption className="f-kicker-plain">Clients said</figcaption>
                {REVIEWS.map((review) => (
                  <blockquote key={review.author} className="f-quote" data-f-rise>
                    <p>&ldquo;{review.quote}&rdquo;</p>
                    <footer>{review.author}</footer>
                  </blockquote>
                ))}
              </figure>
            </div>
          </div>
        </section>

        {/* RESERVAR — osso; fluxo de demonstração em quatro passos */}
        <section id="book" aria-labelledby="f-book" className="f-bone f-booking">
          <div className={`${wrap} grid gap-12 lg:grid-cols-12 lg:gap-10`}>
            <div className="lg:col-span-5">
              <Kicker index="04">Book a chair</Kicker>
              <Lines
                id="f-book"
                lines={["Pick a service,", "a barber", "and a time"]}
                className="f-h2 f-h2-s"
              />
              <ul className="f-notes">
                <li>{PRACTICAL.walkIns}</li>
                <li>{PRACTICAL.cancel}</li>
                <li>{PRACTICAL.cards}</li>
              </ul>
              <figure className="mt-12 hidden lg:block" data-f-rise>
                <Photo
                  photo={PHOTOS.razor}
                  sizes="36vw"
                  ratio={1.5}
                  className="aspect-[1.5] w-full object-cover"
                />
                <figcaption className="f-cap">
                  Straight razor and brush · Photo: <Credit photo={PHOTOS.razor} />
                </figcaption>
              </figure>
            </div>
            <div className="lg:col-span-7">
              <Booking
                services={SERVICES}
                barbers={BARBERS}
                hours={OPEN_HOURS}
                phone={phone}
                phoneHref={PHONE_HREF}
                cancelNote={PRACTICAL.cancel}
              />
            </div>
          </div>
        </section>

        {/* HORÁRIO E ENDEREÇO — vermelho; o horário em letra de cartaz */}
        <section id="visit" aria-labelledby="f-visit" className="f-red f-visit">
          <div className={wrap}>
            <Kicker index="05">Hours &amp; visit</Kicker>
            <Lines id="f-visit" lines={["Open Tuesday", "to Sunday"]} className="f-h2" />
            <HoursStatus hours={OPEN_HOURS} />

            <div className="f-visit-grid">
              <table className="f-hours">
                <caption className="sr-only">Opening hours</caption>
                <tbody>
                  {hours.map((row) => (
                    <tr key={row.days} data-f-days={dayList(row.days)}>
                      <th scope="row">{row.days}</th>
                      <td>{row.time}</td>
                    </tr>
                  ))}
                  {CLOSED_DAYS.map((day) => (
                    <tr
                      key={day}
                      data-f-days={String(DAY_INDEX[day.slice(0, 3)] ?? "")}
                      className="f-hours-closed"
                    >
                      <th scope="row">{day.slice(0, 3)}</th>
                      <td>Closed</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="f-visit-side">
                <address className="f-address">
                  <a
                    href={MAP_HREF}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="f-link-big f-focus"
                  >
                    {BUSINESS.address}
                    <br />
                    {BUSINESS.city}, {BUSINESS.state}
                  </a>
                  <span className="f-address-note">{PRACTICAL.parking}</span>
                </address>
                <ul className="f-contact">
                  <li>
                    <a href={PHONE_HREF} className="f-link f-focus">
                      {phone}
                    </a>
                  </li>
                  <li>
                    <a href={`mailto:${BUSINESS.email}`} className="f-link f-focus">
                      {BUSINESS.email}
                    </a>
                  </li>
                  <li>
                    <a
                      href={BUSINESS.links?.instagram}
                      className="f-link f-focus"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Instagram
                    </a>
                  </li>
                </ul>
                <dl className="f-faq">
                  {FAQ.filter(
                    (item) => item.q !== FAQ.find((q) => q.q.toLowerCase().includes("park"))?.q,
                  ).map((item) => (
                    <div key={item.q}>
                      <dt>{item.q}</dt>
                      <dd>{item.a}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer id="f-footer" className="f-ink f-footer">
        <div className={wrap}>
          <p aria-hidden="true" className="f-foot-mark" data-f-sweep>
            <Letters
              text="FADE & CO."
              weights={[900, 820, 720, 610, 0, 500, 0, 390, 270, 160]}
              widths={[112, 108, 104, 100, 0, 96, 0, 90, 84, 78]}
            />
          </p>
          <div className="f-foot-grid">
            <div>
              <p className="f-foot-name">Fade &amp; Co. Barbers</p>
              <p className="f-foot-text">
                {BUSINESS.address}, {BUSINESS.city}, {BUSINESS.state}
                <br />
                <a href={PHONE_HREF} className="f-link">
                  {phone}
                </a>
              </p>
            </div>
            <div>
              <p className="f-kicker-plain">About this site</p>
              <p className="f-foot-text">
                Fade &amp; Co. Barbers, its barbers and its clients are fictional. This page is a
                design demonstration by{" "}
                <a href="https://www.nosweatfd.com/" className="f-link">
                  No Sweat
                </a>
                . The booking form does not send or store anything.
              </p>
            </div>
            <div>
              <p className="f-kicker-plain">Photography</p>
              <ul className="f-foot-credits">
                {Object.values(PHOTOS).map((photo) => (
                  <li key={photo.id}>
                    <Credit photo={photo} />
                  </li>
                ))}
              </ul>
              <p className="f-foot-text mt-3">
                Stock scenes, shown in the shop&rsquo;s two colours. None of them shows the barbers
                named on this page.
              </p>
            </div>
          </div>
        </div>
      </footer>
      <div className="f-badge">
        <NoSweatBadge />
      </div>
      <FadeMotion />
    </>
  );
}
