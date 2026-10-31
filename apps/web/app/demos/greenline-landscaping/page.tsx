import { NoSweatBadge } from "@nosweat/templates";
import { AreaMap } from "@/components/demos/greenline/AreaMap";
import {
  BUSINESS,
  GOOD_TO_KNOW,
  HOURS,
  PEOPLE,
  QUOTES,
  SERVICE_GROUPS,
  TOWNS,
} from "@/components/demos/greenline/content";
import { GreenlineMotion } from "@/components/demos/greenline/GreenlineMotion";
import { NowInYard } from "@/components/demos/greenline/NowInYard";
import { PHOTOS } from "@/components/demos/greenline/photos";
import { QuoteFlow } from "@/components/demos/greenline/QuoteFlow";
import { TopBar } from "@/components/demos/greenline/TopBar";
import { Arrow, Credit, NorthArrow, Photo, Wordmark } from "@/components/demos/greenline/ui";
import { YearInYard } from "@/components/demos/greenline/YearInYard";

// Greenline Landscaping (demonstração, paisagista fictício de Charlotte). Direção escolhida:
// "Yard Almanac" — arquétipo organic-naturalist, colagem de fotos em 2–3 escalas sobre UM papel
// de aveia (cores tiradas das fotos: verde-pinho, barro vermelho, palha), serifa de estilo antigo
// macia (Fraunces) + sans humanista (Source Sans 3), movimento quieto. Assinatura: "o ano no
// quintal", um calendário de 12 meses com o que a equipe faz em cada estação. Ordem: topo
// (colagem) → 01 serviços e preços → faixa da irrigação → 02 o ano no quintal → 03 quem vem →
// 04 área e horário → 05 pedido de orçamento (demonstração) → rodapé com créditos e o selo.
// Ver docs/design/demos/greenline-landscaping.md.

const wrap = "mx-auto w-full max-w-[1440px] px-4 sm:px-8 lg:px-10";

function SectionLabel({ n, children }: { n: string; children: string }) {
  return (
    <p className="g-caps flex items-center gap-3 text-[12px] text-[var(--g-clay-ink)]">
      <span className="tabular-nums">{n}</span>
      <span aria-hidden="true" className="h-px w-10 bg-current" />
      {children}
    </p>
  );
}

