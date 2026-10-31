import { NoSweatBadge } from "@nosweat/templates";
import { CAFE, FAQ, PEOPLE, QUOTES } from "@/components/demos/north-loop/content";
import { DayDial } from "@/components/demos/north-loop/DayDial";
import { HoursTable, TodayTicket } from "@/components/demos/north-loop/Live";
import { MenuOrder } from "@/components/demos/north-loop/MenuOrder";
import { NorthLoopMotion } from "@/components/demos/north-loop/NorthLoopMotion";
import { PHOTOS } from "@/components/demos/north-loop/photos";
import { TopBar } from "@/components/demos/north-loop/TopBar";
import {
  Bean,
  CortadoCutout,
  Credit,
  CropMarks,
  Icon,
  Print,
  RegMark,
  RoundCutout,
  SectionHead,
} from "@/components/demos/north-loop/ui";

// North Loop Coffee (demonstração, café fictício). Direção "The Daybook": arquétipo
// warm-hospitality numa combinação nova: composição split-editorial (o cardápio como página
// de jornal), serif de texto (Piazzolla) + mono pequeno para preços, hierarquia por índices
// (o cardápio e o dia do café), recortes colados (fotos em círculo com borda de papel e
// objetos desenhados), barra no topo, movimento quieto e blocos grandes de azul de inverno
// alternando com papel. O motivo vem do prédio (antiga gráfica): marca de registro e marcas
// de corte. Ordem: herói (papel | bloco azul com a colagem e o bilhete "Today") → 01 cardápio
// + bilhete de retirada (demo) → 02 o dia no café (azul) → 03 torra e pessoas → falas de
// clientes (azul) → 04 o salão e perguntas → 05 visita e horários (azul) → rodapé → selo.
// Ver docs/design/demos/north-loop-coffee.md.

const wrap = "mx-auto w-full max-w-[1440px] px-4 sm:px-8 lg:px-10";

const CONTENTS = [
  { href: "#menu", no: "01", label: "Menu and prices" },
  { href: "#day", no: "02", label: "The day at the café" },
  { href: "#roasting", no: "03", label: "Roasting and people" },
  { href: "#room", no: "04", label: "The room" },
  { href: "#visit", no: "05", label: "Hours and directions" },
];

