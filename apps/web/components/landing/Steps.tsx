import Image from "next/image";
import type { ReactNode } from "react";

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
    <div className="rounded-[1.25rem] bg-white p-5 shadow-[0_40px_80px_-40px_rgb(7_27_51/.35)] ring-1 ring-[var(--lp-line)] sm:p-7">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold text-[#071b33]/60">Describe your business</p>
        <ExampleTag />
      </div>
      <p className="mt-4 text-[17px] leading-[1.7] text-[#071b33] sm:text-lg">
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

/** 2. O site pronto, no celular. */
function PhoneMock() {
  return (
    <div className="mx-auto w-[min(300px,78%)] rounded-[2.4rem] bg-[#0b1220] p-2 shadow-[0_50px_90px_-40px_rgb(7_27_51/.6)]">
      <div className="overflow-hidden rounded-[2rem]">
        <Image
          src="/landing/signature/still-water-spa-m.webp"
          alt="The finished Still Water Spa site on a phone."
          width={640}
          height={1385}
          sizes="300px"
          className="block aspect-[9/17] h-auto w-full object-cover object-top"
        />
      </div>
    </div>
  );
}

/** 3. O painel do editor: o pedido à IA vira um rascunho para conferir. */
function EditMock() {
  const tabs = ["Ask AI", "Content", "Style", "Sections"];
  return (
    <div className="relative">
      <div className="overflow-hidden rounded-xl ring-1 ring-[var(--lp-line)]">
        <Image
          src="/landing/signature/still-water-spa-d.webp"
          alt=""
          width={1600}
          height={1000}
          sizes="(min-width: 1024px) 560px, 90vw"
          className="block h-auto w-full"
        />
      </div>
      <div className="relative -mt-16 ml-auto w-[min(340px,88%)] rounded-2xl bg-white p-3 text-[#071b33] shadow-[0_40px_80px_-30px_rgb(7_27_51/.5)] ring-1 ring-[var(--lp-line)] sm:-mt-28 sm:mr-[-1.5rem]">
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
            <span className="size-1.5 rounded-full bg-amber-500" />
            New draft ready to review
          </span>
          <ExampleTag />
        </div>
      </div>
    </div>
  );
}

/** 4. O site publicado, com a barra do navegador. */
function LiveMock() {
  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-[0_50px_90px_-50px_rgb(7_27_51/.6)] ring-1 ring-[var(--lp-line)]">
      <div className="flex h-10 items-center gap-3 border-b border-[var(--lp-line)] px-4">
        <span className="flex gap-1.5">
          <span className="size-2 rounded-full bg-[#071b33]/20" />
          <span className="size-2 rounded-full bg-[#071b33]/20" />
          <span className="size-2 rounded-full bg-[#071b33]/20" />
        </span>
        <span className="min-w-0 flex-1 truncate rounded-full bg-[#071b33]/[0.05] px-3 py-1 text-[12px] text-[#071b33]/70">
          nosweatfd.com/s/mercer-law
        </span>
        <span className="hidden items-center gap-1.5 text-[12px] font-semibold text-emerald-700 sm:inline-flex">
          <span className="size-1.5 rounded-full bg-emerald-600" />
          Live
        </span>
      </div>
      <Image
        src="/landing/signature/mercer-law-d.webp"
        alt="Mercer Law, an example site, published at its free nosweatfd.com address."
        width={1600}
        height={1000}
        sizes="(min-width: 1024px) 560px, 90vw"
        className="block h-auto w-full"
      />
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
    body: "One or two sentences, the way you would say it to a customer. We pull out the facts that go on the site: trade, town, hours and phone.",
    visual: <DescribeMock />,
  },
  {
    title: (
      <>
        Get a finished <em>site</em>
      </>
    ),
    body: "Your services, photos picked for your trade, your hours and a contact form. On phones there is always a button that calls you.",
    visual: <PhoneMock />,
  },
  {
    title: (
      <>
        Change <em>anything</em>
      </>
    ),
    body: "Click any part to edit it, or ask in plain words. Each change comes back as a draft you look at before anyone else sees it.",
    visual: <EditMock />,
  },
  {
    title: (
      <>
        Go <em>live</em>
      </>
    ),
    body: "Publish at your free nosweatfd.com address, or connect a domain you own on the Pro and Premium plans.",
    visual: <LiveMock />,
  },
];

export function Steps() {
  return (
    <section id="story" aria-labelledby="story-title" className="lp-paper py-24 lg:py-36">
      <div className="mx-auto w-full max-w-[1240px] px-5 sm:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-end">
          <h2
            id="story-title"
            data-lp-rise
            className="lp-serif text-[clamp(2.8rem,7vw,6.5rem)] leading-[0.92] lg:col-span-8"
          >
            How it <em>works</em>
          </h2>
          <p className="max-w-[38ch] text-lg leading-relaxed text-[#071b33]/70 lg:col-span-4">
            Free to create and preview. You pick a plan when you want the site online.
          </p>
        </div>

        <ol className="mt-16 lg:mt-24">
          {STEPS.map((step, index) => (
            <li
              key={index}
              className="grid grid-cols-1 gap-10 border-t border-[var(--lp-line)] py-14 lg:grid-cols-12 lg:gap-8 lg:py-24"
            >
              <div data-lp-rise className="lg:col-span-5">
                <p className="text-[13px] font-semibold tracking-[0.14em] text-[#071b33]/50">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="lp-serif mt-4 text-[clamp(2.2rem,4.4vw,3.75rem)] leading-[0.98]">
                  {step.title}
                </h3>
                <p className="mt-5 max-w-[42ch] text-[17px] leading-[1.7] text-pretty text-[#071b33]/72">
                  {step.body}
                </p>
              </div>
              <div data-lp-rise className="lg:col-span-6 lg:col-start-7">
                {step.visual}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
