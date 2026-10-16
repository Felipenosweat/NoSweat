import type { CSSProperties } from "react";
import { BackdropPhoto, BackdropShade } from "@/components/landing/Backdrop";
import { PhoneFrame } from "@/components/landing/demos/Frames";
import type { PhotoKey } from "@/components/photos";
import { PromptForm } from "@/components/marketing/PromptForm";
import { TightPunctuation } from "@/components/marketing/TightPunctuation";
import { container } from "@/components/marketing/styles";

// Hero da landing (V7, tela cheia): uma montagem de fotos de ofícios que se trocam sozinhas
// (só CSS, 4 s cada; parada com movimento reduzido), o título grande, o campo REAL de descrição
// e os três celulares com sites de exemplo (capturas das fixtures; negócios fictícios). Os
// celulares são o "objeto 3D": inclinados em perspectiva, eles se endireitam e sobem com a
// rolagem (`--hero-p`, escrito pelo ScrollStage em [data-hero]). O do meio é a Sparkle & Co.
// Cleaning, a mesma história do tour logo abaixo.

/** As cinco fotos da montagem, na ordem em que aparecem. */
const MONTAGE: PhotoKey[] = ["plumber", "cleaner", "landscaper", "stylist", "cook"];

export function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      data-hero
      data-hide-mobile-cta
      className="relative isolate overflow-hidden bg-ink"
    >
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        {MONTAGE.map((photo, index) => (
          <div
            key={photo}
            className="lp-montage absolute inset-0"
            style={{ "--i": index } as CSSProperties}
          >
            <BackdropPhoto photo={photo} priority={index === 0} />
          </div>
        ))}
        <BackdropShade side="left" />
      </div>

      <div
        className={`${container} grid min-h-[calc(100svh-4rem)] grid-cols-1 items-center gap-12 pt-12 pb-16 lg:grid-cols-[7fr_5fr] lg:gap-8 lg:pt-16 lg:pb-24`}
      >
        <div className="min-w-0">
          <h1
            id="hero-title"
            className="max-w-[11ch] font-display text-[clamp(3rem,8.4vw,7rem)] leading-[0.94] font-extrabold tracking-[-0.045em] text-balance text-white"
          >
            <TightPunctuation strong>Your business,</TightPunctuation>{" "}
            <span className="lp-accent-text">
              <TightPunctuation strong>online by lunch.</TightPunctuation>
            </span>
          </h1>
          <p className="mt-7 max-w-[42ch] text-lg leading-[1.55] text-pretty text-slate-200 lg:text-xl">
            Describe your business in one sentence. Get a real website for your trade, a client list
            that fills itself, and Instagram posts you approve.
          </p>
          <div className="mt-9 max-w-[35rem]">
            <PromptForm tone="dark" />
          </div>
        </div>

        <figure className="lp-rig min-w-0">
          <div className="lp-rig-inner flex items-end justify-center">
            <PhoneFrame
              src="/landing/wall/phone-joes-plumbing-top.webp"
              sizes="(min-width: 1024px) 180px, 130px"
              className="lp-rig-side w-[min(130px,30vw)] shrink-0 sm:w-[180px]"
            />
            <PhoneFrame
              src="/landing/wall/phone-sparkle-cleaning-top.webp"
              alt="Example website for Sparkle & Co. Cleaning on a phone, with a call button at the bottom."
              sizes="(min-width: 1024px) 220px, 160px"
              priority
              className="lp-rig-main relative z-10 -mx-5 w-[min(160px,38vw)] shrink-0 sm:-mx-6 sm:w-[220px]"
            />
            <PhoneFrame
              src="/landing/wall/phone-glow-salon-top.webp"
              sizes="(min-width: 1024px) 180px, 130px"
              className="lp-rig-side w-[min(130px,30vw)] shrink-0 sm:w-[180px]"
            />
          </div>
          <figcaption className="mt-6 text-center text-[13px] text-slate-300">
            Example sites made with No Sweat. The businesses are made up.
          </figcaption>
        </figure>
      </div>

      {/* Dica de rolagem: só enfeite (o tour começa logo abaixo e é alcançável pelo teclado). */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-[11px] font-semibold tracking-[0.18em] text-slate-300 uppercase lg:flex"
      >
        <svg viewBox="0 0 24 36" className="h-9 w-6" fill="none" stroke="currentColor">
          <rect x="1" y="1" width="22" height="34" rx="11" strokeWidth="1.5" />
          <rect className="lp-wheel" x="10.5" y="8" width="3" height="7" rx="1.5" fill="currentColor" stroke="none" />
        </svg>
        Scroll
      </div>
    </section>
  );
}
