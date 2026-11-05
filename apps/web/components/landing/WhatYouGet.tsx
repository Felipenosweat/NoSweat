"use client";

import { useEffect, useRef, useState } from "react";
import { KINDS } from "./HeroStepper";

// "What you get" (#what): três colunas (o site, a lista de clientes e os posts do Instagram), cada
// uma com um aparelho DESENHADO em HTML (nada de foto ou captura). Os três alternam juntos entre
// três negócios de exemplo, inventados e avisados na legenda. Só o site muda de cara para cada
// negócio; a lista de clientes e os posts são as telas da No Sweat (brancas, mesmas cores).
// Os chips da coluna "Website" preenchem a primeira pergunta do topo.

// Tudo aqui vem dos sites de exemplo de verdade (packages/fixtures/src/library): nome, título,
// preços, horários, telefone, cores e fonte do modelo. Os pedidos e posts são inventados para o
// exemplo, nos mesmos rótulos das telas reais (/clients: New, Contacted, Quoted, Won; /social:
// Needs approval, Scheduled, Published). Negócios fictícios, avisado na legenda.

type Brand = {
  id: string;
  label: string;
  name: string;
  handle: string;
  domain: string;
  strip: string;
  phone: string;
  nav: string[];
  hero: string;
  sub: string;
  cta: string;
  listTitle: string;
  items: { name: string; price: string }[];
  hours: { days: string; time: string }[];
  clients: {
    name: string;
    ask: string;
    when: string;
    stage: "New" | "Contacted" | "Quoted" | "Won";
  }[];
  post: { art: string; caption: string; when: string };
  next: { caption: string; when: string };
  theme: {
    bg: string;
    tx: string;
    ac: string;
    mu: string;
    line: string;
    ff: string;
    wt: number;
    upper?: boolean;
  };
};

