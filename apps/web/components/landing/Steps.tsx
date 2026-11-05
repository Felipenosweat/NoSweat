"use client";

import { Unbounded } from "next/font/google";
import { useEffect, useRef, useState } from "react";

// "How it works" (#story), direto no fundo cinza: o slogan em caixa alta numa fonte larga
// (Unbounded, só nesta seção, sem preload) e os quatro passos como cartões brancos arredondados
// lado a lado, que rolam de lado (com o dedo ou pelas setas). Cada cartão tem um desenho de
// linha simples, nas cores da marca, do que acontece naquele passo. Só o que o produto faz hoje.

const wide = Unbounded({
  subsets: ["latin"],
  weight: ["700"],
  display: "swap",
  preload: false,
  variable: "--font-lp-wide",
});

const BLUE = "#0066ff";
const INK = "#071b33";
const SOFT = "#d6dce6";

// Desenhos dos passos (decorativos: o texto do cartão já diz tudo).
function AnswerArt() {
  return (
    <svg viewBox="0 0 220 120" className="h-auto w-full max-w-[220px]" aria-hidden="true">
      {[14, 50, 86].map((y, i) => (
        <g key={y}>
          <rect
            x="20"
            y={y}
            width="180"
            height="24"
            rx="12"
            fill={i === 1 ? "#eef4ff" : "#fff"}
            stroke={i === 1 ? BLUE : SOFT}
            strokeDasharray={i === 1 ? undefined : "3 3"}
          />
          <rect
            x="34"
            y={y + 10}
            width={i === 1 ? 74 : 54}
            height="4"
            rx="2"
            fill={i === 1 ? INK : SOFT}
          />
          <rect
            x="164"
            y={y + 6}
            width="24"
            height="12"
            rx="6"
            fill={i === 1 ? BLUE : "#fff"}
            stroke={i === 1 ? BLUE : INK}
          />
          <circle cx={i === 1 ? 182 : 170} cy={y + 12} r="3.5" fill={i === 1 ? "#fff" : INK} />
        </g>
      ))}
    </svg>
  );
}

function DraftArt() {
  return (
    <svg viewBox="0 0 220 120" className="h-auto w-full max-w-[220px]" aria-hidden="true">
      <rect x="30" y="8" width="160" height="106" rx="12" fill="#fff" stroke={SOFT} />
      <line x1="30" y1="26" x2="190" y2="26" stroke={SOFT} />
      {[42, 52, 62].map((x) => (
        <circle key={x} cx={x} cy="17" r="3" fill={SOFT} />
      ))}
      <rect x="44" y="38" width="92" height="8" rx="4" fill={INK} />
      <rect x="44" y="52" width="62" height="5" rx="2.5" fill={SOFT} />
      <rect x="44" y="64" width="40" height="12" rx="6" fill={BLUE} />
      <rect x="44" y="86" width="40" height="18" rx="5" fill="#eef1f6" />
      <rect x="90" y="86" width="40" height="18" rx="5" fill="#eef1f6" />
      <rect x="136" y="86" width="40" height="18" rx="5" fill="#eef4ff" stroke={BLUE} />
    </svg>
  );
}

