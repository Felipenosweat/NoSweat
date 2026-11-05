import { MiniSite } from "./MiniSite";
import type { CSSProperties, ReactNode } from "react";

// "How it works" (#story): quatro passos em linhas editoriais (número, título em serifa, texto)
// com a interface ao lado. As interfaces são desenhos fiéis das telas de verdade (o campo do
// /create, o painel do editor, a barra do navegador do site publicado) com o exemplo da
// Still Water Spa (fictícia), o mesmo do hero. Selo "Example" em cada uma.

function ExampleTag() {
  return (
    <span className="rounded-full border border-[var(--lp-line)] px-2 py-0.5 text-[11px] font-semibold text-[#071b33]/60">
      Example
    </span>
  );
}

/** 1. O campo de descrição, com os fatos que a No Sweat tira da frase. */
function DescribeMock() {
  const fact =
    "rounded-sm bg-[#071b33]/[0.07] px-1 underline decoration-brand decoration-2 underline-offset-4";
  return (
    <div className="w-full max-w-[460px] rounded-[1.25rem] bg-white p-5 shadow-[0_40px_80px_-40px_rgb(7_27_51/.35)] ring-1 ring-[var(--lp-line)]">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold text-[#071b33]/60">Describe your business</p>
        <ExampleTag />
      </div>
      <p className="mt-3 text-[15px] leading-[1.7] text-[#071b33] sm:text-base">
        <span className={fact}>Still Water Spa</span>. Massage and facials in{" "}
        <span className={fact}>Old Town Scottsdale</span>. Five treatment rooms,{" "}
        <span className={fact}>open daily 9 to 8</span>. Call{" "}
        <span className={fact}>(480) 555-0171</span>.
      </p>
      <div className="mt-6 flex flex-wrap gap-2 border-t border-[var(--lp-line)] pt-5">
        {["Day spa", "Scottsdale, AZ", "Daily 9 AM to 8 PM", "(480) 555-0171"].map((chip) => (
          <span
            key={chip}
            className="rounded-full bg-[#071b33] px-3 py-1.5 text-[13px] font-medium text-white"
          >
            {chip}
          </span>
        ))}
      </div>
    </div>
  );
}

/** 2. O site pronto (desenhado, sem foto). */
function SiteMock() {
  return (
    <div className="w-full max-w-[440px]">
      <MiniSite />
    </div>
  );
}

/** 3. O painel do editor: o pedido à IA vira um rascunho para conferir. */
function EditMock() {
  const tabs = ["Ask AI", "Content", "Style", "Sections"];
  return (
    <div className="w-full max-w-[360px] rounded-2xl bg-white p-3 text-[#071b33] shadow-[0_40px_80px_-40px_rgb(7_27_51/.4)] ring-1 ring-[var(--lp-line)]">
      <div className="grid grid-cols-4 gap-0.5 rounded-xl bg-[#071b33]/[0.06] p-0.5">
        {tabs.map((tab, index) => (
          <span
            key={tab}
            className={`truncate rounded-[0.6rem] px-1 py-1.5 text-center text-[11px] font-semibold ${
              index === 0 ? "bg-white shadow-sm" : "text-[#071b33]/55"
            }`}
          >
            {tab}
          </span>
        ))}
      </div>
      <p className="mt-3 text-[11px] font-semibold text-[#071b33]/60">Describe a change</p>
      <p className="mt-1 rounded-lg px-3 py-2 text-[13px] ring-1 ring-[var(--lp-line)]">
        Make the intro shorter and mention the free parking.
      </p>
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-[12px] text-[#071b33]/70">
          <span className="size-1.5 rounded-full bg-[#00c2ff]" />
          New draft ready to review
        </span>
        <ExampleTag />
      </div>
    </div>
  );
}

/** 4. O site publicado, com a barra do navegador e o selo "Live". */
function LiveMock() {
  return (
    <div className="relative w-full max-w-[440px]">
      <MiniSite address="nosweatfd.com/s/still-water-spa" />
      <span className="absolute top-2 right-3 inline-flex items-center gap-1.5 rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-[var(--lp-line)]">
        <span className="size-1.5 rounded-full bg-emerald-600" />
        Live
      </span>
    </div>
  );
}

const STEPS: { title: ReactNode; body: ReactNode; visual: ReactNode }[] = [
  {
    title: (
      <>
        Describe your <em>business</em>
      </>
    ),
    body: "One or two sentences, like you’d tell a customer.",
    visual: <DescribeMock />,
  },
  {
    title: (
      <>
        Get a finished <em>site</em>
      </>
    ),
    body: "Photos, services, hours, contact form and a call button.",
    visual: <SiteMock />,
  },
  {
    title: (
      <>
        Change <em>anything</em>
      </>
    ),
    body: "Click to edit, or just ask the AI in plain words.",
    visual: <EditMock />,
  },
  {
    title: (
      <>
        Go <em>live</em>
      </>
    ),
    body: "Free nosweatfd.com address, or your own domain on Pro.",
    visual: <LiveMock />,
  },
];

export function Steps() {
  return (
    <section
      id="story"
      aria-labelledby="story-title"
      className="lp-tint border-y border-[var(--lp-line)] py-16 lg:py-24"
    >
      <div className="mx-auto w-full max-w-[1240px] px-5 sm:px-8">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-end">
          <h2
            id="story-title"
            data-lp-rise
            className="lp-serif text-[clamp(2.4rem,5.5vw,5rem)] lg:col-span-8"
          >
            How it <em>works</em>
          </h2>
          <p className="max-w-[38ch] text-lg leading-relaxed text-[#071b33]/70 lg:col-span-4">
            Free to create. Pay only to publish.
          </p>
        </div>

        {/* Quatro passos. No tablet e no computador viram uma pilha: cada cartão gruda no topo e o
            próximo desliza por cima (position: sticky, só CSS). No celular, um trilho que o dedo
            passa de lado (a página não fica comprida). */}
        <ol className="-mx-5 mt-10 flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto px-5 [scrollbar-width:none] sm:-mx-8 sm:scroll-px-8 sm:px-8 md:mx-0 md:block md:overflow-visible md:px-0 lg:mt-14">
          {STEPS.map((step, index) => (
            <li
              key={index}
              style={{ "--i": index } as CSSProperties}
              className="w-[84vw] max-w-[420px] min-w-0 shrink-0 snap-start md:sticky md:top-[calc(5.5rem+var(--i)*1.1rem)] md:mb-6 md:w-auto md:max-w-none"
            >
              <div className="overflow-hidden rounded-[1.5rem] bg-white ring-1 ring-[var(--lp-line)] md:grid md:min-h-[420px] md:grid-cols-12 md:items-stretch md:bg-white md:shadow-[0_-24px_50px_-30px_rgb(7_27_51/.35)]">
                <div className="flex h-[300px] items-center justify-center overflow-hidden px-5 sm:h-[340px] sm:px-8 md:col-span-7 md:h-auto md:bg-[var(--lp-tint)]">
                  {step.visual}
                </div>
                <div className="flex flex-col justify-between gap-8 p-6 md:col-span-5 md:p-10">
                  <p
                    aria-hidden="true"
                    className="lp-serif text-[clamp(3.5rem,7vw,6.5rem)] text-[#0066ff]"
                  >
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <div>
                    <h3 className="lp-serif text-[clamp(1.7rem,2.8vw,2.5rem)]">{step.title}</h3>
                    <p className="mt-3 max-w-[40ch] text-[16px] leading-[1.65] text-pretty text-[#071b33]/72">
                      {step.body}
                    </p>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
