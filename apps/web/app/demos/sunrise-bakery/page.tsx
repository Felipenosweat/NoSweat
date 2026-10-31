import { NoSweatBadge } from "@nosweat/templates";
import { BakeBoard } from "@/components/demos/sunrise-bakery/BakeBoard";
import { BottomBar, TopBar } from "@/components/demos/sunrise-bakery/Bars";
import { BAKERY, FAQ, MENU, QUOTES } from "@/components/demos/sunrise-bakery/content";
import {
  BoxDeadline,
  CakeEarliest,
  HeroFlap,
  HoursTable,
  OpenChip,
  OrderLink,
  TodayLine,
} from "@/components/demos/sunrise-bakery/Live";
import { PHOTOS } from "@/components/demos/sunrise-bakery/photos";
import { Preorder } from "@/components/demos/sunrise-bakery/Preorder";
import { SunriseMotion } from "@/components/demos/sunrise-bakery/SunriseMotion";
import { Credit, Icon, Photo, Score, SunMark } from "@/components/demos/sunrise-bakery/ui";

// Sunrise Bakery (demonstração, padaria fictícia). Direção "Morning Counter": arquétipo
// warm-hospitality, foto de página inteira (luz da manhã), Zilla Slab + Familjen Grotesk,
// hierarquia pela imagem, papel de farinha com um acento de casca, movimento brincalhão.
// Ordem: herói (janela ao sol + cartão "hoje") → 01 o pão de 48 horas e o céu da manhã →
// 02 o quadro da semana (letras que viram) → 03 cardápio com preços → 04 bolos da Elena →
// 05 história (2016 → 2020) → 06 encomenda (demonstração) → faixa de foto → 07 visita, horários
// e perguntas → rodapé com créditos → selo da No Sweat. Ver docs/design/demos/sunrise-bakery.md.

const wrap = "mx-auto w-full max-w-[1360px] px-4 sm:px-8 lg:px-10";

// Geometria do céu (viewBox 1200×320): arco elíptico do sol. As paradas ficam em t tal que
// x(t) cai no centro de cada uma das 4 colunas (12,5 / 37,5 / 62,5 / 87,5 %).
const SKY = { cx: 600, cy: 280, rx: 540, ry: 230 };
const sky = (t: number) => ({
  x: SKY.cx - SKY.rx * Math.cos(Math.PI * t),
  y: SKY.cy - SKY.ry * Math.sin(Math.PI * t),
});
const MORNING = 0.41;
const STOPS = [
  {
    at: 0.187,
    time: "−48 h",
    title: "The dough starts",
    body: "Two days before you buy it, the sourdough begins its 48-hour ferment.",
  },
  {
    at: 0.41,
    time: "7 AM",
    title: "First loaves out",
    body: "The doors open as the first loaves come out of the oven, Wednesday to Sunday.",
  },
  {
    at: 0.59,
    time: "Noon",
    title: "Weekend bread runs out",
    body: "On Saturdays and Sundays the bread usually sells out by noon. Come early or preorder.",
  },
  {
    at: 0.813,
    time: "1 · 2 PM",
    title: "Doors close",
    body: "1 PM on weekends, 2 PM Wednesday to Friday. Closed Monday and Tuesday.",
  },
];

function Chapter({ n, children }: { n: string; children: string }) {
  return (
    <p className="sb-label flex items-center gap-3 text-[var(--sb-crust)]">
      <span className="tabular-nums">{n}</span>
      <span aria-hidden="true" className="h-[2px] w-8 rounded bg-current" />
      {children}
    </p>
  );
}

