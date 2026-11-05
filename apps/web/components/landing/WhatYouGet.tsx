"use client";

import { useEffect, useRef, useState } from "react";
import { KINDS } from "./HeroStepper";

// "What you get" (#what): três colunas (o site, a lista de clientes e os posts do Instagram), cada
// uma com um aparelho DESENHADO em HTML (nada de foto ou captura). Os três alternam juntos entre
// três negócios de exemplo, inventados e avisados na legenda. Só o site muda de cara para cada
// negócio; a lista de clientes e os posts são as telas da No Sweat (brancas, mesmas cores).
// Os chips da coluna "Website" preenchem a primeira pergunta do topo.

type Brand = {
  id: string;
  label: string;
  name: string;
  domain: string;
  hero: string;
  sub: string;
  cta: string;
  services: string[];
  clients: { name: string; ask: string; stage: "New" | "Quoted" | "Won" }[];
  posts: { when: string; text: string; ok: boolean }[];
  theme: {
    bg: string;
    sf: string;
    ln: string;
    tx: string;
    mu: string;
    ac: string;
    acTx: string;
    ff: string;
    wt: number;
  };
};

const SERIF = "ui-serif, Georgia, 'Times New Roman', serif";

const BRANDS: Brand[] = [
  {
    id: "spa",
    label: "Still Water Spa, a day spa",
    name: "Still Water Spa",
    domain: "stillwaterspa.com",
    hero: "Slow down, you’re here.",
    sub: "Massage and facials in Old Town Scottsdale.",
    cta: "Book a treatment",
    services: ["Massage", "Facials", "Hot stone"],
    clients: [
      { name: "Hannah Brooks", ask: "Couples massage, Saturday", stage: "New" },
      { name: "Luis Ortega", ask: "Facial and hot stone", stage: "Quoted" },
      { name: "Priya Raman", ask: "Gift card for her mom", stage: "Won" },
      { name: "Dana Whitfield", ask: "Prenatal massage", stage: "Won" },
    ],
    posts: [
      { when: "Tue 10:00", text: "Hot stone is back on the menu this fall.", ok: true },
      { when: "Thu 6:30", text: "The couples suite is open on Sundays now.", ok: false },
      { when: "Sat 9:00", text: "Coming from Old Town? Parking is free.", ok: false },
    ],
    theme: {
      bg: "#f4eee8",
      sf: "#fffaf5",
      ln: "#e6dbcf",
      tx: "#2b211b",
      mu: "#8a7769",
      ac: "#7d5f45",
      acTx: "#ffffff",
      ff: SERIF,
      wt: 400,
    },
  },
  {
    id: "bbq",
    label: "Smoke & Rail BBQ, a barbecue joint",
    name: "Smoke & Rail",
    domain: "smokeandrail.com",
    hero: "Low and slow since sunrise.",
    sub: "Kansas City barbecue in the West Bottoms.",
    cta: "Order for pickup",
    services: ["Brisket", "Burnt ends", "Catering"],
    clients: [
      { name: "Marcus Lee", ask: "Catering for 60, June 14", stage: "New" },
      { name: "Erin Walsh", ask: "Office lunch, Friday", stage: "Quoted" },
      { name: "Tom Becker", ask: "Rehearsal dinner", stage: "Won" },
      { name: "Gina Russo", ask: "Whole brisket to go", stage: "Won" },
    ],
    posts: [
      { when: "Mon 11:00", text: "Burnt ends are back, while they last.", ok: true },
      { when: "Wed 5:00", text: "Catering for your next game day.", ok: true },
      { when: "Fri 4:30", text: "Open late this Friday. Bring friends.", ok: false },
    ],
    theme: {
      bg: "#151110",
      sf: "#211b19",
      ln: "#33292a",
      tx: "#f3ece4",
      mu: "#a99a8f",
      ac: "#e0662b",
      acTx: "#ffffff",
      ff: "var(--font-lp)",
      wt: 800,
    },
  },
  {
    id: "law",
    label: "Mercer Law, a family law firm",
    name: "Mercer Law",
    domain: "mercerlaw.com",
    hero: "Family law, with a steady hand.",
    sub: "Divorce, custody and estate planning in Columbus.",
    cta: "Book a consultation",
    services: ["Divorce", "Custody", "Estates"],
    clients: [
      { name: "Rachel Kim", ask: "Custody question", stage: "New" },
      { name: "Paul Dorsey", ask: "Will and estate plan", stage: "Quoted" },
      { name: "Ana Silva", ask: "Divorce consultation", stage: "Quoted" },
      { name: "Mark Ellis", ask: "Prenuptial agreement", stage: "Won" },
    ],
    posts: [
      { when: "Tue 9:00", text: "What to bring to your first consultation.", ok: true },
      { when: "Thu 12:00", text: "Estate planning, in plain words.", ok: false },
      { when: "Mon 8:30", text: "Free parking behind our office.", ok: false },
    ],
    theme: {
      bg: "#0f1b2d",
      sf: "#16253b",
      ln: "#24344d",
      tx: "#f1eee8",
      mu: "#9aa6b8",
      ac: "#c8a96a",
      acTx: "#0f1b2d",
      ff: SERIF,
      wt: 400,
    },
  },
];

