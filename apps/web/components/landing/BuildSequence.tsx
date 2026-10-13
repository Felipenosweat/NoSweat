"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { container } from "@/components/marketing/styles";

// A peça central da V5: a seção fica fixa na tela enquanto a pessoa rola, e o site se monta
// peça por peça (topo, título, foto, horário), depois recebe um pedido de mudança e é publicado.
// As camadas são recortes reais do site de exemplo "Sparkle & Co. Cleaning" (fictício), com as
// posições MEDIDAS no navegador (1280×860). Celular e movimento reduzido: versão estática.

const SENTENCE =
  "Sparkle & Co. Cleaning: weekly and move-out house cleaning in Worcester, MA. Call (508) 555-0142.";

const STEPS = [
  {
    title: "Describe your business",
    body: "One sentence, the way you’d say it to a customer: what you do, where, and how to reach you.",
  },
  {
    title: "We build the site",
    body: "Your headline, services, hours, photo, phone button and contact form, laid out for your trade.",
  },
  {
    title: "Change it by asking",
    body: "“Add our Saturday hours.” Type it like a text message and get a new draft to review.",
  },
  {
    title: "Publish. Get calls.",
    body: "Go live on a free address or your own domain. Requests from the contact form go to your email.",
  },
];

// Caixas em % do quadro 1280×860 (medidas no site de exemplo).
const LAYERS = {
  header: { x: 0, y: 0, w: 100, h: 14.07 },
  text: { x: 7.5, y: 31.22, w: 45.63, h: 51.05 },
  photo: { x: 57.5, y: 14.07, w: 42.5, h: 63.26 },
  hours: { x: 53.75, y: 64.3, w: 30, h: 28.6 },
} as const;

const box = (b: { x: number; y: number; w: number; h: number }) => ({
  left: `${b.x}%`,
  top: `${b.y}%`,
  width: `${b.w}%`,
  height: `${b.h}%`,
});

/** Momento da rolagem (0–1) em que cada passo começa. */
const STEP_AT = [0, 0.2, 0.58, 0.78];

