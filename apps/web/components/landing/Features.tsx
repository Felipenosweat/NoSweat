import type { ReactNode } from "react";
import { container } from "@/components/marketing/styles";

// "O que vem junto": cartões escuros com mini-interfaces desenhadas em JSX (decorativas,
// aria-hidden) e o brilho que segue o mouse (.l-card + LandingMotion). Só promessas que o
// produto cumpre hoje; dados de exemplo são de negócios fictícios.

function Card({
  title,
  body,
  children,
  className = "",
  delay = 0,
}: {
  title: string;
  body: string;
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <li
      data-l-reveal={delay}
      className={`l-card flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-6 lg:p-8 ${className}`}
    >
      <div aria-hidden="true" className="flex min-h-40 flex-1 items-center justify-center">
        {children}
      </div>
      <h3 className="mt-8 text-xl font-semibold text-white">{title}</h3>
      <p className="mt-2 max-w-[46ch] leading-relaxed text-slate-300">{body}</p>
    </li>
  );
}

function CallVisual() {
  return (
    <div className="relative flex items-center gap-6">
      <div className="w-44 rounded-[1.6rem] border-[5px] border-[#0b1a33] bg-white p-3 shadow-2xl ring-1 ring-white/15">
        <div className="h-2 w-16 rounded bg-slate-200" />
        <div className="mt-3 h-3 w-28 rounded bg-slate-800" />
        <div className="mt-1.5 h-3 w-20 rounded bg-slate-800" />
        <div className="mt-3 space-y-1">
          <div className="h-1.5 w-full rounded bg-slate-200" />
          <div className="h-1.5 w-4/5 rounded bg-slate-200" />
        </div>
        <div className="mt-16 grid grid-cols-2 gap-1.5">
          <span className="relative flex h-8 items-center justify-center rounded-lg bg-[#f59e0b] text-[10px] font-bold text-[#0b0f19]">
            <span className="absolute inset-0 animate-ping rounded-lg bg-[#f59e0b]/40 motion-reduce:hidden" />
            Call now
          </span>
          <span className="flex h-8 items-center justify-center rounded-lg bg-[#0f766e] text-[10px] font-bold text-white">
            Get a quote
          </span>
        </div>
      </div>
      <p className="l-display hidden max-w-[10ch] text-4xl text-slate-200 sm:block">
        One tap and <span className="l-gradient-text">they’re calling you.</span>
      </p>
    </div>
  );
}

