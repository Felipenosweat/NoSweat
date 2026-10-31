import { NoSweatBadge } from "@nosweat/templates";
import { BottomBar, Mark, TopBar } from "@/components/demos/bright-spark/Bars";
import { BreakerPanel } from "@/components/demos/bright-spark/BreakerPanel";
import { BrightMotion } from "@/components/demos/bright-spark/BrightMotion";
import {
  BUSINESS,
  CITIES,
  FAQ,
  HIGHLIGHTS,
  HOURS,
  REVIEWS,
} from "@/components/demos/bright-spark/content";
import { OpenStatus } from "@/components/demos/bright-spark/OpenStatus";
import { PHOTOS } from "@/components/demos/bright-spark/photos";
import { QuoteRequest } from "@/components/demos/bright-spark/QuoteRequest";
import { CircuitHead, Credit } from "@/components/demos/bright-spark/ui";

// Bright Spark Electric (demonstração, eletricista fictício em Phoenix). Direção
// "service-direct" + "type-poster": a promessa simples do dono ("Written quote first") é a
// imagem do topo, num bloco amarelo de segurança com tinta quase preta. Hierarquia por números
// (preços, taxa de visita, 6 cidades, horário, 2006). A assinatura: um FIO na margem esquerda que
// se energiza com a rolagem e liga o interruptor de cada "circuito" (seção), e o índice de
// serviços como quadro de disjuntores. Ordem: topo (cartaz + fatos) → 01 Serviços (quadro) →
// 02 Dia de troca de quadro (passos + fala da Rachel) → 03 Área e horário → 04 Quem atende
// (Marcus e Tasha, fala do Omar, perguntas) → 05 Pedido de orçamento (demo) → rodapé com
// créditos → selo No Sweat. Todo fato vem da fixture bright-spark-electric (regra 8).

const wrap = "mx-auto w-full max-w-[1400px] pr-5 pl-9 sm:pr-8 sm:pl-14 lg:pr-14 lg:pl-24";

function Wire() {
  return (
    <span aria-hidden="true" className="bs-wire">
      <span className="bs-wire-fill" />
    </span>
  );
}

const PANEL_DAY = [
  {
    title: "Look first",
    body: "Marcus looks at your panel and meter first and gives you a written quote.",
  },
  { title: "Permit", body: "When the job needs a permit, we pull it." },
  {
    title: "The day",
    body: "The power is off for part of it. Before he leaves, Marcus walks you through every breaker.",
  },
  { title: "Inspection", body: "Tasha schedules the city inspection." },
];

