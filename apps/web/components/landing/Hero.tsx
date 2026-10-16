import { PhoneFrame } from "@/components/landing/demos/Frames";
import { PromptForm } from "@/components/marketing/PromptForm";
import { container } from "@/components/marketing/styles";

// Hero da landing (não fica fixo): título, o campo REAL de descrição e três celulares parados com
// sites de exemplo de verdade (capturas das fixtures; negócios fictícios). O do meio é a
// Sparkle & Co. Cleaning, a mesma história do tour logo abaixo.

export function Hero() {
  return (
    <section aria-labelledby="hero-title" data-hide-mobile-cta className="bg-ink">
      <div
        className={`${container} grid grid-cols-1 items-center gap-12 pt-14 pb-20 lg:grid-cols-[7fr_5fr] lg:pt-20 lg:pb-24`}
      >
        <div className="min-w-0">
          <h1
            id="hero-title"
            className="max-w-[12ch] font-display text-[clamp(2.75rem,6vw,5.5rem)] leading-[1.02] font-bold tracking-[-0.035em] text-balance text-white"
          >
            Your business, online by lunch.
          </h1>
          <p className="mt-6 max-w-[44ch] text-lg leading-[1.55] text-pretty text-slate-300 lg:text-xl">
            Describe your business in one sentence. Get a real website for your trade, a client list
            that fills itself, and Instagram posts you approve.
          </p>
          <div className="mt-8 max-w-[35rem]">
            <PromptForm tone="dark" />
          </div>
          <a
            href="#story"
            className="mt-4 inline-flex min-h-11 items-center rounded-sm font-semibold text-white underline decoration-brand decoration-2 underline-offset-4 hover:decoration-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Take the 2-minute tour <span aria-hidden="true">&nbsp;↓</span>
          </a>
        </div>

        <figure className="min-w-0">
          <div className="flex items-end justify-center">
            <PhoneFrame
              src="/landing/wall/phone-joes-plumbing-top.webp"
              sizes="(min-width: 1024px) 170px, 130px"
              className="w-[min(130px,30vw)] shrink-0 sm:w-[170px]"
            />
            <PhoneFrame
              src="/landing/wall/phone-sparkle-cleaning-top.webp"
              alt="Example website for Sparkle & Co. Cleaning on a phone, with a call button at the bottom."
              sizes="(min-width: 1024px) 200px, 160px"
              priority
              className="relative z-10 -mx-5 w-[min(160px,38vw)] shrink-0 sm:-mx-6 sm:w-[200px]"
            />
            <PhoneFrame
              src="/landing/wall/phone-glow-salon-top.webp"
              sizes="(min-width: 1024px) 170px, 130px"
              className="w-[min(130px,30vw)] shrink-0 sm:w-[170px]"
            />
          </div>
          <figcaption className="mt-5 text-center text-[13px] text-slate-400">
            Example sites made with No Sweat. The businesses are made up.
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