function EditArt() {
  return (
    <svg viewBox="0 0 220 120" className="h-auto w-full max-w-[220px]" aria-hidden="true">
      <rect x="24" y="22" width="150" height="10" rx="5" fill={SOFT} />
      <rect x="24" y="44" width="40" height="10" rx="5" fill={SOFT} />
      <rect x="68" y="40" width="96" height="18" rx="4" fill="#e3edff" />
      <rect x="72" y="44" width="88" height="10" rx="5" fill={BLUE} />
      <line x1="164" y1="36" x2="164" y2="62" stroke={BLUE} strokeWidth="2" />
      <rect x="24" y="68" width="120" height="10" rx="5" fill={SOFT} />
      <path
        d="M150 70 L150 100 L158 92 L164 106 L170 103 L164 90 L175 90 Z"
        fill="#fff"
        stroke={INK}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LiveArt() {
  return (
    <svg viewBox="0 0 220 120" className="h-auto w-full max-w-[220px]" aria-hidden="true">
      <circle cx="56" cy="60" r="34" fill="#fff" stroke={SOFT} />
      <ellipse cx="56" cy="60" rx="14" ry="34" fill="none" stroke={SOFT} />
      <line x1="22" y1="60" x2="90" y2="60" stroke={SOFT} />
      <circle cx="56" cy="60" r="6" fill={BLUE} />
      <path d="M62 60 H112" stroke={INK} strokeDasharray="2 4" strokeLinecap="round" />
      <rect x="112" y="46" width="94" height="28" rx="14" fill="#eef4ff" stroke={BLUE} />
      <circle cx="128" cy="60" r="4" fill={BLUE} />
      <rect x="140" y="57" width="54" height="6" rx="3" fill={INK} />
    </svg>
  );
}

const STEPS = [
  {
    title: "Answer a few questions",
    body: "What you do and where. About a minute.",
    Art: AnswerArt,
  },
  {
    title: "Get your first draft",
    body: "Pages, words and a contact form, set up for your business.",
    Art: DraftArt,
  },
  {
    title: "Change anything",
    body: "Click to edit, or ask the AI in plain words.",
    Art: EditArt,
  },
  {
    title: "Go live",
    body: "A free nosweatfd.com address, or your own domain on Pro.",
    Art: LiveArt,
  },
];

const focus =
  "focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#0066ff]";

export function Steps() {
  const track = useRef<HTMLOListElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const update = () =>
      setEdge({
        start: el.scrollLeft <= 4,
        end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4,
      });
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const move = (dir: 1 | -1) => {
    const el = track.current;
    const card = el?.firstElementChild as HTMLElement | null;
    if (!el || !card) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: dir * (card.offsetWidth + 16), behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <section
      id="story"
      aria-labelledby="story-title"
      className={`${wide.variable} scroll-mt-14 overflow-x-clip py-20 lg:py-28`}
    >
      <div className="mx-auto flex w-full max-w-[1280px] items-end justify-between gap-6 px-5 sm:px-10 lg:px-16">
        <h2
          id="story-title"
          className="lp-wide text-[clamp(1.6rem,3.6vw,3.2rem)] leading-[1.02] text-[#071b33]"
        >
          Start with a few answers.
          <br />
          <span className="text-[#0066ff]">Build with clarity.</span>
        </h2>
        <div className="hidden shrink-0 gap-2 sm:flex">
          <button
            type="button"
            onClick={() => move(-1)}
            disabled={edge.start}
            aria-label="Previous step"
            className={`lp-round w-10 ${focus}`}
          >
            <span aria-hidden="true">←</span>
          </button>
          <button
            type="button"
            onClick={() => move(1)}
            disabled={edge.end}
            aria-label="Next step"
            className={`lp-round lp-round-blue ${focus}`}
          >
            <span aria-hidden="true">⟶</span>
          </button>
        </div>
      </div>

      {/* A trilha começa alinhada ao título e corre até a borda da tela. */}
      <ol
        ref={track}
        className="lp-cards mt-10 flex gap-4 overflow-x-auto px-5 pb-2 sm:px-10 lg:mt-14 lp-track"
      >
        {STEPS.map(({ title, body, Art }, index) => (
          <li
            key={title}
            className="flex w-[min(82vw,360px)] shrink-0 flex-col items-center rounded-[28px] bg-white px-7 pt-9 pb-8 text-center"
          >
            <span className="text-[12px] font-semibold tracking-[0.14em] text-[#0066ff] tabular-nums">
              STEP {index + 1}
            </span>
            <h3 className="mt-3 text-[21px] leading-tight font-semibold tracking-[-0.02em] text-[#071b33]">
              {title}
            </h3>
            <p className="mt-2 max-w-[28ch] text-[14.5px] leading-[1.55] text-[#6e6e73]">{body}</p>
            <div className="mt-auto flex w-full justify-center pt-8">
              <Art />
            </div>
          </li>
        ))}
        {/* Folga no fim para o último cartão encostar no começo da trilha ao rolar. */}
        <li aria-hidden="true" className="w-px shrink-0" />
      </ol>
    </section>
  );
}
