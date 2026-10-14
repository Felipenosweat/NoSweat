"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { container } from "@/components/marketing/styles";

// Galeria dos sites de exemplo. Computador com movimento: a seção fica fixa e os cartões
// correm na horizontal conforme a rolagem. Celular e movimento reduzido: rolagem lateral
// nativa com snap. Todos os negócios são fictícios (fixtures) e aparecem rotulados.

const EXAMPLES = [
  { slug: "joes-plumbing", name: "Joe’s Plumbing", trade: "Plumber", city: "Austin, TX" },
  {
    slug: "sparkle-cleaning",
    name: "Sparkle & Co. Cleaning",
    trade: "House cleaning",
    city: "Worcester, MA",
  },
  { slug: "glow-salon", name: "Glow Salon", trade: "Hair salon", city: "Miami, FL" },
  { slug: "rosas-kitchen", name: "Rosa’s Kitchen", trade: "Restaurant", city: "San Diego, CA" },
  { slug: "hale-ortiz", name: "Hale & Ortiz", trade: "Bookkeeping & tax", city: "Denver, CO" },
];

export function Gallery() {
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();
    mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
      const el = track.current;
      const root = section.current;
      if (!el || !root) return;
      const distance = () => el.scrollWidth - window.innerWidth + 80;
      gsap.to(el, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: () => `+=${distance()}`,
          scrub: 0.8,
          pin: true,
          invalidateOnRefresh: true,
        },
      });
      gsap.utils.toArray<HTMLElement>("[data-tilt]").forEach((card) => {
        gsap.fromTo(
          card,
          { rotate: 3, y: 40 },
          {
            rotate: -2,
            y: -20,
            ease: "none",
            scrollTrigger: {
              trigger: root,
              start: "top top",
              end: () => `+=${distance()}`,
              scrub: true,
            },
          },
        );
      });
    });
    return () => mm.revert();
  }, []);

  return (
    <section
      id="examples"
      ref={section}
      aria-labelledby="examples-title"
      className="relative overflow-hidden py-24 lg:flex lg:h-[100svh] lg:flex-col lg:justify-center lg:py-0"
    >
      <div className={`${container} flex flex-wrap items-end justify-between gap-6`}>
        <h2
          id="examples-title"
          className="l-display max-w-[14ch] text-[clamp(2.5rem,5.5vw,5rem)] text-white"
        >
          Built for <span className="l-serif l-gradient-text">your trade.</span>
        </h2>
        <p className="max-w-[36ch] text-lg leading-relaxed text-slate-300">
          A plumber, a cleaner, a salon and a restaurant need different sites. These are fictional
          examples, made by No Sweat.
        </p>
      </div>

      <div
        ref={track}
        className="mt-12 flex snap-x snap-mandatory gap-6 overflow-x-auto px-5 pb-4 [scrollbar-width:none] sm:px-8 lg:mt-16 lg:w-max lg:snap-none lg:overflow-visible lg:px-[max(2rem,calc((100vw-1200px)/2+2rem))] lg:motion-reduce:w-auto lg:motion-reduce:overflow-x-auto [&::-webkit-scrollbar]:hidden"
      >
        {EXAMPLES.map((example, i) => (
          <Link
            key={example.slug}
            href={`/examples/${example.slug}`}
            data-tilt
            className="group relative block w-[85vw] shrink-0 snap-center rounded-3xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:w-[70vw] lg:w-[min(58vw,820px)]"
          >
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0b1a33] p-3 shadow-[0_40px_100px_-30px_rgb(0_0_0/.9)] transition-colors duration-300 group-hover:border-white/25 lg:p-4">
              <div className="overflow-hidden rounded-2xl">
                <Image
                  src={`/landing/wall/${example.slug}-top.webp`}
                  alt={`Example website for ${example.name}, a fictional ${example.trade.toLowerCase()} business`}
                  width={1200}
                  height={750}
                  sizes="(min-width: 1024px) 820px, 85vw"
                  className="block h-auto w-full transition-transform duration-700 ease-[cubic-bezier(.2,.8,.2,1)] group-hover:scale-[1.03]"
                />
              </div>
              <div className="absolute right-6 bottom-6 w-[22%] overflow-hidden rounded-[1.1rem] border-4 border-[#0b1a33] shadow-2xl ring-1 ring-white/20 transition-transform duration-500 group-hover:-translate-y-2 lg:right-8 lg:bottom-8">
                <Image
                  src={`/landing/wall/phone-${example.slug}-top.webp`}
                  alt=""
                  width={520}
                  height={1126}
                  sizes="180px"
                  className="block h-auto w-full"
                />
              </div>
            </div>
            <div className="mt-5 flex items-end justify-between gap-4 px-2">
              <div>
                <p className="text-sm text-slate-400 tabular-nums">
                  0{i + 1} · {example.trade} · {example.city}
                </p>
                <h3 className="l-display mt-1 text-3xl text-white lg:text-4xl">{example.name}</h3>
              </div>
              <span className="mb-1 inline-flex shrink-0 items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 group-hover:bg-white group-hover:text-[#071b33]">
                View site <span aria-hidden="true">→</span>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