export default function SunriseBakeryPage() {
  const sun = sky(MORNING);
  return (
    <>
      <TopBar />
      <main id="main">
        {/* HERÓI — a janela ao sol */}
        <section
          id="top"
          data-sb-hero
          aria-labelledby="sb-title"
          className="sb-hero relative isolate flex flex-col justify-end overflow-hidden bg-[#2a1a0e] text-[var(--sb-paper)]"
        >
          <div className="sb-hero-zoom absolute inset-0 -z-10">
            <Photo
              photo={PHOTOS.window}
              sizes="100vw"
              priority
              className="size-full object-cover object-[50%_62%]"
            />
            <div className="sb-hero-veil absolute inset-0" />
          </div>
          <div
            data-sb-hero-copy
            className={`${wrap} grid gap-8 pt-28 pb-24 md:pb-14 lg:grid-cols-12 lg:items-end lg:gap-10`}
          >
            <div className="lg:col-span-8">
              <p
                className="sb-label sb-rise-in text-[var(--sb-apricot)]"
                style={{ ["--d" as string]: "0.1s" }}
              >
                Sourdough, pastries & custom cakes · J St, Midtown Sacramento
              </p>
              <h1
                id="sb-title"
                className="sb-display mt-5 text-[clamp(3.3rem,8.6vw,8.4rem)] leading-[0.9] tracking-[-0.03em]"
              >
                <span className="sb-rise-in" style={{ ["--d" as string]: "0.2s" }}>
                  First loaves
                </span>{" "}
                <span className="sb-rise-in" style={{ ["--d" as string]: "0.34s" }}>
                  out at <em className="font-semibold text-[var(--sb-apricot)] italic">7 AM.</em>
                </span>
              </h1>
              <p
                className="sb-rise-in mt-6 max-w-[44ch] text-[18px] leading-relaxed text-[var(--sb-paper)]/85 sm:text-[19px]"
                style={{ ["--d" as string]: "0.5s" }}
              >
                Sunrise Bakery is Mai Tran&rsquo;s sourdough bakery on J St. The dough ferments for
                48 hours, and weekend bread usually sells out by noon.
              </p>
            </div>
            <div className="sb-rise-in lg:col-span-4" style={{ ["--d" as string]: "0.65s" }}>
              <div className="sb-ticket sb-ticket-tilt max-w-[420px] lg:ml-auto">
                <HeroFlap />
                <p aria-live="polite" className="mt-4">
                  <TodayLine />
                </p>
                <div className="mt-5 flex flex-wrap gap-2.5">
                  <OrderLink kind="box" className="sb-btn sb-btn-crust sb-focus">
                    Preorder for Saturday
                  </OrderLink>
                  <a href="#board" className="sb-btn sb-btn-ghost sb-focus">
                    This week&rsquo;s board
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 01 — O PÃO DE 48 HORAS + O CÉU DA MANHÃ */}
        <section id="loaf" aria-labelledby="sb-loaf" className="pt-24 pb-20 sm:pt-32 lg:pt-40">
          <div className={`${wrap} grid gap-14 lg:grid-cols-12 lg:gap-10`}>
            <div className="lg:col-span-5">
              <Chapter n="01">The bread</Chapter>
              <h2 id="sb-loaf" className="mt-6">
                <span
                  data-sb-rise
                  className="sb-display block text-[clamp(8.5rem,21vw,17rem)] leading-[0.78] tracking-[-0.05em] text-[var(--sb-crust)] tabular-nums"
                >
                  <span data-sb-count>48</span>
                </span>
                <span className="sb-display mt-3 block text-[clamp(2rem,4vw,3.2rem)] leading-[1.02]">
                  hours, <em className="font-medium italic">then the oven.</em>
                </span>
              </h2>
              <Score className="mt-5 text-[var(--sb-crust)]" width={200} />
              <p className="mt-6 max-w-[42ch] text-[18px] leading-relaxed">
                Our sourdough ferments for 48 hours. The first loaves come out at 7 AM: country
                sourdough every day we&rsquo;re open, seeded rye from Friday to Sunday.
              </p>
              <p className="mt-4 max-w-[42ch] text-[18px] leading-relaxed">
                Croissants, morning buns with orange zest and cinnamon sugar, and kouign-amann on
                weekends.{" "}
                <a href="#menu" className="sb-link font-semibold text-[var(--sb-crust)]">
                  See the menu and prices
                </a>
                .
              </p>
            </div>
            <div className="lg:col-span-7 lg:col-start-6 lg:pt-24">
              <div data-sb-print="1">
                <figure className="sb-print [--tilt:1.4deg]">
                  <Photo
                    photo={PHOTOS.dough}
                    ratio={4 / 3}
                    sizes="(min-width: 1024px) 56vw, 92vw"
                    max={2000}
                  />
                </figure>
              </div>
            </div>
          </div>

          {/* O céu: o sol atravessa a manhã da padaria com a rolagem. */}
          <div
            data-sb-sky
            data-cx={SKY.cx}
            data-cy={SKY.cy}
            data-rx={SKY.rx}
            data-ry={SKY.ry}
            data-morning={MORNING}
            className={`${wrap} mt-24 sm:mt-32`}
          >
            <h3 className="sb-display text-[clamp(1.9rem,3.4vw,2.8rem)] leading-tight">
              A morning at <em className="font-medium italic">the counter</em>
            </h3>
            <div className="relative mt-8">
              <svg viewBox="0 0 1200 320" className="block h-auto w-full" aria-hidden="true">
                <defs>
                  <radialGradient id="sb-glow">
                    <stop offset="0%" stopColor="#f0b47a" stopOpacity="0.75" />
                    <stop offset="100%" stopColor="#f0b47a" stopOpacity="0" />
                  </radialGradient>
                </defs>
                <path
                  d={`M${SKY.cx - SKY.rx} ${SKY.cy} A${SKY.rx} ${SKY.ry} 0 0 1 ${SKY.cx + SKY.rx} ${SKY.cy}`}
                  stroke="rgb(43 28 18 / 0.3)"
                  strokeWidth="2"
                  strokeDasharray="2 9"
                  strokeLinecap="round"
                  fill="none"
                />
                <path
                  data-sb-trail
                  d={`M${SKY.cx - SKY.rx} ${SKY.cy} A${SKY.rx} ${SKY.ry} 0 0 1 ${SKY.cx + SKY.rx} ${SKY.cy}`}
                  stroke="var(--sb-crust)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="none"
                  pathLength={1}
                  strokeDasharray="1"
                  style={{ strokeDashoffset: 1 - MORNING }}
                />
                {STOPS.map((stop) => {
                  const p = sky(stop.at);
                  return (
                    <g key={stop.time} className="sb-sky-tick">
                      <line
                        x1={p.x}
                        x2={p.x}
                        y1={p.y + 14}
                        y2={SKY.cy}
                        stroke="rgb(43 28 18 / 0.28)"
                        strokeWidth="1.5"
                        strokeDasharray="3 5"
                      />
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r="5"
                        fill="var(--sb-paper)"
                        stroke="var(--sb-ink)"
                        strokeWidth="2"
                      />
                    </g>
                  );
                })}
                <line
                  x1="0"
                  x2="1200"
                  y1={SKY.cy}
                  y2={SKY.cy}
                  stroke="var(--sb-ink)"
                  strokeWidth="2.5"
                />
                <g data-sb-sun transform={`translate(${sun.x.toFixed(1)} ${sun.y.toFixed(1)})`}>
                  <circle r="70" fill="url(#sb-glow)" />
                  <circle r="26" fill="var(--sb-apricot)" />
                  <path
                    d="M-12 4c6-5 15-6 24-3"
                    stroke="var(--sb-ink)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    fill="none"
                  />
                </g>
              </svg>
              <ol className="mt-8 grid gap-8 sm:grid-cols-2 lg:mt-6 lg:grid-cols-4 lg:gap-6">
                {STOPS.map((stop) => (
                  <li
                    key={stop.time}
                    data-sb-stop
                    data-at={stop.at}
                    data-lit={stop.at <= MORNING ? "" : undefined}
                    className="sb-sky-stop border-t-2 border-[var(--sb-ink)] pt-4 lg:border-t-0 lg:pt-0 lg:text-center"
                  >
                    <p className="sb-display sb-sky-time text-[2.4rem] leading-none tabular-nums">
                      {stop.time}
                    </p>
                    <p className="mt-3 font-semibold">{stop.title}</p>
                    <p className="mt-1 max-w-[30ch] text-[16px] lg:mx-auto leading-relaxed text-[var(--sb-ink-2)]">
                      {stop.body}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* 02 — O QUADRO DA SEMANA */}
        <section
          id="board"
          aria-labelledby="sb-board"
          className="border-t border-[var(--sb-rule)] py-24 sm:py-32"
        >
          <div className={wrap}>
            <div className="mb-12 grid gap-6 lg:grid-cols-12 lg:items-end">
              <div className="lg:col-span-8">
                <Chapter n="02">This week</Chapter>
                <h2
                  id="sb-board"
                  data-sb-rise
                  className="sb-display mt-6 text-[clamp(2.6rem,6vw,5.4rem)] leading-[0.95] tracking-[-0.03em]"
                >
                  What&rsquo;s on the board <em className="font-medium italic">today.</em>
                </h2>
              </div>
              <p className="max-w-[40ch] text-[17px] leading-relaxed text-[var(--sb-ink-2)] lg:col-span-4">
                The board flips to today in Sacramento. Tap a day to see what&rsquo;s baked, and
                when.
              </p>
            </div>
            <BakeBoard />
          </div>
        </section>

        {/* 03 — CARDÁPIO */}
        <section
          id="menu"
          aria-labelledby="sb-menu"
          className="bg-[var(--sb-paper-deep)] py-24 sm:py-32"
        >
          <div className={`${wrap} grid gap-16 lg:grid-cols-12 lg:gap-10`}>
            <div className="lg:col-span-5">
              <Chapter n="03">The counter</Chapter>
              <h2
                id="sb-menu"
                data-sb-rise
                className="sb-display mt-6 text-[clamp(2.6rem,6vw,5.4rem)] leading-[0.95] tracking-[-0.03em]"
              >
                Menu <em className="font-medium italic">&amp; prices</em>
              </h2>
              <div className="relative mt-12 grid grid-cols-[1.25fr_1fr] items-start gap-4 lg:block lg:h-[620px]">
                <div data-sb-print="-1" className="lg:absolute lg:top-0 lg:left-0 lg:w-[78%]">
                  <figure className="sb-print [--tilt:-2.2deg]">
                    <Photo
                      photo={PHOTOS.croissants}
                      ratio={3 / 2}
                      sizes="(min-width: 1024px) 30vw, 52vw"
                      max={1600}
                    />
                  </figure>
                </div>
                <div
                  data-sb-print="1"
                  className="mt-10 lg:absolute lg:right-0 lg:bottom-0 lg:mt-0 lg:w-[52%]"
                >
                  <figure className="sb-print [--tilt:3deg]">
                    <Photo
                      photo={PHOTOS.scored}
                      ratio={3 / 4}
                      sizes="(min-width: 1024px) 20vw, 40vw"
                      max={1280}
                    />
                  </figure>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 lg:col-start-6">
              {MENU.map((group) => (
                <div key={group.group} className="mb-14 last:mb-0">
                  <h3 className="sb-display flex items-baseline gap-3 border-b-2 border-[var(--sb-ink)] pb-3 text-[1.9rem] leading-none">
                    <em className="font-semibold italic">{group.group}</em>
                  </h3>
                  <ul data-sb-rise-group>
                    {group.items.map((item) => (
                      <li key={item.name} className="border-b border-[var(--sb-rule)] py-5">
                        <div className="flex items-baseline">
                          <span className="sb-display text-[clamp(1.35rem,2.2vw,1.65rem)] leading-tight font-semibold">
                            {item.name}
                          </span>
                          <span aria-hidden="true" className="sb-leader" />
                          <span className="sb-display text-[clamp(1.35rem,2.2vw,1.65rem)] leading-tight whitespace-nowrap tabular-nums">
                            {item.price}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
                          <span className="text-[16px] text-[var(--sb-ink-2)]">{item.note}</span>
                          {item.when ? <span className="sb-when">{item.when}</span> : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <p className="mt-10 rounded-2xl border-2 border-dashed border-[var(--sb-rule)] p-5 text-[15px] leading-relaxed">
                <strong className="font-semibold">Allergens:</strong> our kitchen uses nuts, wheat,
                dairy and eggs, so we can&rsquo;t promise anything is allergen-free.
              </p>
            </div>
          </div>
        </section>

        {/* 04 — BOLOS DA ELENA */}
        <section id="cakes" aria-labelledby="sb-cakes" className="py-24 sm:py-32 lg:py-40">
          <div className={`${wrap} grid gap-14 lg:grid-cols-12 lg:gap-10`}>
            <div className="lg:col-span-5 lg:col-start-1">
              <div data-sb-print="-1">
                <figure className="sb-print [--tilt:-1.6deg]">
                  <Photo
                    photo={PHOTOS.cake}
                    ratio={4 / 5}
                    sizes="(min-width: 1024px) 38vw, 92vw"
                    max={1600}
                  />
                </figure>
              </div>
            </div>
            <div className="lg:col-span-6 lg:col-start-7">
              <Chapter n="04">Custom cakes</Chapter>
              <h2
                id="sb-cakes"
                data-sb-rise
                className="sb-display mt-6 text-[clamp(3rem,7vw,6.2rem)] leading-[0.92] tracking-[-0.035em]"
              >
                Cakes by <em className="font-medium text-[var(--sb-crust)] italic">Elena.</em>
              </h2>
              <p className="mt-6 max-w-[44ch] text-[18px] leading-relaxed">
                Elena Ruiz is our cake decorator. She designs and decorates every custom cake and
                every wedding cake.
              </p>

              <div className="mt-10 grid gap-5 sm:grid-cols-2">
                <div className="rounded-[20px] bg-[var(--sb-paper-deep)] p-6">
                  <p className="sb-label text-[var(--sb-ink-2)]">Custom cake</p>
                  <p className="sb-display mt-3 text-[2.6rem] leading-none tabular-nums">
                    <span className="text-[1.1rem] font-medium italic">from </span>$55
                  </p>
                  <p className="mt-3 text-[16px] leading-relaxed">
                    A 6-inch cake serves 8–10. Order 5 days ahead. <CakeEarliest />
                  </p>
                </div>
                <div className="rounded-[20px] bg-[var(--sb-paper-deep)] p-6">
                  <p className="sb-label text-[var(--sb-ink-2)]">Tiered wedding cake</p>
                  <p className="sb-display mt-3 text-[2.6rem] leading-none tabular-nums">
                    <span className="text-[1.1rem] font-medium italic">from </span>$350
                  </p>
                  <p className="mt-3 text-[16px] leading-relaxed">
                    With a tasting by appointment. Book the tasting with Elena first.
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <OrderLink kind="cake" className="sb-btn sb-btn-crust sb-btn-lg sb-focus">
                  Start a cake request
                </OrderLink>
                <a href={BAKERY.phoneHref} className="sb-btn sb-btn-ghost sb-btn-lg sb-focus">
                  <Icon name="call" />
                  Call about a wedding
                </a>
              </div>

              <figure className="mt-16 grid grid-cols-[1fr_auto] items-end gap-6 sm:gap-10">
                <blockquote>
                  <p className="sb-display text-[clamp(1.6rem,2.6vw,2.2rem)] leading-[1.15] font-medium italic">
                    <span aria-hidden="true" className="mr-1 text-[var(--sb-crust)]">
                      &ldquo;
                    </span>
                    {QUOTES.cake.text}&rdquo;
                  </p>
                  <figcaption className="sb-label mt-4 text-[var(--sb-ink-2)]">
                    {QUOTES.cake.author}, a customer
                  </figcaption>
                </blockquote>
                <div data-sb-print="1" className="w-[118px] sm:w-[150px]">
                  <div className="sb-print [--tilt:4deg]">
                    <Photo photo={PHOTOS.tiered} ratio={3 / 4} sizes="150px" max={720} />
                  </div>
                </div>
              </figure>
            </div>
          </div>
        </section>

        {/* 05 — HISTÓRIA */}
        <section
          id="story"
          aria-labelledby="sb-story"
          className="border-t border-[var(--sb-rule)] py-24 sm:py-32"
        >
          <div className={`${wrap} grid gap-14 lg:grid-cols-12 lg:gap-10`}>
            <div className="lg:col-span-6">
              <Chapter n="05">Since the market</Chapter>
              <h2
                id="sb-story"
                data-sb-rise
                className="sb-display mt-6 text-[clamp(2.6rem,5.6vw,5rem)] leading-[0.95] tracking-[-0.03em]"
              >
                From a market table <em className="font-medium italic">to J Street.</em>
              </h2>
              <ol className="mt-12 grid gap-0">
                <li className="grid grid-cols-[auto_1fr] items-baseline gap-6 border-t-2 border-[var(--sb-ink)] py-6">
                  <span className="sb-display text-[clamp(2.8rem,5vw,4.2rem)] leading-none tabular-nums text-[var(--sb-crust)]">
                    2016
                  </span>
                  <p className="text-[18px] leading-relaxed">
                    Mai Tran, the owner and baker, starts selling sourdough at the Midtown farmers
                    market.
                  </p>
                </li>
                <li className="grid grid-cols-[auto_1fr] items-baseline gap-6 border-t-2 border-[var(--sb-ink)] py-6">
                  <span className="sb-display text-[clamp(2.8rem,5vw,4.2rem)] leading-none tabular-nums text-[var(--sb-crust)]">
                    2020
                  </span>
                  <p className="text-[18px] leading-relaxed">
                    She opens the shop at 2415 J St. Elena Ruiz makes every custom cake.
                  </p>
                </li>
              </ol>
              <figure className="mt-12">
                <blockquote>
                  <p className="sb-display text-[clamp(1.7rem,3vw,2.5rem)] leading-[1.12] font-medium italic">
                    <span aria-hidden="true" className="mr-1 text-[var(--sb-crust)]">
                      &ldquo;
                    </span>
                    {QUOTES.bread.text}&rdquo;
                  </p>
                </blockquote>
                <figcaption className="sb-label mt-4 text-[var(--sb-ink-2)]">
                  {QUOTES.bread.author}, a customer
                </figcaption>
              </figure>
            </div>
            <div className="lg:col-span-5 lg:col-start-8 lg:pt-32">
              <div data-sb-print="1">
                <figure className="sb-print [--tilt:2deg]">
                  <Photo
                    photo={PHOTOS.market}
                    ratio={4 / 3}
                    sizes="(min-width: 1024px) 36vw, 92vw"
                    max={1600}
                  />
                </figure>
              </div>
            </div>
          </div>
        </section>

        {/* 06 — ENCOMENDA (DEMONSTRAÇÃO) */}
        <section id="order" aria-labelledby="sb-order" className="pb-24 sm:pb-32">
          <div className={`${wrap} grid gap-12 lg:grid-cols-12 lg:gap-10`}>
            <div className="lg:col-span-4">
              <Chapter n="06">Order ahead</Chapter>
              <h2
                id="sb-order"
                data-sb-rise
                className="sb-display mt-6 text-[clamp(2.6rem,5.2vw,4.6rem)] leading-[0.95] tracking-[-0.03em]"
              >
                Preorder, <em className="font-medium italic">or just come in.</em>
              </h2>
              <ul className="mt-10 grid gap-6 text-[16px] leading-relaxed">
                <li>
                  <p className="font-semibold">Saturday bread box · $28</p>
                  <p className="text-[var(--sb-ink-2)]">
                    Two loaves and four pastries. <BoxDeadline compact />
                  </p>
                </li>
                <li>
                  <p className="font-semibold">Custom cake · from $55</p>
                  <p className="text-[var(--sb-ink-2)]">
                    5 days ahead. Wedding cakes start with a tasting.
                  </p>
                </li>
                <li>
                  <p className="font-semibold">The counter · no order needed</p>
                  <p className="text-[var(--sb-ink-2)]">
                    Wed–Fri 7 AM – 2 PM, Sat–Sun 7 AM – 1 PM. Weekend bread usually goes by noon.
                  </p>
                </li>
              </ul>
            </div>
            <div className="lg:col-span-8">
              <Preorder />
            </div>
          </div>
        </section>

        {/* FAIXA — o pão na janela */}
        <div
          aria-hidden="true"
          className="relative h-[46vh] min-h-[300px] overflow-hidden bg-[#d98c40] lg:h-[62vh]"
        >
          <div data-sb-drift className="absolute inset-[-10%_0]">
            <Photo
              photo={PHOTOS.sill}
              sizes="100vw"
              alt=""
              className="size-full object-cover object-[42%_50%]"
            />
          </div>
          <p className="sb-display absolute bottom-6 left-4 text-[clamp(2.4rem,7vw,6rem)] leading-none text-[var(--sb-ink)] sm:left-8 lg:left-10">
            See you at <em className="font-medium italic">seven.</em>
          </p>
        </div>

        {/* 07 — VISITA */}
        <section id="visit" aria-labelledby="sb-visit" className="py-24 sm:py-32">
          <div className={`${wrap} grid gap-16 lg:grid-cols-12 lg:gap-10`}>
            <div className="lg:col-span-6">
              <Chapter n="07">Visit</Chapter>
              <h2
                id="sb-visit"
                data-sb-rise
                className="sb-display mt-6 text-[clamp(3.6rem,9vw,8rem)] leading-[0.86] tracking-[-0.04em]"
              >
                2415 J St
              </h2>
              <p className="sb-display mt-3 text-[clamp(1.5rem,2.6vw,2.1rem)] font-medium italic">
                Midtown Sacramento, CA
              </p>
              <p className="mt-6 text-[17px]">
                <OpenChip className="rounded-full bg-[var(--sb-paper-deep)] px-3 py-1.5 font-medium" />
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href={BAKERY.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sb-btn sb-btn-ink sb-btn-lg sb-focus"
                >
                  <Icon name="map" />
                  Directions
                </a>
                <a href={BAKERY.phoneHref} className="sb-btn sb-btn-ghost sb-btn-lg sb-focus">
                  <Icon name="call" />
                  {BAKERY.phone}
                </a>
              </div>
              <p className="mt-6 text-[16px]">
                <a href={`mailto:${BAKERY.email}`} className="sb-link">
                  {BAKERY.email}
                </a>
              </p>
            </div>
            <div className="lg:col-span-5 lg:col-start-8">
              <h3 className="sb-label text-[var(--sb-ink-2)]">Hours</h3>
              <div className="mt-4">
                <HoursTable />
              </div>
              <p className="mt-4 text-[15px] leading-relaxed text-[var(--sb-ink-2)]">
                First loaves at 7 AM. Weekend bread usually sells out by noon.
              </p>
            </div>
          </div>

          <div className={`${wrap} mt-24 grid gap-10 lg:grid-cols-12`}>
            <h2 className="sb-display text-[clamp(2rem,3.6vw,3rem)] leading-tight lg:col-span-4">
              Questions <em className="font-medium italic">at the counter</em>
            </h2>
            <div className="sb-faq lg:col-span-7 lg:col-start-6">
              {FAQ.map((item) => (
                <details key={item.q} className="border-t border-[var(--sb-rule)] last:border-b">
                  <summary className="sb-focus py-3 text-[18px]">{item.q}</summary>
                  <p className="max-w-[60ch] pb-6 text-[17px] leading-relaxed text-[var(--sb-ink-2)]">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* RODAPÉ — a casca de baixo */}
      <footer className="sb-footer sb-on-dark pt-20 pb-12">
        <div className={`${wrap} grid gap-12 lg:grid-cols-12`}>
          <div className="lg:col-span-5">
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-[var(--sb-paper)] p-2">
                <SunMark className="h-[22px] w-[38px]" />
              </span>
              <p className="sb-display text-[2rem] leading-none">
                Sunrise <em className="font-medium italic">Bakery</em>
              </p>
            </div>
            <p className="mt-6 text-[15px] leading-relaxed text-[var(--sb-paper)]/80">
              {BAKERY.street}, {BAKERY.area} {BAKERY.city}, {BAKERY.state}
              <br />
              <a href={BAKERY.phoneHref} className="sb-link">
                {BAKERY.phone}
              </a>
              {" · "}
              <a href={`mailto:${BAKERY.email}`} className="sb-link">
                {BAKERY.email}
              </a>
              <br />
              Wed–Fri 7 AM – 2 PM · Sat–Sun 7 AM – 1 PM · Closed Mon–Tue
            </p>
          </div>
          <div className="lg:col-span-6 lg:col-start-7">
            <p className="sb-label text-[var(--sb-apricot)]">About this site</p>
            <p className="mt-3 text-[15px] leading-relaxed text-[var(--sb-paper)]/80">
              Sunrise Bakery, its people, address and phone number are fictional. This is a design
              demonstration by{" "}
              <a href="https://www.nosweatfd.com/" className="sb-link">
                No Sweat
              </a>
              . The preorder form does not send, save or charge anything.
            </p>
            <p className="sb-label mt-8 text-[var(--sb-apricot)]">
              Photography (scenes, not this bakery)
            </p>
            <ul className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1.5 text-[13px] text-[var(--sb-paper)]/75 sm:grid-cols-2">
              {Object.values(PHOTOS).map((photo) => (
                <li key={photo.id}>
                  <Credit photo={photo} />
                </li>
              ))}
            </ul>
          </div>
        </div>
        {/* Palavra grande decorativa: vem do CSS (content) para não ser lida como texto. */}
        <p
          aria-hidden="true"
          data-word="Sunrise"
          className="sb-ghost sb-display mt-10 overflow-hidden text-center text-[24vw] leading-[0.78] tracking-[-0.05em] text-[var(--sb-paper)]/[0.07] select-none"
        />
      </footer>
      <div
        className="@container bg-[var(--sb-ink)]"
        style={{ ["--nsb-bg" as string]: "#2b1c12", ["--nsb-fg" as string]: "#f6efe4" }}
      >
        <NoSweatBadge />
      </div>
      <BottomBar />
      <SunriseMotion />
    </>
  );
}