function InboxVisual() {
  return (
    <div className="w-full max-w-sm space-y-3">
      {[
        {
          who: "Dana M.",
          what: "Water heater is leaking in the garage. Can someone come by Thursday?",
          time: "9:41 AM",
        },
        { who: "Luis R.", what: "Quote for a move-out clean, 2 bed apartment?", time: "8:15 AM" },
      ].map((m, i) => (
        <div
          key={m.who}
          className={`rounded-2xl border border-white/10 bg-[#0b1a33] p-4 shadow-xl ${i === 1 ? "translate-x-6 opacity-60" : ""}`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-[#00c2ff]">New request from your website</span>
            <span>{m.time}</span>
          </div>
          <p className="mt-2 text-sm font-semibold text-white">{m.who}</p>
          <p className="mt-0.5 line-clamp-2 text-sm text-slate-300">{m.what}</p>
        </div>
      ))}
      <p className="pl-1 text-xs text-slate-400">Example messages</p>
    </div>
  );
}

function AskVisual() {
  return (
    <div className="w-full max-w-xs space-y-2.5">
      <p className="ml-auto w-fit rounded-2xl rounded-br-md bg-[#0066ff] px-4 py-2.5 text-sm text-white">
        Make the headline warmer
      </p>
      <p className="w-fit rounded-2xl rounded-bl-md bg-white/10 px-4 py-2.5 text-sm text-slate-200">
        New draft ready · 1 change
      </p>
      <p className="ml-auto w-fit rounded-2xl rounded-br-md bg-[#0066ff] px-4 py-2.5 text-sm text-white">
        Add a deep-cleaning service
      </p>
    </div>
  );
}

function DomainVisual() {
  return (
    <div className="text-center">
      <p className="l-display text-[clamp(1.8rem,3.4vw,2.6rem)] text-white">
        joesplumbing<span className="l-gradient-text">.com</span>
      </p>
      <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-400/15 px-3 py-1 text-sm font-semibold text-emerald-300">
        <span className="size-1.5 rounded-full bg-emerald-300" /> Connected
      </p>
    </div>
  );
}

function GoogleVisual() {
  return (
    <div className="w-full max-w-sm rounded-2xl bg-white p-4 text-left shadow-xl">
      <p className="text-xs text-[#202124]">nosweatfd.com › s › sparkle-co-cleaning</p>
      <p className="mt-1 text-lg leading-snug text-[#1a0dab]">
        Sparkle &amp; Co. Cleaning · Worcester, MA
      </p>
      <p className="mt-1 line-clamp-2 text-sm text-[#4d5156]">
        Weekly, biweekly and one-time house cleaning across Worcester County. Get a cleaning quote.
      </p>
    </div>
  );
}

function DevicesVisual() {
  return (
    <div className="flex items-end gap-3">
      <div className="h-28 w-44 rounded-xl border border-white/15 bg-white/[0.06] p-2">
        <div className="h-2 w-12 rounded bg-white/30" />
        <div className="mt-2 h-2.5 w-24 rounded bg-white/60" />
        <div className="mt-1 h-2.5 w-16 rounded bg-white/60" />
        <div className="mt-3 h-4 w-14 rounded bg-[#0066ff]" />
      </div>
      <div className="h-24 w-16 rounded-xl border border-white/15 bg-white/[0.06] p-1.5">
        <div className="h-1.5 w-8 rounded bg-white/30" />
        <div className="mt-1.5 h-2 w-11 rounded bg-white/60" />
        <div className="mt-3 h-3 w-full rounded bg-[#0066ff]" />
      </div>
    </div>
  );
}

export function Features() {
  return (
    <section aria-labelledby="features-title" className="relative py-28 lg:py-40">
      <div className={container}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-end">
          <h2
            id="features-title"
            data-l-reveal
            className="l-display text-[clamp(2.5rem,5.5vw,5rem)] text-white lg:col-span-7"
          >
            A website that <span className="l-serif l-gradient-text">answers the phone</span> for
            you.
          </h2>
          <p
            data-l-reveal="0.1"
            className="text-lg leading-relaxed text-slate-300 lg:col-span-4 lg:col-start-9"
          >
            Every plan comes with the editor, a contact form and AI edits. No plugins, nothing to
            install, nothing to learn.
          </p>
        </div>

        <ul className="mt-16 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-6">
          <Card
            className="lg:col-span-4"
            title="A call button on every page"
            body="Visitors on a phone tap once and your phone rings. The button stays at the bottom of the screen while they read."
          >
            <CallVisual />
          </Card>
          <Card
            className="lg:col-span-2"
            delay={0.1}
            title="Requests in your inbox"
            body="Contact-form messages arrive by email and are saved in your dashboard."
          >
            <InboxVisual />
          </Card>
          <Card
            className="lg:col-span-2"
            title="Change it by asking"
            body="Type what you want changed. You get a new draft to review; nothing goes live until you publish."
          >
            <AskVisual />
          </Card>
          <Card
            className="lg:col-span-2"
            delay={0.1}
            title="Your own domain"
            body="Connect a domain you own on Pro and Premium. We show the records to add and check them for you."
          >
            <DomainVisual />
          </Card>
          <Card
            className="lg:col-span-2"
            delay={0.2}
            title="Set up for search"
            body="Every site gets a page title and a description written for your business, so Google knows what you do and where."
          >
            <GoogleVisual />
          </Card>
          <Card
            className="md:col-span-2 lg:col-span-6"
            title="Looks right on every screen"
            body="Your site is built for phones first, where most of your customers will see it, and still looks sharp on a computer."
          >
            <DevicesVisual />
          </Card>
        </ul>
      </div>
    </section>
  );
}