export default function GreenlinePage() {
  const [jenna, robert] = QUOTES;
  return (
    <>
      <a
        href="#main"
        className="g-focus g-btn fixed top-3 left-3 z-50 -translate-y-24 rounded-full px-5 py-3 text-[15px] font-semibold focus:translate-y-0"
      >
        Skip to content
      </a>
      <TopBar />
      <main id="main">
        {/* TOPO — colagem: foto grande sangrando à direita, recorte menor por cima da borda */}
        <section
          id="top"
          aria-labelledby="g-title"
          className="relative pt-16 lg:min-h-[max(100svh,780px)] lg:pt-[72px]"
        >
          <div className="relative h-[50svh] min-h-[300px] lg:absolute lg:top-[72px] lg:right-0 lg:bottom-28 lg:h-auto lg:w-[54vw]">
            <div className="g-hero-photo absolute inset-0 overflow-hidden">
              <Photo
                photo={PHOTOS.yard}
                sizes="(min-width: 1024px) 54vw, 100vw"
                priority
                className="size-full object-cover object-[50%_60%]"
              />
            </div>
            <NorthArrow className="g-hero-in absolute top-5 right-5 h-12 w-7 text-white/90 lg:top-8 lg:right-8 lg:h-16 lg:w-9" />
            <NowInYard className="absolute top-4 left-4 max-w-[64%] lg:top-auto lg:right-8 lg:bottom-8 lg:left-auto lg:max-w-[300px]" />
            <div
              data-g-drift="0.05"
              className="g-hero-cut absolute right-4 -bottom-12 w-[36%] max-w-[240px] lg:right-auto lg:-bottom-16 lg:-left-16 lg:w-[17vw] lg:max-w-[300px]"
            >
              <div className="g-cutout">
                <Photo
                  photo={PHOTOS.trimmer}
                  sizes="(min-width: 1024px) 17vw, 36vw"
                  ratio={0.8}
                  priority
                  className="aspect-[4/5] w-full object-cover"
                />
              </div>
            </div>
          </div>

          <div className={`${wrap} relative pt-8 pb-20 lg:pt-[9vh] lg:pb-16`}>
            <div className="lg:w-[41%]">
              <p className="g-caps g-hero-in max-w-[60%] text-[12px] text-[var(--g-ink)]/80 lg:max-w-none">
                Lawn care &amp; landscaping · {BUSINESS.city}
              </p>
              <h1
                id="g-title"
                className="g-display g-hero-title mt-5 text-[clamp(2.9rem,5.4vw,5.6rem)] leading-[0.98] tracking-[-0.02em] text-[var(--g-ink)]"
              >
                Every yard, planned around <em className="g-em">red clay</em> and a dry July.
              </h1>
              <p className="g-hero-in mt-7 max-w-[44ch] text-[18px] leading-[1.6] text-[var(--g-ink)]/85">
                Charlotte lawns fight clay, summer drought and fescue that browns out by July. Andre
                and Kevin Simmons plan every yard around that, and weekly mowing comes with the same
                crew every week.
              </p>
              <div className="g-hero-in mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
                <a
                  href="#quote"
                  className="g-btn g-focus inline-flex h-13 items-center gap-3 rounded-full px-7 text-[16px] font-semibold"
                >
                  Get a yard quote <Arrow className="w-4" />
                </a>
                <a
                  href={BUSINESS.phoneHref}
                  className="g-link g-focus text-[16px] font-semibold text-[var(--g-ink)] tabular-nums"
                >
                  Call {BUSINESS.phone}
                </a>
              </div>
              <dl className="g-hero-in mt-12 grid grid-cols-3 gap-4 border-t border-[var(--g-ink)]/15 pt-5 lg:mt-14">
                <div>
                  <dt className="text-[13px] text-[var(--g-ink)]/75">Weekly mowing</dt>
                  <dd className="g-display mt-1 text-[clamp(1.35rem,2vw,1.9rem)] leading-tight text-[var(--g-ink)] tabular-nums">
                    from $45
                  </dd>
                </div>
                <div>
                  <dt className="text-[13px] text-[var(--g-ink)]/75">Contracts</dt>
                  <dd className="g-display mt-1 text-[clamp(1.35rem,2vw,1.9rem)] leading-tight text-[var(--g-ink)]">
                    none
                  </dd>
                </div>
                <div>
                  <dt className="text-[13px] text-[var(--g-ink)]/75">Mon–Fri · Sat</dt>
                  <dd className="g-display mt-1 text-[clamp(1.35rem,2vw,1.9rem)] leading-tight text-[var(--g-ink)] tabular-nums">
                    7–6 · 8–1
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        {/* 01. SERVIÇOS E PREÇOS — lista com preços à direita, colagem presa à esquerda */}
        <section
          id="services"
          aria-labelledby="services-title"
          className="scroll-mt-20 py-24 lg:py-36"
        >
          <div className={`${wrap} grid gap-14 lg:grid-cols-12 lg:gap-10`}>
            <div className="lg:col-span-5">
              <div className="lg:sticky lg:top-28">
                <SectionLabel n="01">Services &amp; prices</SectionLabel>
                <h2
                  id="services-title"
                  data-g-rise
                  className="g-display mt-6 text-[clamp(2.4rem,4.4vw,4.4rem)] leading-[1] tracking-[-0.015em] text-[var(--g-ink)]"
                >
                  What the crew does, <em className="g-em">and what it costs</em>
                </h2>
                <div className="relative mt-12 hidden pr-[18%] pb-14 lg:block">
                  <div data-g-drift="0.03" className="overflow-hidden">
                    <Photo
                      photo={PHOTOS.shadows}
                      sizes="32vw"
                      ratio={1.05}
                      className="aspect-[1.05] w-full object-cover"
                    />
                  </div>
                  <div data-g-drift="0.09" className="absolute right-0 bottom-0 w-[46%]">
                    <div className="g-cutout">
                      <Photo
                        photo={PHOTOS.pruners}
                        sizes="16vw"
                        ratio={0.8}
                        className="aspect-[4/5] w-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              {SERVICE_GROUPS.map((group, groupIndex) => (
                <div key={group.title} className={groupIndex ? "mt-14" : ""}>
                  <h3 className="g-caps text-[12px] text-[var(--g-ink)]/80">{group.title}</h3>
                  <ul className="mt-4 border-t border-[var(--g-ink)]/20">
                    {group.items.map((item) => (
                      <li
                        key={item.id}
                        data-g-rise
                        className="grid gap-x-8 gap-y-2 border-b border-[var(--g-ink)]/15 py-6 sm:grid-cols-[1fr_auto]"
                      >
                        <div>
                          <p className="g-display text-[clamp(1.5rem,2.2vw,2rem)] leading-tight text-[var(--g-ink)]">
                            {item.name}
                          </p>
                          <p className="mt-2 max-w-[56ch] text-[17px] leading-[1.6] text-[var(--g-ink)]/80">
                            {item.body}
                          </p>
                          {item.when && (
                            <p className="mt-3 text-[14px] font-semibold text-[var(--g-pine)]">
                              {item.when}
                            </p>
                          )}
                        </div>
                        <p className="text-[17px] font-semibold text-[var(--g-ink)] tabular-nums sm:pt-2 sm:text-right">
                          {item.price ?? <span className="text-[var(--g-ink)]/75">Quoted</span>}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              <div className="mt-16 rounded-[18px] bg-[var(--g-paper-2)] p-6 sm:p-8">
                <h3 className="g-display text-[26px] text-[var(--g-ink)]">Good to know</h3>
                <dl className="mt-5 grid gap-x-10 gap-y-5 sm:grid-cols-2">
                  {GOOD_TO_KNOW.map((item) => (
                    <div key={item.q}>
                      <dt className="text-[15px] font-semibold text-[var(--g-ink)]">{item.q}</dt>
                      <dd className="mt-1 text-[16px] leading-[1.55] text-[var(--g-ink)]/80">
                        {item.a}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </div>
        </section>

        {/* FAIXA — irrigação: foto de ponta a ponta + um cartão de papel por cima da borda */}
        <section aria-labelledby="water-title" className="relative">
          <div
            data-g-band
            className="relative h-[62svh] min-h-[380px] overflow-hidden lg:h-[86svh] lg:min-h-[560px]"
          >
            <Photo
              photo={PHOTOS.golden}
              sizes="100vw"
              className="size-full object-cover object-[50%_65%]"
            />
          </div>
          <div
            className={`${wrap} relative -mt-24 grid gap-12 lg:-mt-48 lg:grid-cols-12 lg:gap-10`}
          >
            <div
              data-g-rise
              className="g-paper-card rounded-[18px] p-6 sm:p-10 lg:col-span-6 lg:col-start-2"
            >
              <p className="g-caps text-[12px] text-[var(--g-clay-ink)]">Irrigation</p>
              <h2
                id="water-title"
                className="g-display mt-4 text-[clamp(1.9rem,3.2vw,3rem)] leading-[1.05] text-[var(--g-ink)]"
              >
                Andre Simmons is a North Carolina <em className="g-em">licensed irrigation</em>{" "}
                contractor.
              </h2>
              <p className="mt-4 text-[17px] leading-[1.6] text-[var(--g-ink)]/80">
                Spring start-ups and repairs from $85: broken heads, leaking valves and zones that
                stopped running.
              </p>
            </div>
            {robert && (
              <figure
                data-g-rise
                className="lg:col-span-4 lg:col-start-8 lg:self-start lg:pt-[15rem]"
              >
                <blockquote className="g-display text-[clamp(1.5rem,2.2vw,2rem)] leading-[1.3] text-[var(--g-ink)] italic">
                  “{robert.quote}”
                </blockquote>
                <figcaption className="mt-4 text-[14px] text-[var(--g-ink)]/75">
                  {robert.author}, {robert.place} · shared with permission
                </figcaption>
              </figure>
            )}
          </div>
        </section>

        {/* 02. O ANO NO QUINTAL — a assinatura */}
        <section
          id="year"
          aria-labelledby="year-title"
          className="scroll-mt-20 pt-24 pb-24 lg:pt-36 lg:pb-32"
        >
          <div className={wrap}>
            <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
              <div className="lg:col-span-7">
                <SectionLabel n="02">The year in the yard</SectionLabel>
                <h2
                  id="year-title"
                  data-g-rise
                  className="g-display mt-6 text-[clamp(2.4rem,4.6vw,4.6rem)] leading-[1] tracking-[-0.015em] text-[var(--g-ink)]"
                >
                  A Charlotte yard, <em className="g-em">season by season</em>
                </h2>
              </div>
              <p className="max-w-[44ch] text-[17px] leading-[1.6] text-[var(--g-ink)]/80 lg:col-span-4 lg:col-start-9">
                Weekly mowing runs March through November. Everything else follows the calendar:
                fescue in the fall, Bermuda and zoysia in late spring, leaves when they come down.
              </p>
            </div>
            <div className="mt-12 lg:mt-16">
              <YearInYard />
            </div>
          </div>
        </section>

        {/* 03. QUEM VEM — a história curta e as três pessoas, com uma citação e uma foto */}
        <section
          id="people"
          aria-labelledby="people-title"
          className="scroll-mt-20 border-t border-[var(--g-ink)]/15 py-24 lg:py-32"
        >
          <div className={`${wrap} grid gap-14 lg:grid-cols-12 lg:gap-10`}>
            <div className="lg:col-span-6">
              <SectionLabel n="03">Who comes to your yard</SectionLabel>
              <h2
                id="people-title"
                data-g-rise
                className="g-display mt-6 text-[clamp(2.3rem,4.2vw,4.2rem)] leading-[1.02] tracking-[-0.015em] text-[var(--g-ink)]"
              >
                Started in {BUSINESS.founded} with <em className="g-em">one mower</em> and a
                borrowed trailer.
              </h2>
              <p className="mt-7 max-w-[54ch] text-[18px] leading-[1.65] text-[var(--g-ink)]/85">
                Two brothers split the work: Andre handles the water side, Kevin draws the designs
                and runs the install crew. Brenda Ortiz keeps the schedule and the billing. You
                don&apos;t need to be home, just leave the gate unlocked.
              </p>
              <ul className="mt-12 border-t border-[var(--g-ink)]/20">
                {PEOPLE.map((person) => (
                  <li
                    key={person.name}
                    data-g-rise
                    className="grid gap-1 border-b border-[var(--g-ink)]/15 py-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] sm:gap-6"
                  >
                    <p className="g-display text-[26px] leading-tight text-[var(--g-ink)]">
                      {person.name}
                    </p>
                    <p className="text-[16px] leading-[1.5] text-[var(--g-ink)]/80">
                      <span className="block font-semibold text-[var(--g-ink)]">{person.role}</span>
                      {person.note}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
            <div className="lg:col-span-5 lg:col-start-8 lg:pt-20">
              <div className="relative pl-[10%] sm:pl-[24%] lg:pl-[16%]">
                <div data-g-drift="0.04" className="overflow-hidden">
                  <Photo
                    photo={PHOTOS.fence}
                    sizes="(min-width: 1024px) 34vw, 80vw"
                    ratio={0.8}
                    className="aspect-[4/5] w-full object-cover"
                  />
                </div>
              </div>
              {jenna && (
                <figure data-g-rise className="mt-10 lg:pl-[16%]">
                  <blockquote className="g-display text-[clamp(1.5rem,2.2vw,2rem)] leading-[1.3] text-[var(--g-ink)] italic">
                    “{jenna.quote}”
                  </blockquote>
                  <figcaption className="mt-4 text-[14px] text-[var(--g-ink)]/75">
                    {jenna.author}, {jenna.place} · shared with permission
                  </figcaption>
                </figure>
              )}
            </div>
          </div>
        </section>

        {/* 04. ÁREA E HORÁRIO — esquema da região + horário em tabela */}
        <section
          id="area"
          aria-labelledby="area-title"
          className="scroll-mt-20 border-t border-[var(--g-ink)]/15 py-20 lg:py-28"
        >
          <div className={`${wrap} grid gap-12 lg:grid-cols-12 lg:items-center lg:gap-10`}>
            <div className="lg:col-span-5 lg:order-2 lg:col-start-8">
              <SectionLabel n="04">Area &amp; hours</SectionLabel>
              <h2
                id="area-title"
                data-g-rise
                className="g-display mt-6 text-[clamp(2.3rem,4.2vw,4.2rem)] leading-[1] tracking-[-0.015em] text-[var(--g-ink)]"
              >
                Where we mow, <em className="g-em">and when</em>
              </h2>
              <p className="mt-6 max-w-[46ch] text-[17px] leading-[1.6] text-[var(--g-ink)]/80">
                Greenline works in {TOWNS.slice(0, -1).join(", ")} and {TOWNS.at(-1)}.
              </p>
              <dl className="mt-10 border-t border-[var(--g-ink)]/20">
                {HOURS.map((row) => (
                  <div
                    key={row.days}
                    className="flex items-baseline justify-between gap-6 border-b border-[var(--g-ink)]/15 py-4"
                  >
                    <dt className="text-[17px] text-[var(--g-ink)]">
                      <abbr title={row.label} className="no-underline">
                        {row.days}
                      </abbr>
                    </dt>
                    <dd className="g-display text-[24px] text-[var(--g-ink)] tabular-nums">
                      {row.time}
                    </dd>
                  </div>
                ))}
              </dl>
              <ul className="mt-8 space-y-2 text-[17px]">
                <li>
                  <a
                    href={BUSINESS.phoneHref}
                    className="g-link g-focus font-semibold text-[var(--g-ink)] tabular-nums"
                  >
                    {BUSINESS.phone}
                  </a>
                </li>
                <li>
                  <a
                    href={`mailto:${BUSINESS.email}`}
                    className="g-link g-focus text-[var(--g-ink)]"
                  >
                    {BUSINESS.email}
                  </a>
                </li>
                <li>
                  <a
                    href={BUSINESS.instagram}
                    className="g-link g-focus text-[var(--g-ink)]"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Instagram
                  </a>
                </li>
              </ul>
            </div>
            <div className="mx-auto w-full max-w-[620px] lg:order-1 lg:col-span-6 lg:max-w-none">
              <AreaMap />
            </div>
          </div>
        </section>

        {/* 05. PEDIDO DE ORÇAMENTO — quatro passos (demonstração) */}
        <section id="quote" aria-labelledby="quote-title" className="scroll-mt-16 py-24 lg:py-32">
          <div className={`${wrap} grid gap-12 lg:grid-cols-12 lg:gap-10`}>
            <div className="lg:col-span-4">
              <SectionLabel n="05">Get a yard quote</SectionLabel>
              <h2
                id="quote-title"
                data-g-rise
                className="g-display mt-6 text-[clamp(2.4rem,4.4vw,4.4rem)] leading-[1] tracking-[-0.015em] text-[var(--g-ink)]"
              >
                Tell us about <em className="g-em">the yard</em>
              </h2>
              <p className="mt-6 max-w-[40ch] text-[17px] leading-[1.6] text-[var(--g-ink)]/80">
                Four short steps; photos are optional. For design and installs, Kevin draws a plan
                and you get a fixed price before anyone digs.
              </p>
              <div className="relative mt-12 hidden lg:block">
                <div data-g-drift="0.04" className="overflow-hidden">
                  <Photo
                    photo={PHOTOS.hedge}
                    sizes="28vw"
                    ratio={0.82}
                    className="aspect-[0.82] w-full object-cover"
                  />
                </div>
              </div>
            </div>
            <div className="lg:col-span-8 lg:col-start-5 lg:pl-6">
              <QuoteFlow />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--g-ink)]/20 pt-16 pb-12">
        <div className={wrap}>
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <p aria-hidden="true">
              <Wordmark className="text-[clamp(4rem,13vw,11rem)] tracking-[-0.03em] text-[var(--g-ink)]" />
            </p>
            <p className="max-w-[34ch] text-[17px] leading-[1.55] text-[var(--g-ink)]/85 lg:pb-6 lg:text-right">
              {BUSINESS.name}. Lawn care and landscaping in {BUSINESS.city}.
            </p>
          </div>
          <div className="mt-14 grid gap-10 border-t border-[var(--g-ink)]/15 pt-10 sm:grid-cols-2 lg:grid-cols-12">
            <div className="lg:col-span-3">
              <p className="g-caps text-[11px] text-[var(--g-ink)]/75">Contact</p>
              <ul className="mt-3 space-y-1.5 text-[16px]">
                <li>
                  <a
                    href={BUSINESS.phoneHref}
                    className="g-link g-focus font-semibold tabular-nums"
                  >
                    {BUSINESS.phone}
                  </a>
                </li>
                <li>
                  <a href={`mailto:${BUSINESS.email}`} className="g-link g-focus break-all">
                    {BUSINESS.email}
                  </a>
                </li>
              </ul>
            </div>
            <div className="lg:col-span-3">
              <p className="g-caps text-[11px] text-[var(--g-ink)]/75">Hours</p>
              <ul className="mt-3 space-y-1.5 text-[16px] tabular-nums">
                {HOURS.map((row) => (
                  <li key={row.days}>
                    {row.days} · {row.time}
                  </li>
                ))}
              </ul>
            </div>
            <div className="sm:col-span-2 lg:col-span-6">
              <p className="g-caps text-[11px] text-[var(--g-ink)]/75">About this site</p>
              <p className="mt-3 max-w-[60ch] text-[15px] leading-relaxed text-[var(--g-ink)]/85">
                Greenline Landscaping and the people on this page are fictional. This is a design
                demonstration by{" "}
                <a href="https://www.nosweatfd.com/" className="g-link g-focus">
                  No Sweat
                </a>
                . The quote form does not send or store anything, and the photos are stock scenes,
                not Greenline&apos;s work.
              </p>
              <p className="g-caps mt-7 text-[11px] text-[var(--g-ink)]/75">Photography</p>
              <ul className="mt-3 grid gap-x-6 gap-y-1 text-[13px] text-[var(--g-ink)]/80 sm:grid-cols-2">
                {Object.values(PHOTOS).map((photo) => (
                  <li key={photo.id}>
                    <Credit photo={photo} />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </footer>
      {/* Selo da No Sweat: último elemento da página, no papel do rodapé. A letra quase preta
          (a 55% de opacidade dentro do selo) fica acima de 4,5:1 sobre o papel. */}
      <div
        className="@container bg-[var(--g-paper)]"
        style={{ ["--nsb-bg" as string]: "#f0eadc", ["--nsb-fg" as string]: "#000000" }}
      >
        <NoSweatBadge />
      </div>
      <GreenlineMotion />
    </>
  );
}