const STAGE: Record<string, string> = {
  New: "bg-[#00c2ff]",
  Quoted: "bg-amber-500",
  Won: "bg-emerald-500",
};

function BrowserSite({ b }: { b: Brand }) {
  const t = b.theme;
  return (
    <div
      className="lp-frame top-[10%] right-[7%] bottom-[-8%] left-[7%] overflow-hidden rounded-t-xl shadow-[0_30px_60px_-26px_rgb(0_0_0/.45),0_0_0_1px_rgb(0_0_0/.08)]"
      style={{ background: t.bg, color: t.tx }}
    >
      <div className="flex h-7 items-center gap-1.5 border-b border-[#eaeaee] bg-[#f7f7f9] px-3">
        <i className="size-2 rounded-full bg-[#d9d9de]" />
        <i className="size-2 rounded-full bg-[#d9d9de]" />
        <i className="size-2 rounded-full bg-[#d9d9de]" />
        <span className="mx-auto rounded-full border border-[#eaeaee] bg-white px-4 py-0.5 text-[10px] text-[#6e6e73]">
          {b.domain}
        </span>
      </div>
      <div className="px-5 pt-4">
        <div className="flex items-center justify-between text-[10px]">
          <span style={{ fontFamily: t.ff, fontWeight: t.wt }} className="text-[14px]">
            {b.name}
          </span>
          <span
            className="rounded-full px-2.5 py-1 font-semibold"
            style={{ background: t.ac, color: t.acTx }}
          >
            {b.cta}
          </span>
        </div>
        <p
          className="mt-6 max-w-[13ch] text-[clamp(1.35rem,2.3vw,1.9rem)] leading-[1.02] tracking-[-0.02em]"
          style={{ fontFamily: t.ff, fontWeight: t.wt }}
        >
          {b.hero}
        </p>
        <p className="mt-2 max-w-[30ch] text-[11px]" style={{ color: t.mu }}>
          {b.sub}
        </p>
        <div className="mt-4 grid grid-cols-3 gap-1.5">
          {b.services.map((s) => (
            <span
              key={s}
              className="rounded-md px-2 py-3 text-[10px] font-semibold"
              style={{ background: t.sf, border: `1px solid ${t.ln}` }}
            >
              {s}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function PhoneClients({ b }: { b: Brand }) {
  return (
    <div className="lp-frame top-[8%] left-1/2 h-[150%] w-[46%] -translate-x-1/2 rounded-[2rem] bg-[#0b0c10] p-[2.6%] shadow-[0_34px_70px_-24px_rgb(0_0_0/.55)]">
      <div className="h-full overflow-hidden rounded-[1.7rem] bg-white px-3 pt-6 text-[#071b33]">
        <p className="text-[9px] text-[#6e6e73]">{b.name}</p>
        <p className="text-[15px] font-semibold tracking-[-0.02em]">Clients</p>
        <div className="mt-2 rounded-xl bg-[#0066ff] p-2.5 text-white">
          <p className="text-[8px] font-bold tracking-[0.12em] opacity-80">
            NEW REQUEST · JUST NOW
          </p>
          <p className="mt-0.5 text-[12px] font-semibold">{b.clients[0]?.name}</p>
          <p className="text-[10px] opacity-85">{b.clients[0]?.ask}</p>
        </div>
        <ul className="mt-2 divide-y divide-[#071b33]/10">
          {b.clients.map((c) => (
            <li key={c.name} className="flex items-center gap-2 py-2">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[#071b33]/[0.07] text-[8px] font-semibold">
                {c.name
                  .split(" ")
                  .map((p) => p[0])
                  .join("")}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[10px] font-semibold">{c.name}</span>
                <span className="block truncate text-[9px] text-[#6e6e73]">{c.ask}</span>
              </span>
              <span className="flex shrink-0 items-center gap-1 text-[9px] text-[#071b33]/75">
                <span className={`size-1.5 rounded-full ${STAGE[c.stage]}`} />
                {c.stage}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function WindowSocial({ b }: { b: Brand }) {
  return (
    <div className="lp-frame top-[10%] right-[7%] bottom-[-8%] left-[7%] overflow-hidden rounded-t-xl bg-white text-[#071b33] shadow-[0_30px_60px_-26px_rgb(0_0_0/.45),0_0_0_1px_rgb(0_0_0/.08)]">
      <div className="flex h-7 items-center gap-1.5 border-b border-[#eaeaee] bg-[#f7f7f9] px-3">
        <i className="size-2 rounded-full bg-[#d9d9de]" />
        <i className="size-2 rounded-full bg-[#d9d9de]" />
        <i className="size-2 rounded-full bg-[#d9d9de]" />
        <span className="mx-auto rounded-full border border-[#eaeaee] bg-white px-4 py-0.5 text-[10px] text-[#6e6e73]">
          nosweatfd.com/social
        </span>
      </div>
      <div className="p-4">
        <div className="flex items-baseline justify-between">
          <p className="text-[13px] font-semibold tracking-[-0.015em]">This week on Instagram</p>
          <p className="text-[9px] text-[#6e6e73]">{b.name}</p>
        </div>
        <ul className="mt-3 grid grid-cols-3 gap-2">
          {b.posts.map((p, i) => (
            <li key={p.when} className="min-w-0 rounded-lg ring-1 ring-[#071b33]/10">
              <span
                className="flex aspect-square items-end rounded-t-lg p-1.5 text-[8px] font-semibold"
                style={{
                  background: i === 1 ? b.theme.ac : b.theme.bg,
                  color: i === 1 ? b.theme.acTx : b.theme.tx,
                  fontFamily: b.theme.ff,
                }}
              >
                {b.name}
              </span>
              <span className="block p-1.5">
                <span className="block text-[8px] font-semibold text-[#6e6e73]">{p.when}</span>
                <span className="mt-0.5 line-clamp-2 block text-[9px] leading-snug">{p.text}</span>
                <span
                  className={`mt-1 inline-flex items-center gap-1 text-[8px] font-semibold ${
                    p.ok ? "text-emerald-700" : "text-amber-700"
                  }`}
                >
                  <span
                    className={`size-1 rounded-full ${p.ok ? "bg-emerald-600" : "bg-amber-500"}`}
                  />
                  {p.ok ? "Approved" : "Needs your OK"}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const chip =
  "lp-chip px-3.5 py-2 text-[13.5px] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#0066ff]";

export function WhatYouGet() {
  const [current, setCurrent] = useState(0);
  // Escolher um ponto segura a troca automática por 20 s.
  const holding = useRef(false);
  const holdTimer = useRef(0);
  const ref = useRef<HTMLDivElement>(null);

  // Troca de negócio a cada 6,5 s, só com a seção na tela, sem mouse em cima e sem "reduzir
  // movimento". Escolher um ponto segura a troca por 20 s.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = ref.current;
    if (!el) return;
    let visible = false;
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = Boolean(entry?.isIntersecting);
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    const timer = window.setInterval(() => {
      if (!visible || document.hidden || holding.current) return;
      if (el.matches(":hover, :focus-within")) return;
      setCurrent((c) => (c + 1) % BRANDS.length);
    }, 6500);
    return () => {
      io.disconnect();
      window.clearInterval(timer);
    };
  }, []);

  const pick = (i: number) => {
    setCurrent(i);
    holding.current = true;
    window.clearTimeout(holdTimer.current);
    holdTimer.current = window.setTimeout(() => {
      holding.current = false;
    }, 20000);
  };

  const preset = (label: string) => {
    window.dispatchEvent(new CustomEvent("ns:preset-kind", { detail: label }));
    document.getElementById("start")?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  };

  const sets = (render: (b: Brand) => React.ReactNode) =>
    BRANDS.map((b, i) => (
      <div
        key={b.id}
        className="lp-set"
        data-on={i === current ? "" : undefined}
        aria-hidden={i !== current}
      >
        {render(b)}
      </div>
    ));

  const columns = [
    {
      id: "website",
      title: "Website",
      body: "Every page a customer needs before they call you: services, hours, a contact form and a call button.",
      chips: (
        <div className="mt-4 flex flex-wrap gap-2" aria-label="Start with your kind of business">
          {KINDS.slice(0, 5).map((k) => (
            <button key={k.label} type="button" onClick={() => preset(k.label)} className={chip}>
              {k.label}
            </button>
          ))}
        </div>
      ),
      device: sets((b) => <BrowserSite b={b} />),
      label: "The website of the example business",
    },
    {
      id: "clients",
      title: "Clients",
      body: "Every request from your contact form lands in one list, ready to call back, quote and follow up.",
      chips: (
        <ul className="mt-4 flex flex-wrap gap-2">
          {["One list", "Notes and jobs", "Reply by email"].map((t) => (
            <li key={t} className={`${chip} pointer-events-none`}>
              {t}
            </li>
          ))}
        </ul>
      ),
      device: sets((b) => <PhoneClients b={b} />),
      label: "The client list of the example business, on a phone",
    },
    {
      id: "social",
      title: "Instagram",
      body: "We draft posts for your business. Nothing goes out until you approve it. Needs an Instagram professional account.",
      chips: (
        <ul className="mt-4 flex flex-wrap gap-2">
          {["Drafted for you", "You approve each one", "Posted on time"].map((t) => (
            <li key={t} className={`${chip} pointer-events-none`}>
              {t}
            </li>
          ))}
        </ul>
      ),
      device: sets((b) => <WindowSocial b={b} />),
      label: "The Instagram calendar of the example business",
    },
  ];

  return (
    <section
      id="what"
      aria-labelledby="what-title"
      className="scroll-mt-14 px-5 py-20 text-center sm:px-8 lg:py-28"
    >
      <span className="lp-tag">What you get</span>
      <h2 id="what-title" className="lp-h mt-6 text-[clamp(1.9rem,3.9vw,3.375rem)]">
        A website, your clients and your posts.
        <br />
        <span className="dim">One place, no sweat.</span>
      </h2>

      <div
        ref={ref}
        className="mx-auto mt-14 grid w-full max-w-[1340px] grid-cols-1 text-left lg:grid-cols-3 lg:grid-rows-[auto_auto]"
      >
        {columns.map((col, i) => (
          <article
            key={col.id}
            id={col.id}
            className={`scroll-mt-20 py-8 lg:row-span-2 lg:grid lg:grid-rows-subgrid lg:px-8 lg:py-0 ${
              i > 0 ? "border-t border-[var(--lp-hair)] lg:border-t-0 lg:border-l" : "pt-0"
            }`}
          >
            <div>
              <h3 className="text-[clamp(1.75rem,2.7vw,2.5rem)] leading-[1.05] font-semibold tracking-[-0.025em]">
                {col.title}
              </h3>
              <p className="mt-2.5 max-w-[38ch] text-[15.5px] leading-[1.55] text-[#6e6e73]">
                {col.body}
              </p>
              {col.chips}
            </div>
            <div
              className="lp-dev mt-6 self-end"
              role="img"
              aria-label={`${col.label}: ${BRANDS[current]?.label}`}
            >
              {col.device}
            </div>
          </article>
        ))}
      </div>

      <div className="mt-7 flex justify-center gap-1.5" aria-label="Example businesses shown above">
        {BRANDS.map((b, i) => (
          <button
            key={b.id}
            type="button"
            aria-pressed={i === current}
            aria-label={b.label}
            onClick={() => pick(i)}
            className="grid size-8 place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-[#0066ff]"
          >
            <span
              className={`size-[7px] rounded-full transition-[background,transform] duration-300 ${
                i === current ? "scale-125 bg-[#071b33]" : "bg-[#c7c7cc] hover:bg-[#86868b]"
              }`}
            />
          </button>
        ))}
      </div>
      <p className="mt-2 text-[12.5px] text-[#6e6e73]">Example businesses. They are made up.</p>
    </section>
  );
}