export default function NorthLoopCoffeePage() {
  return (
    <>
      <a href="#main" className="nl-skip nl-focus">
        Skip to content
      </a>
      <TopBar />

      <main id="main" tabIndex={-1} className="outline-none">
        {/* HERÓI — papel à esquerda, bloco azul com a colagem à direita */}
        <section id="top" aria-labelledby="hero-title" className="nl-hero scroll-mt-16">
          <div className="grid lg:min-h-[calc(100svh-4rem)] lg:grid-cols-12">
            <div className="flex flex-col justify-between px-4 pt-10 pb-12 sm:px-8 lg:col-span-6 lg:px-10 lg:pt-12 lg:pb-10 xl:pl-[max(2.5rem,calc((100vw-1440px)/2+2.5rem))]">
              <div>
                <p className="nl-mono text-[11.5px] text-[var(--nl-ink-2)]" data-nl-rise>
                  {CAFE.street} · {CAFE.area} · {CAFE.city}
                </p>
                <h1
                  id="hero-title"
                  className="nl-display mt-6 max-w-[11ch] text-[clamp(3rem,6.2vw,5.8rem)] leading-[0.94] tracking-[-0.025em]"
                >
                  Neighborhood coffee in the <em className="nl-em">North&nbsp;Loop</em>
                </h1>
                <p className="mt-7 max-w-[34rem] text-[19px] leading-[1.6] text-[var(--nl-ink-2)] sm:text-[20px]">
                  We&apos;re in an old printing warehouse on Washington Ave N. We roast our own
                  beans in the back, Theo bakes the pastry case every morning, and we&apos;re open
                  until 3.
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <a href="#menu" className="nl-btn nl-focus">
                    Order ahead
                    <Icon name="arrow" className="h-4 w-4" />
                  </a>
                  <a href={CAFE.phoneHref} className="nl-btn-ghost nl-focus">
                    <Icon name="phone" className="h-4 w-4" />
                    {CAFE.phone}
                  </a>
                </div>
              </div>

              {/* Índice da página (hierarquia por índice) */}
              <nav aria-label="On this page" className="mt-12">
                <p className="nl-mono flex items-center gap-2 text-[11px] text-[var(--nl-ink-2)]">
                  <RegMark className="h-3 w-3" /> Contents
                </p>
                <ol className="mt-3 grid border-t border-[var(--nl-rule)] sm:grid-cols-2 sm:gap-x-8">
                  {CONTENTS.map((c) => (
                    <li key={c.href} className="border-b border-[var(--nl-rule)]">
                      <a href={c.href} className="nl-contents nl-focus">
                        <span className="nl-mono text-[11px] tabular-nums">{c.no}</span>
                        <span>{c.label}</span>
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            </div>

            {/* Bloco azul: a colagem (recortes) + o bilhete de hoje */}
            <div className="nl-block relative overflow-hidden px-4 pt-10 pb-10 sm:px-8 lg:col-span-6 lg:px-10 lg:pt-12">
              <CropMarks className="text-[var(--nl-frost)]" />
              <p className="nl-mono relative z-10 text-[11px] text-[var(--nl-frost)]">
                Since {CAFE.opened} · roasted in house Mon &amp; Thu
              </p>
              <div className="nl-collage relative mx-auto mt-6 aspect-[1/1] w-full max-w-[640px] lg:mt-4">
                <div className="absolute top-[2%] right-[0%] w-[62%]" data-nl-drift="0.12">
                  <RoundCutout
                    photo={PHOTOS.latte}
                    sizes="(min-width: 1024px) 26vw, 60vw"
                    priority
                    className="rotate-[8deg]"
                  />
                </div>
                <div className="absolute bottom-[4%] left-[2%] w-[40%]" data-nl-drift="0.24">
                  <RoundCutout
                    photo={PHOTOS.bun}
                    sizes="(min-width: 1024px) 17vw, 40vw"
                    priority
                    className="-rotate-[10deg]"
                  />
                </div>
                <div className="absolute top-[14%] left-[6%] w-[26%]" data-nl-drift="0.32">
                  <CortadoCutout className="nl-glass h-auto w-full text-[var(--nl-frost)]" />
                </div>
                <Bean className="absolute top-[64%] left-[46%] w-[5%] rotate-[24deg]" />
                <Bean className="absolute top-[72%] left-[52%] w-[4.2%] -rotate-[40deg]" />
                <Bean className="absolute top-[6%] left-[44%] w-[4.4%] rotate-[70deg]" />
                <Bean className="absolute top-[58%] right-[6%] w-[4.8%] -rotate-[12deg]" />
                <Bean className="absolute bottom-[2%] left-[44%] w-[4%] rotate-[110deg]" />
              </div>
              <div className="relative z-10 mx-auto mt-6 max-w-[360px] lg:absolute lg:right-10 lg:bottom-10 lg:mt-0 lg:w-[330px]">
                <TodayTicket />
              </div>
            </div>
          </div>
        </section>

        {/* 01 MENU */}
        <section
          id="menu"
          aria-labelledby="menu-title"
          className="scroll-mt-16 pt-24 pb-28 lg:pt-32 lg:pb-36"
        >
          <div className={wrap}>
            <div className="grid items-end gap-10 lg:grid-cols-12">
              <div className="lg:col-span-7" data-nl-rise>
                <SectionHead no="01" kicker="Menu" id="menu-title">
                  Menu, from the bar <em className="nl-em">and the kitchen</em>
                </SectionHead>
                <p className="mt-6 max-w-[40rem] text-[19px] leading-relaxed text-[var(--nl-ink-2)]">
                  Add what you want to the pickup slip and we&apos;ll have it at the end of the bar.
                  Oat milk costs the same as dairy.
                </p>
              </div>
              <div className="hidden lg:col-span-4 lg:col-start-9 lg:block">
                <Print
                  photo={PHOTOS.cortado}
                  sizes="22vw"
                  ratio={4 / 5}
                  className="ml-auto w-[78%] rotate-[3deg]"
                  caption="Cortado · $4.25"
                />
              </div>
            </div>
            <div className="mt-16">
              <MenuOrder />
            </div>
          </div>
        </section>

        {/* 02 O DIA — bloco azul */}
        <section
          id="day"
          aria-labelledby="day-title"
          className="nl-block relative scroll-mt-16 overflow-hidden py-24 lg:py-32"
        >
          <CropMarks className="text-[var(--nl-frost)]" />
          <div className={wrap}>
            <div className="max-w-[52rem]" data-nl-rise>
              <SectionHead no="02" kicker="The day" id="day-title">
                The day at <em className="nl-em">the café</em>
              </SectionHead>
              <p className="mt-6 max-w-[40rem] text-[19px] leading-relaxed text-[var(--nl-frost)]">
                Pick a day and move the time. Doors open at 6:30 on weekdays and 7:30 on weekends,
                the egg & cheddar runs until 1, and Hannah roasts on Mondays and Thursdays.
              </p>
            </div>
            <div className="mt-14">
              <DayDial />
            </div>
          </div>
        </section>

        {/* 03 TORRA E PESSOAS */}
        <section
          id="roasting"
          aria-labelledby="roasting-title"
          className="scroll-mt-16 py-24 lg:py-36"
        >
          <div className={`${wrap} grid gap-14 lg:grid-cols-12 lg:gap-10`}>
            <div className="relative lg:col-span-5">
              <div className="lg:sticky lg:top-28">
                <RoundCutout
                  photo={PHOTOS.roaster}
                  sizes="(min-width: 1024px) 36vw, 90vw"
                  className="nl-cutout-paper mx-auto w-[86%] max-w-[520px] -rotate-[4deg]"
                />
                <Bean className="absolute top-[4%] right-[6%] w-[7%] rotate-[30deg]" />
                <Bean className="absolute bottom-[8%] left-[2%] w-[6%] -rotate-[50deg]" />
              </div>
            </div>
            <div className="lg:col-span-6 lg:col-start-7">
              <div data-nl-rise>
                <SectionHead no="03" kicker="Roasting" id="roasting-title">
                  Roasted in the back on <em className="nl-em">Mondays and Thursdays</em>
                </SectionHead>
                <p className="nl-dropcap mt-8 text-[19px] leading-[1.7]">
                  Theo and I opened North Loop Coffee in 2017 in an old printing warehouse. I roast
                  the beans on a 12-kilo roaster in the back every Monday and Thursday. Theo runs
                  the kitchen and bakes the pastry case each morning, and Ramón, our head barista,
                  trains everyone who works the bar.
                </p>
                <p className="nl-mono mt-4 text-[11px] text-[var(--nl-ink-2)]">Hannah Lindqvist</p>
              </div>

              <dl className="mt-12 grid grid-cols-3 border-y border-[var(--nl-rule)]">
                {[
                  ["2017", "Opened, in an old printing warehouse"],
                  ["12 kg", "The roaster in the back"],
                  ["Mon · Thu", "Roast days"],
                ].map(([n, label], i) => (
                  <div
                    key={n}
                    className={`py-6 pr-3 ${i > 0 ? "border-l border-[var(--nl-rule)] pl-3 sm:pl-5" : ""}`}
                  >
                    <dt className="sr-only">{label}</dt>
                    <dd>
                      <span className="nl-display block text-[clamp(1.6rem,3.4vw,2.8rem)] leading-none whitespace-nowrap">
                        {n}
                      </span>
                      <span className="nl-mono mt-3 block text-[10.5px] leading-snug text-[var(--nl-ink-2)]">
                        {label}
                      </span>
                    </dd>
                  </div>
                ))}
              </dl>

              <h3 className="nl-mono mt-14 text-[12px] text-[var(--nl-ink-2)]">Who&apos;s here</h3>
              <ol className="mt-3 border-t border-[var(--nl-ink)]">
                {PEOPLE.map((p, i) => (
                  <li
                    key={p.name}
                    className="grid grid-cols-[2.2rem_1fr] gap-x-3 border-b border-[var(--nl-rule)] py-5 sm:grid-cols-[2.5rem_14rem_1fr]"
                  >
                    <span className="nl-mono pt-1.5 text-[11px] tabular-nums">0{i + 1}</span>
                    <p>
                      <span className="nl-display block text-[24px] leading-tight">{p.name}</span>
                      <span className="nl-mono mt-1 block text-[10.5px] text-[var(--nl-ink-2)]">
                        {p.role}
                      </span>
                    </p>
                    <p className="col-start-2 mt-2 text-[17px] leading-relaxed text-[var(--nl-ink-2)] sm:col-start-3 sm:mt-0">
                      {p.note}
                    </p>
                  </li>
                ))}
              </ol>

              <div className="nl-slip mt-14">
                <p className="nl-mono text-[11px]">For offices</p>
                <p className="nl-display mt-2 text-[26px] leading-tight">
                  5 lb bags of the house blend, $75
                </p>
                <p className="mt-2 text-[17px] leading-relaxed text-[var(--nl-ink-2)]">
                  Give us a week&apos;s notice and we&apos;ll roast it for you. The 12 oz bag is
                  $17, and we grind it for free if you ask.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <a href={CAFE.phoneHref} className="nl-btn nl-btn-sm nl-focus">
                    <Icon name="phone" className="h-4 w-4" /> Call {CAFE.phone}
                  </a>
                  <a href={`mailto:${CAFE.email}`} className="nl-btn-ghost nl-btn-sm nl-focus">
                    <Icon name="mail" className="h-4 w-4" /> Email us
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FALAS DE CLIENTES — bloco azul */}
        <section
          aria-labelledby="quotes-title"
          className="nl-block relative overflow-hidden py-24 lg:py-28"
        >
          <CropMarks className="text-[var(--nl-frost)]" />
          <div className={wrap}>
            <h2
              id="quotes-title"
              className="nl-mono flex items-center gap-3 text-[12px] text-[var(--nl-frost)]"
            >
              <RegMark className="h-3.5 w-3.5" /> Two regulars wrote
            </h2>
            <div className="mt-10 grid gap-14 lg:grid-cols-12 lg:gap-10">
              {QUOTES.map((q, i) => (
                <figure
                  key={q.author}
                  data-nl-rise
                  className={i === 0 ? "lg:col-span-7" : "lg:col-span-4 lg:col-start-9 lg:mt-24"}
                >
                  <blockquote
                    className={`nl-display italic ${i === 0 ? "text-[clamp(1.9rem,3.6vw,3.2rem)] leading-[1.12]" : "text-[clamp(1.6rem,2.6vw,2.2rem)] leading-[1.2]"}`}
                  >
                    “{q.quote}”
                  </blockquote>
                  <figcaption className="nl-mono mt-5 text-[12px] text-[var(--nl-crema-light)]">
                    {q.author}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* 04 O SALÃO E PERGUNTAS */}
        <section id="room" aria-labelledby="room-title" className="scroll-mt-16 py-24 lg:py-36">
          <div className={`${wrap} grid gap-14 lg:grid-cols-12 lg:gap-10`}>
            <div className="lg:col-span-6" data-nl-rise>
              <SectionHead no="04" kicker="The room" id="room-title">
                Wi-Fi and an outlet <em className="nl-em">at every table</em>
              </SectionHead>
              <ul className="mt-10 border-t border-[var(--nl-rule)]">
                {[
                  ["Laptops", "Free Wi-Fi, and every table has outlets. Stay and work."],
                  ["Dogs", "Welcome on the patio."],
                  ["Order ahead", "Order online and pick it up at the end of the bar."],
                  ["Parking", "Metered street parking on Washington Ave N."],
                ].map(([k, v]) => (
                  <li
                    key={k}
                    className="grid grid-cols-[7.5rem_1fr] gap-4 border-b border-[var(--nl-rule)] py-4"
                  >
                    <span className="nl-mono pt-1 text-[11px] text-[var(--nl-ink-2)]">{k}</span>
                    <span className="text-[18px] leading-snug">{v}</span>
                  </li>
                ))}
              </ul>

              <h3 className="nl-display mt-16 text-[30px] italic">Questions</h3>
              <div className="mt-4 border-t border-[var(--nl-ink)]">
                {FAQ.map((item) => (
                  <details key={item.q} className="nl-faq border-b border-[var(--nl-rule)]">
                    <summary className="nl-focus flex min-h-14 cursor-pointer items-center justify-between gap-4 py-3 text-[19px]">
                      {item.q}
                      <Icon name="plus" className="nl-faq-icon h-4 w-4 shrink-0" />
                    </summary>
                    <p className="max-w-[56ch] pb-5 text-[17px] leading-relaxed text-[var(--nl-ink-2)]">
                      {item.a}
                    </p>
                  </details>
                ))}
              </div>
            </div>
            <div className="lg:col-span-5 lg:col-start-8">
              <Print
                photo={PHOTOS.room}
                sizes="(min-width: 1024px) 34vw, 92vw"
                ratio={4 / 5}
                className="-rotate-[1.5deg] lg:sticky lg:top-28"
                caption="A scene, not our café: grinders against an old brick wall"
              />
            </div>
          </div>
        </section>

        {/* 05 VISITA — bloco azul */}
        <section
          id="visit"
          aria-labelledby="visit-title"
          className="nl-block relative scroll-mt-16 overflow-hidden py-24 lg:py-32"
        >
          <CropMarks className="text-[var(--nl-frost)]" />
          <div className={`${wrap} grid gap-14 lg:grid-cols-12 lg:gap-10`}>
            <div className="lg:col-span-6" data-nl-rise>
              <SectionHead no="05" kicker="Visit" id="visit-title">
                {CAFE.street}
              </SectionHead>
              <p className="mt-4 text-[20px] text-[var(--nl-frost)]">
                {CAFE.area}, {CAFE.city}, {CAFE.state}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href={CAFE.directionsHref} className="nl-btn nl-btn-light nl-focus">
                  <Icon name="pin" className="h-4 w-4" /> Get directions
                </a>
                <a href={CAFE.phoneHref} className="nl-btn-ghost nl-btn-ghost-light nl-focus">
                  <Icon name="phone" className="h-4 w-4" /> {CAFE.phone}
                </a>
                <a
                  href={`mailto:${CAFE.email}`}
                  className="nl-btn-ghost nl-btn-ghost-light nl-focus"
                >
                  <Icon name="mail" className="h-4 w-4" /> Email
                </a>
              </div>
              <ul className="mt-12 border-t border-[var(--nl-rule-on-blue)]">
                {[
                  ["By car", "Metered street parking on Washington Ave N."],
                  ["By train", "A short walk from the Target Field light rail station."],
                  ["Pickup", "Online orders wait at the end of the bar."],
                ].map(([k, v]) => (
                  <li
                    key={k}
                    className="grid grid-cols-[6.5rem_1fr] gap-4 border-b border-[var(--nl-rule-on-blue)] py-4"
                  >
                    <span className="nl-mono pt-1 text-[11px] text-[var(--nl-frost)]">{k}</span>
                    <span className="text-[18px] leading-snug">{v}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="lg:col-span-5 lg:col-start-8">
              <Print
                photo={PHOTOS.window}
                sizes="(min-width: 1024px) 34vw, 92vw"
                ratio={3 / 2}
                className="nl-print-on-blue rotate-[1.5deg]"
                caption="Snow outside a window counter (a scene, not our window)"
              />
              <h3 className="nl-mono mt-14 text-[12px] text-[var(--nl-frost)]">Hours</h3>
              <div className="mt-3">
                <HoursTable />
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="nl-footer pt-20 pb-12">
        <div className={`${wrap} grid gap-12 lg:grid-cols-12`}>
          <div className="lg:col-span-5">
            <p className="flex items-center gap-3">
              <RegMark className="h-7 w-7 text-[var(--nl-crema-light)]" />
              <span className="nl-display text-[30px] leading-none">
                North Loop <em className="italic">Coffee</em>
              </span>
            </p>
            <p className="mt-6 text-[16px] leading-relaxed text-[var(--nl-frost)]">
              {CAFE.street}, {CAFE.city}, {CAFE.state}
              <br />
              <a href={CAFE.phoneHref} className="nl-link">
                {CAFE.phone}
              </a>
              {" · "}
              <a href={`mailto:${CAFE.email}`} className="nl-link">
                {CAFE.email}
              </a>
              <br />
              Mon–Fri 6:30 AM – 3 PM · Sat–Sun 7:30 AM – 3 PM
            </p>
          </div>
          <div className="lg:col-span-6 lg:col-start-7">
            <p className="nl-mono text-[11px] text-[var(--nl-crema-light)]">About this site</p>
            <p className="mt-3 text-[15px] leading-relaxed text-[var(--nl-frost)]">
              North Loop Coffee, its people, phone number and order site are fictional. This is a
              design demonstration by{" "}
              <a href="https://www.nosweatfd.com/" className="nl-link">
                No Sweat
              </a>
              . The pickup slip does not send, save or charge anything.
            </p>
            <p className="nl-mono mt-8 text-[11px] text-[var(--nl-crema-light)]">
              Photography (scenes, not this café)
            </p>
            <ul className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1.5 text-[13px] text-[var(--nl-frost)] sm:grid-cols-2">
              {Object.values(PHOTOS).map((photo) => (
                <li key={photo.id}>
                  <Credit photo={photo} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </footer>
      <div
        className="@container bg-[var(--nl-night)]"
        style={{ ["--nsb-bg" as string]: "#0f1e31", ["--nsb-fg" as string]: "#f1eee6" }}
      >
        <NoSweatBadge />
      </div>
      <NorthLoopMotion />
    </>
  );
}