export default function BrightSparkPage() {
  const [rachel, omar] = REVIEWS;
  return (
    <>
      {/* O "Skip to content" vem do layout raiz do app. */}
      <TopBar />
      <main id="main">
        {/* TOPO — o cartaz */}
        <section id="top" aria-labelledby="bs-title" className="bs-hero scroll-mt-14">
          <div className={`${wrap} flex min-h-[calc(100svh-3.5rem)] flex-col pt-10 pb-8 lg:pt-14`}>
            <div className="grid flex-1 gap-8 lg:grid-cols-12 lg:gap-10">
              <h1 id="bs-title" className="lg:col-span-8">
                <span className="bs-label block" data-bs-line>
                  {BUSINESS.name} · {BUSINESS.category} · {BUSINESS.city}, {BUSINESS.state}
                </span>
                <span className="bs-poster mt-6 block lg:mt-10">
                  <span className="bs-poster-line">
                    <span data-bs-line>Written</span>
                  </span>
                  <span className="bs-poster-line">
                    <span data-bs-line>quote</span>
                  </span>
                  <span className="bs-poster-line">
                    <span data-bs-line>first.</span>
                  </span>
                </span>
              </h1>
              <div className="flex flex-col justify-end gap-6 lg:col-span-4 lg:pb-3">
                {/* No celular, horário e área logo abaixo do cartaz (a fila de números fica
                    abaixo da dobra). */}
                <p className="bs-hero-strip lg:hidden">
                  <span>
                    Mon–Fri <span className="bs-num">7–5</span> · Sat{" "}
                    <span className="bs-num">8–12</span>
                  </span>
                  <span>6 Valley cities</span>
                </p>
                <p className="max-w-[40ch] text-[18px] leading-[1.55] font-medium">
                  Marcus Bell has been wiring houses in the Valley since 2006. Panel upgrades, EV
                  chargers, rewiring for older homes, lights and fans, and the breaker that keeps
                  tripping. You get a written quote before we start.
                </p>
                <div className="flex flex-wrap gap-3">
                  <a href={`tel:${BUSINESS.tel}`} className="bs-btn bs-btn-ink bs-btn-lg">
                    Call <span className="bs-num">{BUSINESS.phone}</span>
                  </a>
                  <a href="#quote" className="bs-btn bs-btn-line bs-btn-lg">
                    Request a quote
                  </a>
                </div>
                <p className="text-[15px] leading-[1.5]">
                  When you call, you talk to Marcus or Tasha, not a call center.
                </p>
              </div>
            </div>

            <dl className="bs-facts mt-10 lg:mt-14">
              <div>
                <dt>Service call, then a written quote</dt>
                <dd className="bs-num">$95</dd>
              </div>
              <div>
                <dt>Cities, Phoenix to Glendale</dt>
                <dd className="bs-num">6</dd>
              </div>
              <div>
                <dt>Mon–Fri, 7 AM – 5 PM · Sat 8–12</dt>
                <dd className="bs-num">7–5</dd>
              </div>
              <div>
                <dt>Wiring Valley houses since</dt>
                <dd className="bs-num">{BUSINESS.since}</dd>
              </div>
            </dl>
          </div>
        </section>

        {/* 01 · SERVIÇOS — o quadro de disjuntores */}
        <section
          id="services"
          aria-labelledby="bs-services-title"
          data-bs-circuit
          className="bs-sec bs-paper scroll-mt-14"
        >
          <Wire />
          <div className={`${wrap} py-16 lg:py-24`}>
            <CircuitHead id="services" aside="Prices from the owner" />
            <div className="mt-8 grid gap-6 lg:mt-12 lg:grid-cols-12 lg:gap-10">
              <h2 id="bs-services-title" className="bs-h2 lg:col-span-7" data-bs-rise>
                Five breakers. Flip one for the price.
              </h2>
              <p
                className="max-w-[44ch] text-[18px] leading-[1.6] lg:col-span-5 lg:self-end"
                data-bs-rise
              >
                Every job starts with a written quote, and we pull the permit when the job needs
                one. The service call is <span className="bs-num font-semibold">$95</span>.
              </p>
            </div>
            <div className="mt-10 lg:mt-14">
              <BreakerPanel />
            </div>
          </div>
        </section>

        {/* 02 · UM DIA DE TROCA DE QUADRO */}
        <section
          id="panel-day"
          aria-labelledby="bs-day-title"
          data-bs-circuit
          className="bs-sec bs-ink scroll-mt-14"
        >
          <Wire />
          <div className={`${wrap} py-16 lg:py-24`}>
            <CircuitHead id="panel-day" dark aside="200 A · from $2,400" />
            <h2 id="bs-day-title" className="bs-h2 mt-8 max-w-[16ch] lg:mt-12" data-bs-rise>
              A panel upgrade, start to finish.
            </h2>
            <ol className="bs-day mt-12 lg:mt-16">
              {PANEL_DAY.map((step, i) => (
                <li key={step.title} data-bs-rise>
                  <span className="bs-day-no bs-num" aria-hidden="true">
                    {i + 1}
                  </span>
                  <h3 className="bs-h4 mt-4">
                    <span className="sr-only">Step {i + 1}: </span>
                    {step.title}
                  </h3>
                  <p className="mt-2 text-[17px] leading-[1.6]">{step.body}</p>
                </li>
              ))}
            </ol>
            {rachel ? (
              <figure
                className="bs-quote-big mt-16 lg:mt-24 lg:grid lg:grid-cols-12 lg:gap-10"
                data-bs-rise
              >
                <p className="bs-label lg:col-span-3">A customer in {rachel.city}</p>
                <div className="lg:col-span-9">
                  <blockquote>
                    <p>&ldquo;{rachel.quote}&rdquo;</p>
                  </blockquote>
                  <figcaption className="bs-label mt-6">
                    {rachel.name}, {rachel.city}
                  </figcaption>
                </div>
              </figure>
            ) : null}
          </div>
        </section>

        {/* 03 · ÁREA E HORÁRIO */}
        <section
          id="area"
          aria-labelledby="bs-area-title"
          data-bs-circuit
          className="bs-sec bs-yellow scroll-mt-14"
        >
          <Wire />
          <div className={`${wrap} py-16 lg:py-24`}>
            <CircuitHead id="area" aside={<OpenStatus />} />
            <div className="mt-8 grid gap-12 lg:mt-12 lg:grid-cols-12 lg:gap-10">
              <div className="lg:col-span-7">
                <h2 id="bs-area-title" className="bs-h2" data-bs-rise>
                  Six cities.
                  <br />
                  Two sets of hours.
                </h2>
                <ul className="bs-cities-list mt-10" aria-label="Cities we cover">
                  {CITIES.map((city, i) => (
                    <li key={city} data-bs-rise>
                      <span className="bs-num" aria-hidden="true">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {city}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="lg:col-span-5 lg:pt-3">
                <h3 className="bs-label">Hours</h3>
                <ul className="bs-hours mt-4">
                  {HOURS.map((row) => (
                    <li
                      key={row.days}
                      data-bs-days={row.days === "Saturday" ? "6" : "1,2,3,4,5"}
                      data-bs-rise
                    >
                      <span className="bs-hours-big bs-num" aria-hidden="true">
                        {row.big}
                      </span>
                      <span className="bs-hours-text">
                        <span className="font-semibold">{row.days}</span>
                        <span className="bs-num">{row.label}</span>
                        <span className="bs-today">Today</span>
                      </span>
                    </li>
                  ))}
                </ul>
                <OpenStatus className="mt-5 sm:hidden" markToday />
                <div className="mt-8 flex flex-wrap gap-3">
                  <a href={`tel:${BUSINESS.tel}`} className="bs-btn bs-btn-ink">
                    Call <span className="bs-num">{BUSINESS.phone}</span>
                  </a>
                  <a href={`mailto:${BUSINESS.email}`} className="bs-btn bs-btn-line">
                    Email the office
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 04 · QUEM ATENDE */}
        <section
          id="people"
          aria-labelledby="bs-people-title"
          data-bs-circuit
          className="bs-sec bs-paper scroll-mt-14"
        >
          <Wire />
          <div className={`${wrap} py-16 lg:py-24`}>
            <CircuitHead id="people" aside={`Bright Spark since ${BUSINESS.founded}`} />
            <h2 id="bs-people-title" className="bs-h2 mt-8 max-w-[18ch] lg:mt-12" data-bs-rise>
              When you call, you talk to one of us.
            </h2>
            <div className="bs-people mt-12 lg:mt-16">
              <article data-bs-rise>
                <p className="bs-people-num bs-num" aria-hidden="true">
                  {BUSINESS.since}
                </p>
                <h3 className="bs-h3 mt-3">Marcus Bell</h3>
                <p className="bs-label mt-1">Owner, master electrician</p>
                <p className="mt-4 max-w-[42ch] text-[17px] leading-[1.6]">
                  Marcus has been wiring houses in the Valley since 2006 and started Bright Spark in
                  2014. For a panel upgrade he looks at the panel and meter first, writes the quote,
                  and walks you through every breaker before he leaves.
                </p>
              </article>
              <article data-bs-rise>
                <p className="bs-people-num bs-num" aria-hidden="true">
                  {BUSINESS.founded}
                </p>
                <h3 className="bs-h3 mt-3">Tasha Bell</h3>
                <p className="bs-label mt-1">Office and permits</p>
                <p className="mt-4 max-w-[42ch] text-[17px] leading-[1.6]">
                  Tasha runs the office, handles the city permits and schedules the inspection.
                </p>
                {omar ? (
                  <figure className="bs-quote-small mt-6">
                    <blockquote>
                      <p>&ldquo;{omar.quote}&rdquo;</p>
                    </blockquote>
                    <figcaption className="bs-label mt-3">
                      {omar.name}, {omar.city}
                    </figcaption>
                  </figure>
                ) : null}
              </article>
            </div>
            <ul className="bs-highlights mt-12 lg:mt-16" aria-label="From the owner">
              {HIGHLIGHTS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className="mt-14 grid gap-6 lg:mt-20 lg:grid-cols-12 lg:gap-10">
              <h3 className="bs-h3 lg:col-span-4">Straight answers</h3>
              <div className="bs-faq lg:col-span-8">
                {FAQ.map((item) => (
                  <details key={item.q}>
                    <summary className="bs-focus">
                      <span>{item.q}</span>
                      <span aria-hidden="true" className="bs-faq-switch">
                        <span />
                      </span>
                    </summary>
                    <p>{item.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 05 · PEDIDO DE ORÇAMENTO (demo) */}
        <section
          id="quote"
          aria-labelledby="bs-quote-title"
          data-bs-circuit
          className="bs-sec bs-paper-2 scroll-mt-14"
        >
          <Wire />
          <div className={`${wrap} py-16 lg:py-24`}>
            <CircuitHead id="quote" aside="Demo · nothing is sent" />
            <div className="mt-8 grid gap-10 lg:mt-12 lg:grid-cols-12 lg:gap-10">
              <div className="lg:col-span-4">
                <h2 id="bs-quote-title" className="bs-h2" data-bs-rise>
                  Ask for a written quote.
                </h2>
                <p className="mt-5 max-w-[38ch] text-[17px] leading-[1.6]">
                  Three short steps. Or skip the form and call: Marcus or Tasha picks up.
                </p>
                <dl className="bs-contact mt-8">
                  <div>
                    <dt>Call</dt>
                    <dd>
                      <a href={`tel:${BUSINESS.tel}`} className="bs-link bs-num">
                        {BUSINESS.phone}
                      </a>
                    </dd>
                  </div>
                  <div>
                    <dt>Text</dt>
                    <dd>
                      <a href={`sms:${BUSINESS.tel}`} className="bs-link bs-num">
                        {BUSINESS.phone}
                      </a>
                    </dd>
                  </div>
                  <div>
                    <dt>Email</dt>
                    <dd>
                      <a href={`mailto:${BUSINESS.email}`} className="bs-link break-all">
                        {BUSINESS.email}
                      </a>
                    </dd>
                  </div>
                  <div>
                    <dt>Hours</dt>
                    <dd>
                      Mon–Fri <span className="bs-num">7 AM – 5 PM</span>
                      <br />
                      Sat <span className="bs-num">8 AM – 12 PM</span>
                    </dd>
                  </div>
                </dl>
              </div>
              <div className="lg:col-span-8">
                <div className="bs-sheet">
                  <QuoteRequest />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bs-footer">
        <div className={`${wrap} pt-16 pb-10 lg:pt-24`}>
          <p className="bs-footer-mark" aria-hidden="true">
            Written quote first.
          </p>
          <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-4">
              <p className="flex items-center gap-2.5 text-[20px] font-bold">
                <Mark className="size-7" />
                {BUSINESS.name}
              </p>
              <p className="bs-on-ink-soft mt-3 max-w-[36ch] text-[15px] leading-[1.6]">
                {BUSINESS.category} in {BUSINESS.city}, {BUSINESS.state}. Licensed with the Arizona
                ROC, bonded and insured.
              </p>
            </div>
            <div className="lg:col-span-3">
              <h2 className="bs-label bs-on-ink-soft">Contact</h2>
              <p className="mt-3 text-[16px] leading-[1.8]">
                <a href={`tel:${BUSINESS.tel}`} className="bs-link bs-num">
                  {BUSINESS.phone}
                </a>
                <br />
                <a href={`mailto:${BUSINESS.email}`} className="bs-link break-all">
                  {BUSINESS.email}
                </a>
              </p>
            </div>
            <div className="lg:col-span-2">
              <h2 className="bs-label bs-on-ink-soft">Hours</h2>
              <p className="mt-3 text-[16px] leading-[1.8]">
                Mon–Fri <span className="bs-num">7–5</span>
                <br />
                Sat <span className="bs-num">8–12</span>
              </p>
            </div>
            <div className="lg:col-span-3">
              <h2 className="bs-label bs-on-ink-soft">Area</h2>
              <p className="mt-3 text-[16px] leading-[1.8]">{CITIES.join(", ")}</p>
            </div>
          </div>
          <div className="bs-footer-fine mt-14 grid gap-6 border-t pt-6 lg:grid-cols-12 lg:gap-10">
            <p className="lg:col-span-5">
              Bright Spark Electric, Marcus, Tasha and their customers are fictional. This page is a
              design demo by No Sweat: the 555 phone number and the email are not real, and the
              quote form sends nothing.
            </p>
            <p className="lg:col-span-7">
              Photos (example scenes, not Bright Spark jobs):{" "}
              {Object.values(PHOTOS).map((photo, i, list) => (
                <span key={photo.id}>
                  <Credit photo={photo} />
                  {i < list.length - 1 ? "; " : "."}
                </span>
              ))}
            </p>
          </div>
        </div>
      </footer>
      <div
        className="@container bs-badge"
        style={{ ["--nsb-bg" as string]: "#121211", ["--nsb-fg" as string]: "#f3f1ea" }}
      >
        <NoSweatBadge />
      </div>
      <BottomBar />
      <BrightMotion />
    </>
  );
}
