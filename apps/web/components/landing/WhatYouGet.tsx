"use client";

import Image from "next/image";
import { useRef, useState, type KeyboardEvent } from "react";
import { Pill } from "./Pill";
import { bodyClass, focusRing, h2Class, smallClass } from "./type";

// "What you get" (#what), numa bolha branca: título à esquerda, uma frase e o botão à direita;
// embaixo, três abas curtas (Website, Clients, Instagram) e a TELA REAL da aba escolhida
// (capturas do app rodando, com dados de demonstração de um negócio inventado, avisado na
// legenda). A captura do site rola devagar ao passar o mouse ou ao focar o painel.
// Abas pelo teclado: uma parada só no Tab; setas, Home e End trocam (a seleção segue o foco).
// Capturas em public/landing/real (regravar: ver docs/design/README.md, "Validação").
//
// Celular (< sm): o painel fica em 4:5 e cada aba tem uma mídia própria, porque a captura de
// 2400 px encolhida para 350 px fica ilegível. Website usa a captura de celular do mesmo site de
// exemplo. Clients e Social usam a MESMA captura real, ampliada e posicionada (`mobile.crop`)
// para mostrar o objeto principal inteiro e legível: é um recorte, sem montagem. O texto
// alternativo do recorte descreve só o que aparece nele.

type Tab = {
  id: string;
  title: string;
  body: string;
  src: string;
  width: number;
  height: number;
  alt: string;
  caption: string;
  /** Captura alta (o site inteiro): rola devagar no hover/foco. */
  tall: boolean;
  mobile: { src: string; width: number; height: number; alt: string; crop: string };
};

const TABS: Tab[] = [
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
    mobile: {
      src: "/landing/signature/mercer-law-m.webp",
      width: 640,
      height: 1385,
      alt: "The Mercer Law example site made with No Sweat: a large serif headline, “Family and estate law in German Village”, a photo of law books and the office’s story.",
      crop: "inset-x-0 top-0 w-full",
    },
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
    mobile: {
      src: "/landing/real/clients-2.webp",
      width: 2400,
      height: 1500,
      alt: "The No Sweat Clients screen: five new requests from the contact form, each with a name, phone number and email.",
      // Busca, etapas e as cinco linhas (nome, "New", telefone e e-mail), encostado embaixo.
      crop: "bottom-0 left-[-75%] w-[320%] max-w-none",
    },
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
    mobile: {
      src: "/landing/real/social-2.webp",
      width: 2400,
      height: 1500,
      alt: "The No Sweat Social screen: a connected Instagram account and the November calendar.",
      // Cartão do Instagram ("Connected") inteiro, "November 2026" e o começo do calendário.
      crop: "top-[-26%] left-[-66%] w-[280%] max-w-none",
    },
  },
];

export function WhatYouGet() {
  const [active, setActive] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const tab = TABS[active] ?? TABS[0];

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const last = TABS.length - 1;
    let next: number;
    if (event.key === "ArrowRight" || event.key === "ArrowDown")
      next = active === last ? 0 : active + 1;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp")
      next = active === 0 ? last : active - 1;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = last;
    else return;
    event.preventDefault();
    setActive(next);
    tabRefs.current[next]?.focus();
  };

  if (!tab) return null;

  return (
    <div className="mt-3 px-3 sm:mt-5 sm:px-5">
      <section
        id="what"
        aria-labelledby="what-title"
        className="lp-bubble scroll-mt-16 px-5 py-12 sm:px-10 lg:px-16 lg:py-16"
      >
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-x-8">
          <h2 id="what-title" className={`${h2Class} lg:col-span-6`}>
            Not just a website.
            <br />
            <span className="text-slate-500">The tools around it.</span>
          </h2>
          <div className="lg:col-span-6 lg:pt-2">
            <p className={bodyClass}>
              Your site, the requests it brings in and your Instagram, in one place. Built for
              people who would rather be working.
            </p>
            <div className="mt-6">
              <Pill href="#start">Build my website</Pill>
            </div>
          </div>
        </div>

        <div
          role="tablist"
          aria-label="What you get"
          onKeyDown={onKeyDown}
          className="mt-12 grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3"
        >
          {TABS.map((t, i) => (
            <button
              key={t.id}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              id={`tab-${t.id}`}
              role="tab"
              type="button"
              tabIndex={i === active ? 0 : -1}
              aria-selected={i === active}
              aria-controls="what-panel"
              onClick={() => setActive(i)}
              onMouseEnter={() => setActive(i)}
              className={`flex min-h-11 flex-col items-start justify-start rounded-xl px-5 py-4 text-left transition-colors duration-200 ${focusRing} ${
                i === active ? "bg-slate-100" : "hover:bg-slate-50"
              }`}
            >
              <span className="flex items-center gap-2.5">
                {/* O quadrado azul marca a aba ativa; nas outras fica só o espaço dele, para o
                    texto não andar. */}
                <span
                  aria-hidden="true"
                  className={`size-1.5 shrink-0 ${i === active ? "bg-brand" : ""}`}
                />
                <span className="text-[17px] leading-snug font-semibold text-ink">{t.title}</span>
              </span>
              <span className={`mt-1 block pl-4 ${smallClass}`}>{t.body}</span>
            </button>
          ))}
        </div>

        <div
          id="what-panel"
          role="tabpanel"
          aria-labelledby={`tab-${tab.id}`}
          tabIndex={0}
          className="group/panel mt-4 outline-none sm:mt-6"
        >
          <figure>
            <div className="lp-shot relative aspect-[4/5] overflow-hidden rounded-xl border border-slate-200 bg-slate-100 group-focus-visible/panel:outline-2 group-focus-visible/panel:outline-offset-2 group-focus-visible/panel:outline-brand sm:aspect-[16/10]">
              {TABS.map((t, i) => (
                <Image
                  key={t.id}
                  src={t.src}
                  width={t.width}
                  height={t.height}
                  alt={i === active ? t.alt : ""}
                  aria-hidden={i !== active}
                  sizes="(min-width: 1280px) 1150px, (min-width: 640px) 100vw, 1px"
                  className={`absolute inset-x-0 top-0 hidden h-auto w-full transition-opacity duration-200 motion-reduce:transition-none sm:block ${
                    t.tall ? "lp-pan" : ""
                  } ${i === active ? "opacity-100" : "opacity-0"}`}
                />
              ))}
              {/* Celular: mídia própria de cada aba (as de cima nem são baixadas: display none). */}
              {TABS.map((t, i) => (
                <Image
                  key={t.id}
                  src={t.mobile.src}
                  width={t.mobile.width}
                  height={t.mobile.height}
                  alt={i === active ? t.mobile.alt : ""}
                  aria-hidden={i !== active}
                  sizes="(min-width: 640px) 1px, 200vw"
                  className={`absolute h-auto transition-opacity duration-200 motion-reduce:transition-none sm:hidden ${t.mobile.crop} ${
                    i === active ? "opacity-100" : "opacity-0"
                  }`}
                />
              ))}
            </div>
            <figcaption className={`mt-3 ${smallClass}`}>{tab.caption}</figcaption>
          </figure>
        </div>
      </section>
    </div>
  );
}
