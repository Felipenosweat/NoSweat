"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { BrowserFrame } from "./BrowserFrame";

// "From a sentence to a live site": 4 passos à esquerda e, no desktop, uma moldura fixa
// (sticky) à direita que troca a captura de tela conforme o passo ativo.
// No celular e com movimento reduzido: tudo empilhado, cada captura embaixo do seu passo.
// As capturas (2560×1720) são telas reais do app geradas pela sessão principal.

type Step = {
  title: string;
  body: string;
  shot: string;
  alt: string;
  address: string;
};

const STEPS: Step[] = [
  {
    title: "Describe your business",
    body: "A sentence or two in plain English: what you do, where, and how customers reach you. Add your city and anything else you want on the site.",
    shot: "/shots/story-create.webp",
    alt: "The No Sweat create screen with a short business description filled in",
    address: "nosweatfd.com/create",
  },
  {
    title: "We build the draft",
    body: "We pick one of five industry templates and one of ten font pairings, write your headline, services and FAQ, and choose your colors. It takes seconds.",
    shot: "/shots/story-building.webp",
    alt: "The building screen checking off each step of the new site",
    address: "nosweatfd.com/create",
  },
  {
    title: "Change it by asking",
    body: "Type “add a deep-cleaning service” or “make it warmer” and get a new draft to review. Or edit text, colors and sections yourself with a live preview.",
    shot: "/shots/story-editor.webp",
    alt: "The editor with the Ask AI panel next to a live preview of the site",
    address: "nosweatfd.com/sites/edit",
  },
  {
    title: "Publish and get requests",
    body: "Go live on nosweatfd.com/s/your-business or your own domain. Contact-form requests arrive by email and in your dashboard.",
    shot: "/shots/story-publish.webp",
    alt: "The publish dialog showing the live address of the site",
    address: "nosweatfd.com/sites",
  },
];

const SHOT_WIDTH = 2560;
const SHOT_HEIGHT = 1720;

export function StoryScroll() {
  const [active, setActive] = useState(0);
  const current = STEPS[active] ?? STEPS[0]!;
  const stepRefs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    // Linha no meio da tela: o passo que cruza essa linha é o ativo.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = stepRefs.current.indexOf(entry.target as HTMLLIElement);
          if (index >= 0) setActive(index);
        }
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    stepRefs.current.forEach((step) => step && observer.observe(step));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="grid gap-y-16 lg:grid-cols-12 lg:gap-x-8">
      <ol className="grid gap-y-16 lg:col-span-5 lg:gap-y-0 lg:motion-reduce:col-span-12 lg:motion-reduce:gap-y-24">
        {STEPS.map((step, index) => {
          const isActive = index === active;
          return (
            <li
              key={step.title}
              ref={(element) => {
                stepRefs.current[index] = element;
              }}
              data-active={isActive || undefined}
              className="group lg:flex lg:min-h-[70svh] lg:flex-col lg:justify-center lg:motion-reduce:grid lg:motion-reduce:min-h-0 lg:motion-reduce:grid-cols-12 lg:motion-reduce:items-center lg:motion-reduce:gap-x-8"
            >
              <div className="border-l-2 border-slate-200 pl-5 transition-colors duration-200 lg:group-data-active:border-brand lg:motion-reduce:col-span-5 lg:motion-reduce:border-slate-200">
                <p
                  aria-hidden="true"
                  className="font-display text-sm font-semibold text-slate-500 tabular-nums"
                >
                  {String(index + 1).padStart(2, "0")}
                </p>
                {/* Inativo em slate-500 (não slate-400) para manter contraste AA. */}
                <h3 className="mt-2 font-display text-lg font-semibold tracking-[-0.015em] text-ink transition-colors duration-200 lg:text-xl lg:text-slate-500 lg:group-data-active:text-ink lg:motion-reduce:text-ink">
                  {step.title}
                </h3>
                <p className="mt-2 max-w-[44ch] text-base leading-[1.65] text-pretty text-slate-600 lg:text-[17px]">
                  {step.body}
                </p>
              </div>
              {/* Captura do passo: embaixo no celular; ao lado (7 colunas) com movimento reduzido. */}
              <div className="mt-6 lg:hidden lg:motion-reduce:col-span-7 lg:motion-reduce:mt-0 lg:motion-reduce:block">
                <BrowserFrame address={step.address}>
                  <Image
                    src={step.shot}
                    alt={step.alt}
                    width={SHOT_WIDTH}
                    height={SHOT_HEIGHT}
                    sizes="(min-width: 1024px) 680px, 100vw"
                    className="block h-auto w-full bg-surface"
                  />
                </BrowserFrame>
              </div>
            </li>
          );
        })}
      </ol>

      {/* Moldura fixa do desktop. As 4 imagens ficam empilhadas e trocam por opacidade. */}
      <div className="hidden lg:col-span-7 lg:block lg:motion-reduce:hidden">
        <div className="sticky top-24">
          <BrowserFrame address={current.address}>
            <div className="relative aspect-[2560/1720] bg-surface">
              {STEPS.map((step, index) => (
                <Image
                  key={step.shot}
                  src={step.shot}
                  alt={index === active ? step.alt : ""}
                  aria-hidden={index !== active}
                  width={SHOT_WIDTH}
                  height={SHOT_HEIGHT}
                  sizes="680px"
                  className={`absolute inset-0 h-full w-full transition-opacity duration-[400ms] ease-[cubic-bezier(.2,.8,.2,1)] ${
                    index === active ? "opacity-100" : "opacity-0"
                  }`}
                />
              ))}
            </div>
          </BrowserFrame>
          <p aria-hidden="true" className="mt-3 text-[13px] text-slate-500">
            Step {active + 1} of {STEPS.length}: {current.title}
          </p>
        </div>
      </div>
    </div>
  );
}