const BRANDS: Brand[] = [
  {
    id: "law",
    label: "Mercer Law, a family and estate law office",
    name: "Mercer Law",
    handle: "mercerlaw.columbus",
    domain: "mercerlaw.com",
    strip: "588 S Third St, German Village",
    phone: "(614) 555-0127",
    nav: ["Fees", "About", "Contact"],
    hero: "Family and estate law in German Village",
    sub: "Ellen Mercer handles wills, trusts, probate and divorce consultations from a two-person office, with fees quoted in writing before we start.",
    cta: "Book a consultation",
    listTitle: "Services and fees",
    items: [
      { name: "Will package", price: "$1,450 flat" },
      { name: "Revocable living trust", price: "from $3,200" },
      { name: "Estate plan review", price: "$350" },
      { name: "Probate and administration", price: "$285 an hour" },
      { name: "Prenuptial agreement", price: "from $1,800" },
    ],
    hours: [
      { days: "Mon–Thu", time: "9 AM – 5 PM" },
      { days: "Fri", time: "9 AM – 1 PM" },
    ],
    clients: [
      {
        name: "Rachel Kim",
        ask: "Will package for me and my husband",
        when: "9:12 AM",
        stage: "New",
      },
      {
        name: "Paul Dorsey",
        ask: "Probate question about my dad’s house",
        when: "Yesterday",
        stage: "Contacted",
      },
      { name: "Ana Silva", ask: "Dissolution consultation", when: "Oct 30", stage: "Quoted" },
      { name: "Mark Ellis", ask: "Prenup before June", when: "Oct 27", stage: "Won" },
    ],
    post: {
      art: "What to bring to your first consultation",
      caption:
        "A short list: your current will, a list of accounts, and your questions. Book at the link in bio.",
      when: "Thu, Nov 6 · 12:00 PM",
    },
    next: {
      caption: "Free parking behind the building on S Third St.",
      when: "Mon, Nov 10 · 8:30 AM",
    },
    theme: {
      bg: "#f6f2ea",
      tx: "#1f1b16",
      ac: "#6b2d2a",
      mu: "#6f665a",
      line: "rgb(31 27 22 / .14)",
      ff: "var(--ns-font-classic-heading), Georgia, serif",
      wt: 500,
    },
  },
  {
    id: "spark",
    label: "Bright Spark Electric, a residential electrician",
    name: "Bright Spark Electric",
    handle: "brightspark.phx",
    domain: "brightsparkelectric.com",
    strip: "Phoenix · Tempe · Scottsdale · Mesa",
    phone: "(602) 555-0137",
    nav: ["Services", "About", "Contact"],
    hero: "Residential electrician in Phoenix, Arizona",
    sub: "Marcus Bell has been wiring houses in the Valley since 2006. You get a written quote before we start.",
    cta: "Call for a quote",
    listTitle: "Electrical services",
    items: [
      { name: "Panel upgrades", price: "from $2,400" },
      { name: "EV charger installs", price: "from $650" },
      { name: "Lighting and ceiling fans", price: "from $175" },
      { name: "Troubleshooting visit", price: "$95" },
    ],
    hours: [
      { days: "Mon–Fri", time: "7 AM – 5 PM" },
      { days: "Sat", time: "8 AM – 12 PM" },
    ],
    clients: [
      { name: "Omar Haddad", ask: "EV charger in the garage", when: "7:48 AM", stage: "New" },
      {
        name: "Jenna Ruiz",
        ask: "Breaker keeps tripping in the kitchen",
        when: "7:02 AM",
        stage: "New",
      },
      {
        name: "Dale Porter",
        ask: "Panel upgrade, 1970s house",
        when: "Yesterday",
        stage: "Quoted",
      },
      { name: "Rachel Klein", ask: "Three ceiling fans", when: "Oct 29", stage: "Won" },
    ],
    post: {
      art: "Is your panel older than your house’s AC?",
      caption:
        "Panels from the 70s weren’t built for today’s loads. We quote upgrades in writing before we start.",
      when: "Wed, Nov 5 · 7:00 AM",
    },
    next: {
      caption: "EV charger installs from $650, permit handled by Tasha.",
      when: "Fri, Nov 7 · 7:00 AM",
    },
    theme: {
      bg: "#f2f0e8",
      tx: "#17181c",
      ac: "#17181c",
      mu: "#5d5f66",
      line: "rgb(23 24 28 / .14)",
      ff: "var(--ns-font-technical-heading), system-ui, sans-serif",
      wt: 600,
      upper: true,
    },
  },
  {
    id: "spa",
    label: "Still Water Spa, a day spa",
    name: "Still Water Spa",
    handle: "stillwater.scottsdale",
    domain: "stillwaterspa.com",
    strip: "7134 E Stetson Dr, Suite 2",
    phone: "(480) 555-0171",
    nav: ["Treatments", "About", "Book"],
    hero: "Day spa in Old Town Scottsdale",
    sub: "Massage and facials with licensed therapists. Five treatment rooms, one of them a couples suite, and phones stay out of all of them.",
    cta: "Book a treatment",
    listTitle: "Treatments",
    items: [
      { name: "Swedish massage", price: "$110 / $155" },
      { name: "Deep tissue massage", price: "$125 / $175" },
      { name: "Hot stone massage", price: "$165" },
      { name: "Signature facial", price: "$130" },
      { name: "Couples massage", price: "$240" },
    ],
    hours: [{ days: "Daily", time: "9 AM – 8 PM" }],
    clients: [
      {
        name: "Hannah Brooks",
        ask: "Couples massage, Saturday at 4",
        when: "10:31 AM",
        stage: "New",
      },
      {
        name: "Priya Raman",
        ask: "Gift card for my mom, $150",
        when: "Yesterday",
        stage: "Contacted",
      },
      {
        name: "Luis Ortega",
        ask: "Facial and hot stone, same day",
        when: "Oct 31",
        stage: "Quoted",
      },
      { name: "Dana Whitfield", ask: "Prenatal massage, 28 weeks", when: "Oct 28", stage: "Won" },
    ],
    post: {
      art: "Hot stone is back for the season",
      caption: "75 minutes, $165. Book online or call the front desk.",
      when: "Tue, Nov 4 · 10:00 AM",
    },
    next: { caption: "The couples suite is open on Sundays now.", when: "Sun, Nov 9 · 9:00 AM" },
    theme: {
      bg: "#f5f2ec",
      tx: "#2a2c26",
      ac: "#5b6b4e",
      mu: "#6b6d63",
      line: "rgb(42 44 38 / .14)",
      ff: "var(--ns-font-luxe-heading), Georgia, serif",
      wt: 500,
    },
  },
];

