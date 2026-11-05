"use client";

import Image from "next/image";
import { useState } from "react";
import { KINDS } from "./HeroStepper";

// "What you get" (#what): as TELAS REAIS da No Sweat (capturas do app rodando, com dados de
// demonstração de um negócio inventado, avisado na legenda), nada desenhado. À esquerda, três
// abas (Website, Clients, Instagram); à direita, a captura da aba escolhida, maior que a coluna,
// sangrando para fora da página no computador. A captura do site rola devagar ao passar o mouse.
// Capturas em public/landing/real (regravar: ver docs/design/README.md, "Validação").

const TABS = [
  {
    id: "website",
    title: "Website",
    body: "Every page a customer needs before they call you: services and fees, hours, a contact form and a call button.",
    src: "/landing/real/site.webp",
    width: 1280,
    height: 2400,
    alt: "The Mercer Law example site made with No Sweat: a large serif headline, “Family and estate law in German Village”, a photo of law books and the office’s story.",
    caption: "Mercer Law, an example site. The business is made up.",
    tall: true,
  },
  {
    id: "clients",
    title: "Clients",
    body: "Every request from your contact form lands in one list. Reply, quote and move each one along.",
    src: "/landing/real/clients.webp",
    width: 1400,
    height: 1018,
    alt: "The No Sweat Clients screen with five new requests from the contact form, each with a Reply button.",
    caption: "The real Clients screen, with demo requests.",
    tall: false,
  },
  {
    id: "social",
    title: "Instagram",
    body: "We draft posts from your website. Nothing goes out until you approve it. Needs an Instagram professional account.",
    src: "/landing/real/social.webp",
    width: 1400,
    height: 1018,
    alt: "The No Sweat Social screen: a connected Instagram account, the monthly posting plan and a November calendar with a post waiting for approval.",
    caption: "The real Social screen, with a demo account.",
    tall: false,
  },
] as const;

const focus =
  "focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#0066ff]";

export function WhatYouGet() {
  const [active, setActive] = useState(0);
  const tab = TABS[active] ?? TABS[0];

  const preset = (label: string) => {
    window.dispatchEvent(new CustomEvent("ns:preset-kind", { detail: label }));
    document.getElementById("start")?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  };

  return (
    <section
      id="what"
      aria-labelledby="what-title"
      className="scroll-mt-14 overflow-x-clip py-20 lg:py-28"
    >
      <div className="mx-auto grid w-full max-w-[1240px] grid-cols-1 gap-10 px-5 sm:px-8 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-4">
          <span className="lp-tag">What you get</span>
          <h2 id="what-title" className="lp-h mt-6 text-[clamp(1.9rem,3.4vw,2.9rem)]">
            Not just a website.
            <br />
            <span className="dim">The tools around it.</span>
          </h2>

          <div
            role="tablist"
            aria-label="What you get"
            className="mt-10 border-t border-[var(--lp-hair)]"
          >
            {TABS.map((t, i) => (
              <button
                key={t.id}
                id={`tab-${t.id}`}
                role="tab"
                type="button"
                aria-selected={i === active}
                aria-controls="what-panel"
                onClick={() => setActive(i)}
                onMouseEnter={() => setActive(i)}
                className={`lp-tab group block w-full border-b border-[var(--lp-hair)] py-5 text-left ${focus}`}
              >
                <span className="flex items-baseline gap-4">
                  <span className="w-6 text-[12px] font-semibold tabular-nums text-[#86868b]">
                    0{i + 1}
                  </span>
                  <span
                    className={`text-[clamp(1.4rem,2vw,1.75rem)] font-semibold tracking-[-0.025em] transition-colors duration-300 ${
                      i === active ? "text-[#071b33]" : "text-[#aeaeb4] group-hover:text-[#6e6e73]"
                    }`}
                  >
                    {t.title}
                  </span>
                </span>
                <span
                  className={`grid pl-10 transition-[grid-template-rows,opacity] duration-500 ${
                    i === active ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <span className="overflow-hidden">
                    <span className="block pt-2 text-[15px] leading-[1.55] text-[#6e6e73]">
                      {t.body}
                    </span>
                  </span>
                </span>
              </button>
            ))}
          </div>

          <p className="mt-8 text-[13px] text-[#6e6e73]">Start with your kind of business:</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {KINDS.slice(0, 4).map((k) => (
              <button
                key={k.label}
                type="button"
                onClick={() => preset(k.label)}
                className={`lp-chip px-3.5 py-2 text-[13.5px] ${focus}`}
              >
                {k.label}
              </button>
            ))}
          </div>
        </div>

        <figure
          id="what-panel"
          role="tabpanel"
          aria-labelledby={`tab-${tab.id}`}
          className="lg:col-span-8 lg:-mr-[max(2rem,calc((100vw-1240px)/2+2rem))]"
        >
          <div
            className={`lp-shot relative overflow-hidden rounded-xl border border-black/10 bg-white shadow-[0_1px_2px_rgb(7_27_51/.05),0_24px_60px_-28px_rgb(7_27_51/.35)] ${
              tab.tall ? "aspect-[16/10]" : "aspect-[1400/1018]"
            }`}
          >
            {TABS.map((t, i) => (
              <Image
                key={t.id}
                src={t.src}
                width={t.width}
                height={t.height}
                alt={i === active ? t.alt : ""}
                aria-hidden={i !== active}
                sizes="(min-width: 1024px) 60vw, 100vw"
                className={`absolute inset-x-0 top-0 h-auto w-full transition-opacity duration-500 ${
                  t.tall ? "lp-pan" : ""
                } ${i === active ? "opacity-100" : "opacity-0"}`}
              />
            ))}
          </div>
          <figcaption className="mt-3 text-[12.5px] text-[#6e6e73]">{tab.caption}</figcaption>
        </figure>
      </div>
    </section>
  );
}
