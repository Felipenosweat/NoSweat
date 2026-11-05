"use client";

import Image from "next/image";
import { useState } from "react";
import { Pill } from "./Pill";

// "What you get" (#what), numa bolha branca: título à esquerda, uma frase e o botão à direita;
// embaixo, três abas curtas (Website, Clients, Instagram) e a TELA REAL da aba escolhida
// (capturas do app rodando, com dados de demonstração de um negócio inventado, avisado na
// legenda). A captura do site rola devagar ao passar o mouse.
// Capturas em public/landing/real (regravar: ver docs/design/README.md, "Validação").

const TABS = [
  {
    id: "website",
    title: "Website",
    body: "Services, hours, a contact form and a call button.",
    src: "/landing/real/site-2.webp",
    width: 2000,
    height: 3750,
    alt: "The Mercer Law example site made with No Sweat: a large serif headline, “Family and estate law in German Village”, a photo of law books and the office’s story.",
    caption: "Mercer Law, an example site. The business is made up.",
    tall: true,
  },
  {
    id: "clients",
    title: "Clients",
    body: "Every request from your site, in one list.",
    src: "/landing/real/clients-2.webp",
    width: 2400,
    height: 1500,
    alt: "The No Sweat Clients screen with five new requests from the contact form, each with a Reply button.",
    caption: "The real Clients screen, with demo requests.",
    tall: false,
  },
  {
    id: "social",
    title: "Instagram",
    body: "Posts drafted for you. Nothing goes out until you approve it.",
    src: "/landing/real/social-2.webp",
    width: 2400,
    height: 1500,
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

  return (
    <div className="mt-3 px-3 sm:mt-5 sm:px-5">
      <section
        id="what"
        aria-labelledby="what-title"
        className="lp-bubble scroll-mt-16 px-5 py-12 sm:px-10 lg:px-16 lg:py-16"
      >
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-12">
          <h2 id="what-title" className="lp-h text-[clamp(1.9rem,3.4vw,2.9rem)]">
            Not just a website.
            <br />
            <span className="dim">The tools around it.</span>
          </h2>
          <div className="lg:pt-2">
            <p className="max-w-[44ch] text-[16px] leading-[1.6] text-[#6e6e73]">
              Your site, the requests it brings in and your Instagram, in one place. Built for
              people who would rather be working.
            </p>
            <div className="mt-6">
              <Pill href="#start">Start free</Pill>
            </div>
          </div>
        </div>

        <div
          role="tablist"
          aria-label="What you get"
          className="mt-12 grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3"
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
              className={`flex flex-col items-start justify-start rounded-[20px] px-5 py-4 text-left transition-colors duration-300 ${focus} ${
                i === active ? "bg-[#eef1f6]" : "hover:bg-[#f5f6f9]"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <span
                  aria-hidden="true"
                  className={`size-2 rounded-full transition-colors duration-300 ${
                    i === active ? "bg-[#0066ff]" : "bg-[#d2d6de]"
                  }`}
                />
                <span className="text-[17px] font-semibold tracking-[-0.02em] text-[#071b33]">
                  {t.title}
                </span>
              </span>
              <span className="mt-1 block pl-[18px] text-[14px] leading-[1.5] text-[#6e6e73]">
                {t.body}
              </span>
            </button>
          ))}
        </div>

        <figure
          id="what-panel"
          role="tabpanel"
          aria-labelledby={`tab-${tab.id}`}
          className="mt-4 sm:mt-6"
        >
          <div
            className={`lp-shot relative overflow-hidden rounded-[20px] border border-black/[0.07] bg-[#eef1f6] aspect-[16/10]`}
          >
            {TABS.map((t, i) => (
              <Image
                key={t.id}
                src={t.src}
                width={t.width}
                height={t.height}
                alt={i === active ? t.alt : ""}
                aria-hidden={i !== active}
                sizes="(min-width: 1280px) 1150px, 100vw"
                className={`absolute inset-x-0 top-0 h-auto w-full transition-opacity duration-500 ${
                  t.tall ? "lp-pan" : ""
                } ${i === active ? "opacity-100" : "opacity-0"}`}
              />
            ))}
          </div>
          <figcaption className="mt-3 text-[12.5px] text-[#6e6e73]">{tab.caption}</figcaption>
        </figure>
      </section>
    </div>
  );
}