/** Selo de etapa no estilo do StatusBadge do app (borda fina, ponto, texto colorido). */
const STAGE: Record<Brand["clients"][number]["stage"], string> = {
  New: "text-[#0052cc] bg-[#0066ff]/[0.07] ring-[#0066ff]/20",
  Contacted: "text-slate-600 bg-slate-100 ring-slate-200",
  Quoted: "text-amber-800 bg-amber-50 ring-amber-200",
  Won: "text-emerald-800 bg-emerald-50 ring-emerald-200",
};

function Chrome({ url }: { url: string }) {
  return (
    <div className="relative z-10 flex h-7 shrink-0 items-center gap-1.5 border-b border-[#eaeaee] bg-[#f7f7f9] px-3">
      <i className="size-2 rounded-full bg-[#d9d9de]" />
      <i className="size-2 rounded-full bg-[#d9d9de]" />
      <i className="size-2 rounded-full bg-[#d9d9de]" />
      <span className="mx-auto rounded-full border border-[#eaeaee] bg-white px-4 py-0.5 text-[10px] text-[#6e6e73]">
        {url}
      </span>
    </div>
  );
}

/** O site do negócio: a página inteira, que rola sozinha ao passar o mouse (lp-page). */
function BrowserSite({ b }: { b: Brand }) {
  const t = b.theme;
  const head = {
    fontFamily: t.ff,
    fontWeight: t.wt,
    textTransform: t.upper ? "uppercase" : undefined,
  } as const;
  return (
    <div className="lp-frame top-[10%] right-[7%] bottom-[-8%] left-[7%] flex flex-col overflow-hidden rounded-t-xl bg-white shadow-[0_30px_60px_-26px_rgb(0_0_0/.45),0_0_0_1px_rgb(0_0_0/.08)]">
      <Chrome url={b.domain} />
      <div className="relative flex-1 overflow-hidden" style={{ background: t.bg, color: t.tx }}>
        <div className="lp-page">
          <div
            className="flex justify-between px-4 py-1 text-[8px]"
            style={{ background: t.ac, color: "#fff" }}
          >
            <span>{b.strip}</span>
            <span className="font-semibold">{b.phone}</span>
          </div>
          <div
            className="flex items-center justify-between px-4 py-2.5 text-[9px]"
            style={{ borderBottom: `1px solid ${t.line}` }}
          >
            <span className="text-[12px] leading-none" style={head}>
              {b.name}
            </span>
            <span className="flex gap-3" style={{ color: t.mu }}>
              {b.nav.map((n) => (
                <span key={n}>{n}</span>
              ))}
            </span>
          </div>
          <div className="px-4 pt-5 pb-4">
            <p className="max-w-[15ch] text-[23px] leading-[1.02] tracking-[-0.015em]" style={head}>
              {b.hero}
            </p>
            <p className="mt-2.5 max-w-[42ch] text-[9.5px] leading-[1.5]" style={{ color: t.mu }}>
              {b.sub}
            </p>
            <div className="mt-3 flex items-center gap-3 text-[9px]">
              <span className="px-3 py-1.5 font-semibold text-white" style={{ background: t.ac }}>
                {b.cta}
              </span>
              <span className="underline underline-offset-2">{b.phone}</span>
            </div>
          </div>
          <div className="px-4 pt-3 pb-4" style={{ borderTop: `1px solid ${t.line}` }}>
            <p className="text-[13px]" style={head}>
              {b.listTitle}
            </p>
            <ul className="mt-1.5 text-[9.5px]">
              {b.items.map((it) => (
                <li
                  key={it.name}
                  className="flex justify-between gap-3 py-1.5"
                  style={{ borderBottom: `1px solid ${t.line}` }}
                >
                  <span>{it.name}</span>
                  <span className="tabular-nums" style={{ color: t.mu }}>
                    {it.price}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-4 px-4 pb-6 text-[9px]">
            <div>
              <p className="text-[12px]" style={head}>
                Hours
              </p>
              {b.hours.map((h) => (
                <p key={h.days} className="mt-1 flex justify-between gap-2" style={{ color: t.mu }}>
                  <span>{h.days}</span>
                  <span className="tabular-nums">{h.time}</span>
                </p>
              ))}
            </div>
            <div>
              <p className="text-[12px]" style={head}>
                Contact
              </p>
              {["Name", "Phone", "How can we help?"].map((f) => (
                <p
                  key={f}
                  className="mt-1 px-1.5 py-1 text-[8px]"
                  style={{ border: `1px solid ${t.line}`, color: t.mu, background: "#fff" }}
                >
                  {f}
                </p>
              ))}
              <p
                className="mt-1 inline-block px-2 py-1 text-[8px] font-semibold text-white"
                style={{ background: t.ac }}
              >
                Send
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** A lista de Clientes da No Sweat, no celular (mesmos rótulos da tela real). */
function PhoneClients({ b }: { b: Brand }) {
  const counts = { New: 0, Quoted: 0 } as Record<string, number>;
  for (const c of b.clients) counts[c.stage] = (counts[c.stage] ?? 0) + 1;
  return (
    <div className="lp-frame top-[8%] left-1/2 h-[150%] w-[47%] -translate-x-1/2 rounded-[2rem] bg-[#0b0c10] p-[2.6%] shadow-[0_34px_70px_-24px_rgb(0_0_0/.55)]">
      <div className="h-full overflow-hidden rounded-[1.7rem] bg-[#f8fafc] text-[#071b33]">
        <div className="flex justify-between px-4 pt-2 text-[8px] font-semibold">
          <span>9:41</span>
          <span className="flex items-center gap-1">
            <i className="h-1.5 w-2.5 rounded-[2px] bg-[#071b33]" />
          </span>
        </div>
        <div className="flex items-end justify-between px-3 pt-3">
          <div>
            <p className="text-[8px] text-slate-500">{b.name}</p>
            <p className="text-[15px] leading-tight font-bold tracking-[-0.02em]">Clients</p>
          </div>
          <span className="grid size-5 place-items-center rounded-full bg-[#0066ff] text-[11px] leading-none text-white">
            +
          </span>
        </div>
        <p className="mx-3 mt-2 rounded-md bg-white px-2 py-1 text-[8.5px] text-slate-400 ring-1 ring-slate-200">
          Search clients
        </p>
        <div className="mx-3 mt-2 flex gap-1 text-[8px] font-semibold">
          <span className="rounded-full bg-[#071b33] px-2 py-0.5 text-white">
            All {b.clients.length}
          </span>
          <span className="rounded-full bg-white px-2 py-0.5 ring-1 ring-slate-200">
            New {counts.New ?? 0}
          </span>
          <span className="rounded-full bg-white px-2 py-0.5 ring-1 ring-slate-200">
            Quoted {counts.Quoted ?? 0}
          </span>
        </div>
        <ul className="mx-2 mt-2 rounded-lg bg-white ring-1 ring-slate-200">
          {b.clients.map((c, i) => (
            <li key={c.name} className={`px-2 py-2 ${i > 0 ? "border-t border-slate-100" : ""}`}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[9.5px] font-semibold">{c.name}</span>
                <span className="shrink-0 text-[7.5px] text-slate-400">{c.when}</span>
              </div>
              <p className="mt-0.5 text-[8.5px] leading-snug text-slate-600">{c.ask}</p>
              <span
                className={`mt-1 inline-block rounded-full px-1.5 py-px text-[7.5px] font-semibold ring-1 ${STAGE[c.stage]}`}
              >
                {c.stage}
              </span>
            </li>
          ))}
        </ul>
        <p className="mx-3 mt-2 text-[7.5px] text-slate-400">From your website’s contact form</p>
      </div>
    </div>
  );
}

/** A tela de posts da No Sweat: um post esperando aprovação e o próximo já agendado. */
function WindowSocial({ b }: { b: Brand }) {
  const t = b.theme;
  const initials = b.name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2);
  return (
    <div className="lp-frame top-[10%] right-[7%] bottom-[-8%] left-[7%] flex flex-col overflow-hidden rounded-t-xl bg-[#f8fafc] text-[#071b33] shadow-[0_30px_60px_-26px_rgb(0_0_0/.45),0_0_0_1px_rgb(0_0_0/.08)]">
      <Chrome url="nosweatfd.com/social" />
      <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-3 py-2 text-[9px]">
        <span className="text-[12px] font-bold tracking-[-0.015em]">Social</span>
        <span className="border-b-2 border-[#0066ff] pb-0.5 font-semibold">Calendar</span>
        <span className="text-slate-500">Drafts</span>
        <span className="ml-auto text-slate-500">@{b.handle}</span>
      </div>
      <div className="grid flex-1 grid-cols-[1.25fr_1fr] gap-2.5 p-3">
        <div className="rounded-lg bg-white p-2 ring-1 ring-slate-200">
          <div className="flex items-center gap-1.5">
            <span
              className="grid size-4 place-items-center rounded-full text-[6.5px] font-bold text-white"
              style={{ background: t.ac }}
            >
              {initials}
            </span>
            <span className="min-w-0 truncate text-[8.5px] font-semibold">{b.handle}</span>
            <span className="ml-auto shrink-0 rounded-full bg-amber-50 px-1.5 py-px text-[7px] whitespace-nowrap font-semibold text-amber-800 ring-1 ring-amber-200">
              Needs approval
            </span>
          </div>
          <div
            className="mt-1.5 flex aspect-[16/9] items-end p-2.5"
            style={{ background: t.bg, color: t.tx, border: `1px solid ${t.line}` }}
          >
            <p
              className="text-[13px] leading-[1.05]"
              style={{
                fontFamily: t.ff,
                fontWeight: t.wt,
                textTransform: t.upper ? "uppercase" : undefined,
              }}
            >
              {b.post.art}
            </p>
          </div>
          <p className="mt-1.5 text-[8px] leading-snug text-slate-600">{b.post.caption}</p>
          <div className="mt-1.5 flex items-center gap-1.5 text-[7.5px]">
            <span className="min-w-0 truncate text-slate-400">{b.post.when}</span>
            <span className="ml-auto rounded bg-[#0066ff] px-1.5 py-0.5 font-semibold text-white">
              Approve
            </span>
            <span className="rounded px-1.5 py-0.5 font-semibold ring-1 ring-slate-200">Edit</span>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="rounded-lg bg-white p-2 ring-1 ring-slate-200">
            <span className="rounded-full bg-[#0066ff]/[0.07] px-1.5 py-px text-[7px] font-semibold text-[#0052cc] ring-1 ring-[#0066ff]/20">
              Scheduled
            </span>
            <p className="mt-1 text-[8px] leading-snug text-slate-600">{b.next.caption}</p>
            <p className="mt-1 text-[7.5px] text-slate-400">{b.next.when}</p>
          </div>
          <div className="rounded-lg bg-white p-2 ring-1 ring-slate-200">
            <span className="rounded-full bg-emerald-50 px-1.5 py-px text-[7px] font-semibold text-emerald-800 ring-1 ring-emerald-200">
              Published
            </span>
            <p className="mt-1 text-[8px] leading-snug text-slate-600">Our hours, in one post.</p>
            <p className="mt-1 text-[7.5px] text-slate-400">Mon, Nov 3</p>
          </div>
        </div>
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