export function BuildSequence() {
  const section = useRef<HTMLElement>(null);
  const [step, setStep] = useState(0);
  const typed = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();
    mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
      const root = section.current;
      if (!root) return;
      const q = gsap.utils.selector(root);
      const counter = { n: 0 };
      const write = () => {
        if (typed.current) typed.current.textContent = SENTENCE.slice(0, Math.round(counter.n));
      };
      write();

      const tl = gsap.timeline({
        defaults: { ease: "power2.out" },
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.6,
          onUpdate: (self) => {
            const p = self.progress;
            const next = STEP_AT.reduce((acc, at, i) => (p >= at ? i : acc), 0);
            setStep((current) => (current === next ? current : next));
          },
        },
      });

      tl.to(counter, { n: SENTENCE.length, duration: 0.18, ease: "none", onUpdate: write }, 0)
        .from(q("[data-layer='header']"), { yPercent: -110, duration: 0.07 }, 0.2)
        .fromTo(
          q("[data-layer='text']"),
          { clipPath: "inset(0 0 100% 0)" },
          { clipPath: "inset(0 0 0% 0)", duration: 0.1 },
          0.27,
        )
        .fromTo(
          q("[data-layer='photo']"),
          { clipPath: "inset(0 0 0 100%)" },
          { clipPath: "inset(0 0 0 0%)", duration: 0.1 },
          0.37,
        )
        .from(q("[data-layer='photo'] img"), { scale: 1.25, duration: 0.12 }, 0.37)
        .from(q("[data-layer='hours']"), { y: 80, opacity: 0, scale: 0.9, duration: 0.08 }, 0.47)
        .to(q("[data-skeleton]"), { opacity: 0, duration: 0.06 }, 0.5)
        .from(q("[data-chat]"), { y: 30, opacity: 0, duration: 0.06 }, 0.6)
        .from(q("[data-chat-reply]"), { y: 20, opacity: 0, duration: 0.05 }, 0.68)
        .from(q("[data-updated]"), { opacity: 0, duration: 0.04 }, 0.7)
        .to(q("[data-chat]"), { opacity: 0, y: -20, duration: 0.04 }, 0.79)
        .to(q("[data-url-draft]"), { opacity: 0, duration: 0.03 }, 0.8)
        .from(q("[data-url-live]"), { opacity: 0, duration: 0.03 }, 0.81)
        .from(q("[data-live]"), { scale: 0.6, opacity: 0, duration: 0.04 }, 0.82)
        .from(q("[data-phone]"), { x: 160, y: 60, rotate: 10, opacity: 0, duration: 0.1 }, 0.84)
        .to({}, { duration: 0.06 });

      return () => setStep(0);
    });
    return () => mm.revert();
  }, []);

  const current = STEPS[step] ?? STEPS[0]!;

  return (
    <section
      id="build"
      ref={section}
      aria-labelledby="build-title"
      className="relative scroll-mt-0 overflow-x-clip lg:h-[420vh] lg:motion-reduce:h-auto"
    >
      <div className="lg:sticky lg:top-0 lg:flex lg:h-[100svh] lg:items-center lg:overflow-hidden lg:motion-reduce:static lg:motion-reduce:h-auto">
        <div
          className={`${container} grid grid-cols-1 gap-12 py-24 lg:grid-cols-12 lg:gap-10 lg:py-0`}
        >
          {/* ---------- Texto ---------- */}
          <div className="min-w-0 lg:col-span-5 lg:self-center">
            <p className="text-[13px] font-semibold tracking-[0.2em] text-[#00c2ff] uppercase">
              How it works
            </p>
            <h2
              id="build-title"
              className="l-display mt-4 text-[clamp(2.5rem,5vw,4.5rem)] text-white"
            >
              Watch a website <span className="l-serif l-gradient-text">build itself.</span>
            </h2>

            {/* Celular / movimento reduzido: lista dos 4 passos. */}
            <ol className="mt-10 grid gap-6 lg:hidden lg:motion-reduce:grid">
              {STEPS.map((s, i) => (
                <li key={s.title} className="flex gap-4">
                  <span className="l-display text-2xl text-[#3d8bff] tabular-nums">0{i + 1}</span>
                  <span>
                    <span className="block text-lg font-semibold text-white">{s.title}</span>
                    <span className="mt-1 block leading-relaxed text-slate-300">{s.body}</span>
                  </span>
                </li>
              ))}
            </ol>

            {/* Computador com movimento: o passo atual, grande. */}
            <div className="mt-10 hidden lg:block lg:motion-reduce:hidden" aria-live="polite">
              <div className="flex items-baseline gap-4">
                <span className="l-display text-[5.5rem] leading-none text-[#3d8bff] tabular-nums">
                  0{step + 1}
                </span>
                <span className="text-sm text-slate-400 tabular-nums">/ 04</span>
              </div>
              <p className="mt-4 text-2xl font-semibold text-white">{current.title}</p>
              <p className="mt-2 max-w-[38ch] text-lg leading-relaxed text-slate-300">
                {current.body}
              </p>
              <div className="mt-8 flex gap-2" aria-hidden="true">
                {STEPS.map((s, i) => (
                  <span
                    key={s.title}
                    className={`h-1 rounded-full transition-all duration-500 ${
                      i <= step ? "w-12 bg-[#3d8bff]" : "w-6 bg-white/15"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* A frase sendo digitada. */}
            <div className="mt-10 hidden rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur lg:block lg:motion-reduce:hidden">
              <p className="text-[13px] text-slate-400">What the owner typed</p>
              <p className="mt-2 min-h-[3.4em] text-[17px] leading-relaxed text-white">
                <span ref={typed} />
                <span
                  aria-hidden="true"
                  className="ml-0.5 inline-block h-5 w-0.5 translate-y-1 animate-pulse bg-[#00c2ff]"
                />
              </p>
            </div>
          </div>

          {/* ---------- O site sendo montado ---------- */}
          <div className="relative min-w-0 lg:col-span-7 lg:self-center">
            <div
              aria-hidden="true"
              className="absolute -inset-10 -z-10 rounded-full bg-[radial-gradient(closest-side,rgb(0_102_255/.35),transparent)] blur-2xl"
            />
            <figure className="overflow-hidden rounded-2xl border border-white/15 bg-[#0b1a33] shadow-[0_40px_120px_-30px_rgb(0_102_255/.5)]">
              {/* Barra do navegador */}
              <div className="flex h-11 items-center gap-3 border-b border-white/10 px-4">
                <span aria-hidden="true" className="flex gap-1.5">
                  <span className="size-2.5 rounded-full bg-white/20" />
                  <span className="size-2.5 rounded-full bg-white/20" />
                  <span className="size-2.5 rounded-full bg-white/20" />
                </span>
                <span className="relative flex h-7 min-w-0 flex-1 items-center rounded-md bg-white/[0.06] px-3 text-xs text-slate-300">
                  <span data-url-draft className="truncate lg:motion-reduce:hidden max-lg:hidden">
                    nosweatfd.com/create
                  </span>
                  <span
                    data-url-live
                    className="truncate lg:absolute lg:inset-y-0 lg:left-3 lg:flex lg:items-center lg:motion-reduce:static"
                  >
                    nosweatfd.com/s/<span className="text-[#00c2ff]">sparkle-co-cleaning</span>
                  </span>
                </span>
                <span
                  data-live
                  className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-2.5 py-1 text-xs font-semibold text-emerald-300"
                >
                  <span className="size-1.5 rounded-full bg-emerald-300" />
                  Live
                </span>
              </div>

              {/* Quadro 1280×860 com as camadas */}
              <div className="relative aspect-[1280/860] overflow-hidden bg-[#f5f6f6]">
                {/* Esqueleto (só na montagem) */}
                <div
                  data-skeleton
                  aria-hidden="true"
                  className="absolute inset-0 hidden lg:block lg:motion-reduce:hidden"
                >
                  <div className="l-skeleton absolute rounded-sm" style={box(LAYERS.header)} />
                  <div className="l-skeleton absolute rounded-lg" style={box(LAYERS.text)} />
                  <div className="l-skeleton absolute rounded-lg" style={box(LAYERS.photo)} />
                </div>
                <div data-layer="header" className="absolute" style={box(LAYERS.header)}>
                  <Image
                    src="/landing/build/header.webp"
                    alt=""
                    fill
                    sizes="720px"
                    className="object-cover"
                  />
                </div>
                <div data-layer="text" className="absolute" style={box(LAYERS.text)}>
                  <Image
                    src="/landing/build/text.webp"
                    alt=""
                    fill
                    sizes="340px"
                    className="object-cover"
                  />
                </div>
                <div
                  data-layer="photo"
                  className="absolute overflow-hidden"
                  style={box(LAYERS.photo)}
                >
                  <Image
                    src="/landing/build/photo.webp"
                    alt=""
                    fill
                    sizes="320px"
                    className="object-cover"
                  />
                </div>
                <div data-layer="hours" className="absolute" style={box(LAYERS.hours)}>
                  <Image
                    src="/landing/build/hours.webp"
                    alt=""
                    fill
                    sizes="240px"
                    className="object-cover"
                  />
                  <span
                    data-updated
                    className="absolute -top-3 right-4 rounded-full bg-[#0066ff] px-2.5 py-1 text-[11px] font-semibold text-white shadow-lg max-lg:hidden lg:motion-reduce:hidden"
                  >
                    Updated
                  </span>
                </div>

                {/* Pedido de mudança (passo 3) */}
                <div
                  data-chat
                  className="absolute bottom-[6%] left-[6%] hidden w-[46%] flex-col gap-2 lg:flex lg:motion-reduce:hidden"
                >
                  <p className="self-start rounded-2xl rounded-bl-md bg-[#071b33] px-4 py-2.5 text-[13px] leading-snug text-white shadow-xl">
                    Add our Saturday hours, 9 to 2.
                  </p>
                  <p
                    data-chat-reply
                    className="self-end rounded-2xl rounded-br-md bg-white px-4 py-2.5 text-[13px] leading-snug text-[#071b33] shadow-xl ring-1 ring-black/5"
                  >
                    ✓ Done. Saturday 9 AM – 2 PM is on your site.
                  </p>
                </div>
              </div>
              <figcaption className="sr-only">
                Example website for Sparkle &amp; Co. Cleaning, a fictional cleaning business, built
                by No Sweat and published at nosweatfd.com/s/sparkle-co-cleaning.
              </figcaption>
            </figure>

            {/* Celular que entra no final */}
            <div
              data-phone
              aria-hidden="true"
              className="absolute -right-4 -bottom-16 hidden w-[24%] overflow-hidden rounded-[1.6rem] border-[5px] border-[#0b1a33] shadow-[0_30px_80px_-10px_rgb(0_0_0/.8)] ring-1 ring-white/20 lg:block xl:-right-10"
            >
              <Image
                src="/landing/wall/phone-sparkle-cleaning-top.webp"
                alt=""
                width={520}
                height={1126}
                sizes="200px"
                className="block h-auto w-full"
              />
            </div>
            <p className="mt-4 text-[13px] text-slate-400">
              Fictional example business. Real No Sweat output.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
