import { NoSweatBadge } from "@nosweat/templates";
import { Consult } from "@/components/demos/hollis/Consult";
import {
  BUSINESS,
  FAQ,
  PEOPLE,
  PROCESS,
  PROJECTS,
  QUOTES,
  SERVICES,
} from "@/components/demos/hollis/content";
import { HollisMotion } from "@/components/demos/hollis/HollisMotion";
import { PHOTOS } from "@/components/demos/hollis/photos";
import { RoomStage } from "@/components/demos/hollis/RoomStage";
import { TopBar } from "@/components/demos/hollis/TopBar";
import { Arrow, Caption, Credit, Photo, Tag } from "@/components/demos/hollis/ui";

// Hollis Interiors (demonstração, estúdio de interiores fictício de East Nashville). Direção
// escolhida: "Room by Room" — arquétipo quiet-luxury; composição pinned-stage (um quadro preso em
// que o cômodo troca com a rolagem, com um índice pequeno) aberta por um topo split-editorial;
// um grotesco só (Host Grotesk), letra pequena e precisa; hierarquia por índice (cômodos 01–05,
// serviços 00–04, etapas 01–05); fotos emolduradas com legenda de catálogo; barra fina no topo;
// movimento cinemático lento (dissolução, câmera que anda, moldura que abre); um papel claro
// (gesso) e um bloco nogueira no fim. Ordem: topo → 01 cômodos → 02 serviços e taxas → 03 processo
// → 04 estúdio → 05 consulta (demonstração) → 06 visita (bloco escuro) → rodapé → selo.
// Ver docs/design/demos/hollis-interiors.md.

const consult = SERVICES[0]!;

