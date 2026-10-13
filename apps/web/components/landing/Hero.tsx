import Image from "next/image";
import type { CSSProperties } from "react";
import { PromptForm } from "@/components/marketing/PromptForm";
import { container } from "@/components/marketing/styles";

// Hero da V5: título gigante entrando linha a linha (CSS puro, aparece antes do JS), campo real
// e, atrás/ao lado, uma parede 3D de sites de verdade gerados pela No Sweat (as 4 fixtures,
// negócios fictícios) rolando em colunas. A parede é decorativa (aria-hidden).

const SLUGS = ["joes-plumbing", "sparkle-cleaning", "glow-salon", "rosas-kitchen"] as const;
const PARTS = ["top", "services", "contact", "faq"] as const;

type Tile = { src: string; phone: boolean };

/** Monta as colunas misturando cortes de computador e telas de celular. */
function columns(): Tile[][] {
  const desktop: Tile[] = SLUGS.flatMap((_slug, s) =>
    PARTS.map((part, p) => ({
      src: `/landing/wall/${SLUGS[(s + p) % 4]}-${part}.webp`,
      phone: false,
    })),
  );
  const phones: Tile[] = SLUGS.flatMap((slug) => [
    { src: `/landing/wall/phone-${slug}-top.webp`, phone: true },
    { src: `/landing/wall/phone-${slug}-mid.webp`, phone: true },
  ]);
  const cols: Tile[][] = [[], [], [], []];
  desktop.forEach((tile, i) => cols[i % 4]!.push(tile));
  phones.forEach((tile, i) => cols[(i * 3 + 1) % 4]!.splice(1 + (i % 3), 0, tile));
  return cols;
}

const SPEEDS = [70, 85, 62, 92];

function SiteWall() {
  const cols = columns();
  return (
    <div
      aria-hidden="true"
      className="l-wall pointer-events-none absolute inset-y-0 right-[-30%] w-[120%] opacity-45 select-none sm:right-[-18%] sm:w-[95%] sm:opacity-70 lg:right-[-10%] lg:w-[62%] lg:opacity-100"
    >
      <div className="l-wall-plane absolute -top-[30%] -bottom-[30%] left-0 flex w-full gap-5">
        {cols.map((col, c) => (
          <div key={c} className="relative w-1/4 shrink-0 overflow-visible">
            <div
              className={c % 2 === 0 ? "l-col-up" : "l-col-down"}
              style={{ "--speed": `${SPEEDS[c]}s` } as CSSProperties}
            >
              {/* Duas cópias da coluna: o laço da animação fica sem emenda. */}
              {[0, 1].map((copy) => (
                <div key={copy} className="flex flex-col gap-5 pb-5">
                  {col.map((tile, t) => (
                    <div
                      key={`${copy}-${t}`}
                      className={`overflow-hidden rounded-xl bg-[#0b1a33] shadow-[0_30px_80px_-20px_rgb(0_0_0/.8)] ring-1 ring-white/10 ${
                        tile.phone ? "mx-auto w-[62%] rounded-[1.4rem] ring-white/20" : ""
                      }`}
                    >
                      <Image
                        src={tile.src}
                        alt=""
                        width={tile.phone ? 520 : 1200}
                        height={tile.phone ? 1126 : 750}
                        sizes={tile.phone ? "160px" : "(min-width: 1024px) 260px, 200px"}
                        loading={copy === 0 && t < 2 ? "eager" : "lazy"}
                        className="block h-auto w-full"
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {/* Esmaece a parede nas bordas e atrás do texto. */}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--l-bg)_0%,rgb(4_13_28/.92)_28%,rgb(4_13_28/.35)_55%,transparent_80%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,var(--l-bg)_0%,transparent_18%,transparent_75%,var(--l-bg)_100%)]" />
    </div>
  );
}

const line = (i: number) => ({ "--i": i }) as CSSProperties;

export function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      data-hide-mobile-cta
      className="l-grain relative isolate flex min-h-[100svh] items-center overflow-hidden"
    >
      <div aria-hidden="true" className="l-mesh -z-10" />
      <SiteWall />

      <div className={`${container} relative z-10 pt-16 pb-24 lg:pt-10 lg:pb-28`}>
        <p
          className="l-intro inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 text-[13px] font-medium text-slate-200 backdrop-blur"
          style={line(0)}
        >
          <span aria-hidden="true" className="size-1.5 rounded-full bg-[#00c2ff]" />
          AI websites for local businesses
        </p>

        <h1
          id="hero-title"
          className="l-display mt-6 max-w-[13ch] text-[clamp(3.75rem,9.6vw,9.5rem)] text-white"
        >
          <span className="l-line">
            <span style={line(0)}>Your business,</span>
          </span>
          <span className="l-line">
            <span style={line(1)}>online by</span>
          </span>
          <span className="l-line">
            <span style={line(2)} className="l-serif l-gradient-text pr-[0.08em]">
              lunch.
            </span>
          </span>
        </h1>

        <p
          className="l-intro mt-7 max-w-[44ch] text-lg leading-relaxed text-pretty text-slate-300 lg:text-xl"
          style={line(2)}
        >
          Tell us about your business in one sentence. We build a real website with your services,
          your phone and a contact form. You change it by asking, then publish.
        </p>

        <div className="l-intro mt-9 max-w-[34rem]" style={line(3)}>
          <PromptForm tone="dark" />
        </div>
      </div>

      <a
        href="#build"
        className="l-intro absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-xs font-medium tracking-[0.2em] text-slate-400 uppercase hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white lg:flex"
        style={line(5)}
      >
        See it build
        <span
          aria-hidden="true"
          className="h-10 w-px bg-gradient-to-b from-slate-400 to-transparent"
        />
      </a>
    </section>
  );
}