export default function HollisPage() {
  return (
    <>
      <a href="#main" className="h-focus h-btn h-skip">
        Skip to content
      </a>
      <TopBar />
      <main id="main">
        {/* TOPO — split-editorial: texto pequeno à esquerda, um quadro com ar em volta à direita */}
        <section
          id="top"
          aria-labelledby="h-title"
          data-h-hero=""
          className="h-hero relative overflow-hidden pt-16"
        >
          <div className="h-wrap grid gap-x-6 gap-y-10 pt-10 pb-14 lg:min-h-[calc(100svh-4rem)] lg:grid-cols-12 lg:pt-12 lg:pb-12">
            <div data-h-hero-text="" className="flex flex-col lg:col-span-5 lg:pb-2">
              <p className="h-tag h-in" style={{ ["--d" as string]: "0.1s" }}>
                Interior design studio · {BUSINESS.neighborhood}, {BUSINESS.city}
              </p>
              <div className="lg:my-auto">
                <h1
                  id="h-title"
                  className="h-h1 h-in mt-8 lg:mt-0"
                  style={{ ["--d" as string]: "0.25s" }}
                >
                  Interior design for Nashville homes, room by room.
                </h1>
                <p
                  className="h-in mt-6 max-w-[42ch] text-[16px] leading-[1.65] text-[var(--h-muted)] lg:text-[17px]"
                  style={{ ["--d" as string]: "0.45s" }}
                >
                  Claire Hollis designs full homes, kitchens and baths from a studio on Woodland
                  Street in East Nashville. {BUSINESS.perYear}.
                </p>
                <div
                  className="h-in mt-8 flex flex-wrap items-center gap-x-7 gap-y-4"
                  style={{ ["--d" as string]: "0.6s" }}
                >
                  <a href="#consult" className="h-focus h-btn">
                    Book a consultation <Arrow />
                  </a>
                  <a href={BUSINESS.phoneHref} className="h-focus h-link text-[15px] tabular-nums">
                    {BUSINESS.phone}
                  </a>
                </div>
                <p
                  className="h-in mt-4 text-[13px] text-[var(--h-muted)] tabular-nums"
                  style={{ ["--d" as string]: "0.7s" }}
                >
                  {consult.price} · {consult.time} at your home · flat design fee after
                </p>
              </div>
              <dl
                className="h-in mt-12 grid grid-cols-3 gap-4 border-t border-[var(--h-line)] pt-4 text-[13px] leading-[1.5] lg:mt-10"
                style={{ ["--d" as string]: "0.85s" }}
              >
                <div>
                  <dt className="text-[var(--h-muted)]">Studio</dt>
                  <dd className="mt-1">{BUSINESS.street}</dd>
                </div>
                <div>
                  <dt className="text-[var(--h-muted)]">Working in</dt>
                  <dd className="mt-1">Nashville, Franklin, Brentwood</dd>
                </div>
                <div>
                  <dt className="text-[var(--h-muted)]">Opened</dt>
                  <dd className="mt-1 tabular-nums">{BUSINESS.opened}</dd>
                </div>
              </dl>
            </div>

            <figure className="lg:col-span-6 lg:col-start-7 lg:flex lg:flex-col lg:justify-end">
              <div className="h-hero-frame relative overflow-hidden">
                <div data-h-hero-photo="" className="absolute inset-[-6%_0]">
                  <Photo
                    photo={PHOTOS.doorway}
                    sizes="(min-width: 1024px) 48vw, 100vw"
                    priority
                    className="h-hero-img size-full object-cover object-[46%_50%]"
                  />
                </div>
              </div>
              <Caption
                left={
                  <>
                    Through the door · <span className="text-[var(--h-muted)]">Example room</span>
                  </>
                }
                right={<Credit photo={PHOTOS.doorway} />}
              />
            </figure>
          </div>
        </section>

        <RoomStage />

        {/* 02 SERVIÇOS E TAXAS — índice numerado, fios, preços em algarismos tabulares */}
        <section id="services" aria-labelledby="services-title" className="h-section">
          <div className="h-wrap grid gap-x-6 gap-y-12 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <div className="lg:sticky lg:top-28">
                <Tag n="02">Services and fees</Tag>
                <h2 id="services-title" data-h-rise="" className="h-h2 mt-5 max-w-[14ch]">
                  Flat design fees, quoted before we start.
                </h2>
                <p
                  data-h-rise=""
                  className="mt-5 max-w-[36ch] text-[15px] leading-[1.65] text-[var(--h-muted)]"
                >
                  Every project starts with the in-home consultation. Afterward we send a flat quote
                  for the design, so you know the number up front.
                </p>
                <p
                  data-h-rise=""
                  className="mt-4 max-w-[36ch] text-[15px] leading-[1.65] text-[var(--h-muted)]"
                >
                  Furniture and fixtures are ordered at our trade price and passed to you at cost
                  plus 15%.
                </p>
              </div>
            </div>
            <div className="lg:col-span-8">
              <ol className="border-t border-[var(--h-ink)]">
                {SERVICES.map((service, index) => {
                  const newGroup = index === 0 || SERVICES[index - 1]!.group !== service.group;
                  return (
                    <li key={service.id} data-h-rise="">
                      {newGroup && <p className="h-tag pt-6 pb-1">{service.group}</p>}
                      <div className="h-service grid grid-cols-[2.5rem_1fr_auto] gap-x-4 gap-y-2 border-b border-[var(--h-line)] py-6 sm:grid-cols-[3rem_1fr_9rem_8rem] sm:gap-x-6">
                        <span className="h-tag pt-1.5 tabular-nums">{service.n}</span>
                        <div>
                          <h3 className="text-[20px] leading-[1.25] lg:text-[22px]">
                            {service.name}
                          </h3>
                          <p className="mt-2 max-w-[48ch] text-[14.5px] leading-[1.6] text-[var(--h-muted)]">
                            {service.description}
                          </p>
                        </div>
                        <p className="col-start-2 text-[14px] text-[var(--h-muted)] sm:col-start-3 sm:row-start-1 sm:pt-1.5">
                          {service.time}
                        </p>
                        <p className="col-start-3 row-start-1 text-right text-[16px] tabular-nums sm:col-start-4 sm:pt-1 lg:text-[17px]">
                          {service.price}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
              <dl className="mt-14 grid gap-x-10 gap-y-7 sm:grid-cols-2">
                {FAQ.map((item) => (
                  <div key={item.q} data-h-rise="">
                    <dt className="text-[15px]">{item.q}</dt>
                    <dd className="mt-2 text-[14.5px] leading-[1.6] text-[var(--h-muted)]">
                      {item.a}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        {/* Pausa: uma foto larga com muito ar, sem texto em cima */}
        <section aria-label="Interlude" className="pb-6">
          <figure className="h-wrap">
            <div data-h-frame="" className="h-interlude relative overflow-hidden">
              <div data-h-drift="0.1" className="absolute inset-[-8%_0]">
                <Photo
                  photo={PHOTOS.dining}
                  sizes="100vw"
                  className="size-full object-cover object-[50%_62%]"
                />
              </div>
            </div>
            <Caption
              left={
                <>
                  Kitchen and dining · <span className="text-[var(--h-muted)]">Example room</span>
                </>
              }
              right={<Credit photo={PHOTOS.dining} />}
            />
          </figure>
        </section>

        {/* 03 PROCESSO — cinco etapas da fixture, quem cuida de cada uma */}
        <section id="process" aria-labelledby="process-title" className="h-section">
          <div className="h-wrap grid gap-x-6 gap-y-12 lg:grid-cols-12">
            <figure className="order-2 lg:order-none lg:col-span-4">
              <div className="lg:sticky lg:top-28">
                <div data-h-frame="" className="relative aspect-[4/5] overflow-hidden">
                  <Photo
                    photo={PHOTOS.swatches}
                    sizes="(min-width: 1024px) 30vw, 100vw"
                    className="size-full object-cover object-[50%_45%]"
                  />
                </div>
                <Caption
                  left={<span className="text-[var(--h-muted)]">Example image</span>}
                  right={<Credit photo={PHOTOS.swatches} />}
                />
              </div>
            </figure>
            <div className="lg:col-span-7 lg:col-start-6">
              <Tag n="03">Process</Tag>
              <h2 id="process-title" data-h-rise="" className="h-h2 mt-5 max-w-[18ch]">
                From the first visit to install day.
              </h2>
              <p
                data-h-rise=""
                className="mt-5 max-w-[46ch] text-[15px] leading-[1.65] text-[var(--h-muted)]"
              >
                Claire designs. Jess Tran, the project manager, runs the contractors, the orders and
                install day.
              </p>
              <div className="relative mt-12">
                <span
                  aria-hidden="true"
                  data-h-progress=""
                  className="absolute top-0 bottom-0 left-0 w-px origin-top bg-[var(--h-walnut)] max-sm:hidden"
                />
                <ol className="border-t border-[var(--h-line)] sm:pl-8">
                  {PROCESS.map((step) => (
                    <li
                      key={step.n}
                      data-h-rise=""
                      className="grid grid-cols-[2.5rem_1fr] gap-x-4 gap-y-2 border-b border-[var(--h-line)] py-7 sm:grid-cols-[3rem_11rem_1fr] sm:gap-x-6"
                    >
                      <span className="h-tag pt-1.5 tabular-nums">{step.n}</span>
                      <div>
                        <h3 className="text-[20px] leading-[1.25]">{step.title}</h3>
                        <p className="mt-1 text-[13px] text-[var(--h-muted)]">{step.who}</p>
                      </div>
                      <p className="col-start-2 max-w-[44ch] text-[15px] leading-[1.6] sm:col-start-auto sm:pt-1">
                        {step.body}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </section>

        {/* 04 ESTÚDIO — as duas pessoas da fixture, as duas frases de clientes, projetos recentes */}
        <section id="studio" aria-labelledby="studio-title" className="h-section h-stone">
          <div className="h-wrap">
            <div className="grid gap-x-6 gap-y-10 lg:grid-cols-12">
              <div className="lg:col-span-5">
                <Tag n="04">The studio</Tag>
                <h2 id="studio-title" data-h-rise="" className="h-h2 mt-5 max-w-[16ch]">
                  A studio on Woodland Street, since {BUSINESS.opened}.
                </h2>
              </div>
              <ul className="lg:col-span-7">
                {PEOPLE.map((person) => (
                  <li
                    key={person.name}
                    data-h-rise=""
                    className="grid gap-x-6 gap-y-1 border-t border-[var(--h-line)] py-6 sm:grid-cols-[1fr_1.2fr]"
                  >
                    <div>
                      <h3 className="text-[26px] leading-[1.15] font-light lg:text-[30px]">
                        {person.name}
                      </h3>
                      <p className="mt-1 text-[14px] text-[var(--h-muted)]">{person.role}</p>
                    </div>
                    <p className="text-[15px] leading-[1.6] sm:pt-2">{person.note}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-20 grid gap-x-6 gap-y-12 lg:grid-cols-12">
              {QUOTES.map((item, index) => (
                <figure
                  key={item.author}
                  data-h-rise=""
                  className={
                    index === 0 ? "lg:col-span-5" : "lg:col-span-5 lg:col-start-8 lg:mt-24"
                  }
                >
                  <blockquote className="h-quote">
                    <p>“{item.quote}”</p>
                  </blockquote>
                  <figcaption className="mt-5 text-[13px] text-[var(--h-muted)]">
                    {item.author}, {item.place}
                  </figcaption>
                </figure>
              ))}
            </div>

            <div className="mt-20 grid gap-x-6 gap-y-10 lg:grid-cols-12">
              <figure className="lg:col-span-3">
                <div data-h-frame="" className="relative aspect-[3/4] overflow-hidden">
                  <Photo
                    photo={PHOTOS.plinth}
                    sizes="(min-width: 1024px) 22vw, 60vw"
                    className="size-full object-cover"
                  />
                </div>
                <Caption
                  left={<span className="text-[var(--h-muted)]">Example image</span>}
                  right={<Credit photo={PHOTOS.plinth} prefix="" />}
                />
              </figure>
              <div className="lg:col-span-8 lg:col-start-5">
                <h3 className="h-tag">Recent projects</h3>
                <ol className="mt-4 border-t border-[var(--h-ink)]">
                  {PROJECTS.map((project, index) => (
                    <li
                      key={project.name}
                      data-h-rise=""
                      className="grid grid-cols-[2.5rem_1fr_auto] items-baseline gap-x-4 border-b border-[var(--h-line)] py-5 sm:grid-cols-[3rem_1fr_1fr_4rem]"
                    >
                      <span className="h-tag tabular-nums">0{index + 1}</span>
                      <span className="text-[18px] lg:text-[20px]">{project.name}</span>
                      <span className="col-start-2 text-[14px] text-[var(--h-muted)] sm:col-start-3 sm:row-start-1">
                        {project.place}
                      </span>
                      <span className="col-start-3 row-start-1 text-right text-[14px] tabular-nums sm:col-start-4">
                        {project.year}
                      </span>
                    </li>
                  ))}
                </ol>
                <p className="mt-4 text-[13px] text-[var(--h-muted)]">
                  Listed by name only: this demonstration shows no photographs of these projects.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 05 CONSULTA — pedido de demonstração em três passos */}
        <section id="consult" aria-labelledby="consult-title" className="h-section h-paper">
          <div className="h-wrap grid gap-x-6 gap-y-12 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <Tag n="05">Consultation</Tag>
              <h2 id="consult-title" data-h-rise="" className="h-h2 mt-5 max-w-[14ch]">
                Book a consultation.
              </h2>
              <p
                data-h-rise=""
                className="mt-5 max-w-[34ch] text-[15px] leading-[1.65] text-[var(--h-muted)]"
              >
                Two hours in your house, {consult.price}. Tell us a little first; it takes a minute.
              </p>
              <figure className="mt-10 hidden lg:block">
                <div data-h-frame="" className="relative aspect-[4/5] overflow-hidden">
                  <Photo
                    photo={PHOTOS.linen}
                    sizes="30vw"
                    alt=""
                    className="size-full object-cover object-[40%_50%]"
                  />
                </div>
                <Caption
                  left={<span className="text-[var(--h-muted)]">Example image</span>}
                  right={<Credit photo={PHOTOS.linen} prefix="" />}
                />
              </figure>
            </div>
            <div className="lg:col-span-8">
              <Consult />
            </div>
          </div>
        </section>

        {/* 06 VISITA — o "balcão": endereço, área, horário e contato num bloco nogueira */}
        <section id="visit" aria-labelledby="visit-title" className="h-umber">
          <div className="h-wrap grid gap-x-6 gap-y-12 py-20 lg:grid-cols-12 lg:py-28">
            <div className="lg:col-span-5">
              <Tag n="06" className="text-[var(--h-umber-muted)]">
                Visit
              </Tag>
              <h2 id="visit-title" className="h-h2 mt-5 max-w-[14ch]">
                Studio visits by appointment.
              </h2>
              <a href={BUSINESS.phoneHref} className="h-focus h-call mt-10">
                <span className="h-tag text-[var(--h-umber-muted)]">Call the studio</span>
                <span className="mt-2 block text-[clamp(1.9rem,3.6vw,3rem)] font-light tabular-nums">
                  {BUSINESS.phone}
                </span>
              </a>
            </div>
            <dl className="grid gap-x-10 gap-y-8 text-[15px] leading-[1.6] sm:grid-cols-2 lg:col-span-6 lg:col-start-7 lg:pt-14">
              <div>
                <dt className="h-tag text-[var(--h-umber-muted)]">Address</dt>
                <dd className="mt-2">
                  {BUSINESS.street}
                  <br />
                  {BUSINESS.neighborhood}, {BUSINESS.city}
                </dd>
              </div>
              <div>
                <dt className="h-tag text-[var(--h-umber-muted)]">Hours</dt>
                <dd className="mt-2">{BUSINESS.hours}</dd>
              </div>
              <div>
                <dt className="h-tag text-[var(--h-umber-muted)]">Where we work</dt>
                <dd className="mt-2">
                  Full projects in {BUSINESS.area}. {BUSINESS.remote}
                </dd>
              </div>
              <div>
                <dt className="h-tag text-[var(--h-umber-muted)]">Write</dt>
                <dd className="mt-2">
                  <a href={`mailto:${BUSINESS.email}`} className="h-link h-focus break-all">
                    {BUSINESS.email}
                  </a>
                  <br />
                  <span className="text-[var(--h-umber-muted)]">
                    Online booking: {BUSINESS.booking}
                  </span>
                </dd>
              </div>
            </dl>
          </div>
        </section>
      </main>

      <footer id="h-footer" className="h-umber">
        <div className="h-wrap grid gap-x-6 gap-y-10 border-t border-[var(--h-umber-line)] py-14 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="h-wordmark">Hollis Interiors</p>
            <p className="mt-3 text-[13px] leading-[1.6] text-[var(--h-umber-muted)]">
              {BUSINESS.street}, {BUSINESS.neighborhood}
              <br />
              <a href={BUSINESS.phoneHref} className="h-link h-focus tabular-nums">
                {BUSINESS.phone}
              </a>
            </p>
          </div>
          <div className="lg:col-span-4">
            <p className="h-tag text-[var(--h-umber-muted)]">About this site</p>
            <p className="mt-3 max-w-[52ch] text-[13px] leading-[1.65] text-[var(--h-umber-muted)]">
              Hollis Interiors, its people, the clients quoted and the projects listed are
              fictional. This is a design demonstration by{" "}
              <a
                href="https://www.nosweatfd.com/"
                className="h-link h-focus text-[var(--h-plaster)]"
              >
                No Sweat
              </a>
              . The consultation form does not send or store anything. The rooms are stock
              photographs shown as examples, not Hollis projects; the palettes are sampled from
              them.
            </p>
          </div>
          <div className="lg:col-span-4">
            <p className="h-tag text-[var(--h-umber-muted)]">Photography (Unsplash)</p>
            <ul className="mt-3 grid gap-y-1 text-[13px] text-[var(--h-umber-muted)] sm:grid-cols-2 sm:gap-x-6 lg:grid-cols-1">
              {Object.values(PHOTOS).map((photo) => (
                <li key={photo.id}>
                  <Credit photo={photo} prefix="" />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </footer>
      {/* Selo da No Sweat: último elemento da página, na cor do bloco nogueira do rodapé. */}
      <div
        className="@container h-umber"
        style={{ ["--nsb-bg" as string]: "#2b2622", ["--nsb-fg" as string]: "#f1efea" }}
      >
        <NoSweatBadge />
      </div>
      <HollisMotion />
    </>
  );
}
