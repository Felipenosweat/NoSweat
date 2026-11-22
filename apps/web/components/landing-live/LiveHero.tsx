import Link from "next/link";
import { LOWEST_MONTHLY } from "./content";
import { LivePhone } from "./LivePhone";
import { LiveLogo } from "./LiveLogo";
import { onBlueButton } from "./styles";

// Herói da landing "Live": um campo azul de ponta a ponta com o cabeçalho dentro (logo branco,
// "Log in" e um "Start" pequeno; sem links no meio). Esquerda (7 colunas): o título em escala de
// cartaz, uma linha, o botão branco. Direita (5): um site de exemplo de verdade, rolável.
// O <h1> é o elemento de LCP (texto); o iframe não conta.

export function LiveHero() {
  return (
    <section
      id="story"
      aria-labelledby="hero-title"
      className="relative overflow-hidden bg-brand text-white"
    >
      <header className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-4 px-5 pt-4 sm:px-8 lg:px-12">
        <LiveLogo />
        <nav aria-label="Account" className="flex items-center gap-1 sm:gap-3">
          <Link
            href="/login"
            className="inline-flex min-h-11 items-center rounded-md px-3 text-[15px] font-medium text-white underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Log in
          </Link>
          <Link
            href="/create"
            className="inline-flex min-h-11 items-center rounded-full bg-white px-5 text-[15px] font-semibold text-ink transition-colors duration-150 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:translate-y-px"
          >
            Start
          </Link>
        </nav>
      </header>

      <div className="mx-auto grid w-full max-w-[1440px] gap-x-10 gap-y-14 px-5 pt-12 pb-16 sm:px-8 sm:pt-16 grid-cols-[minmax(0,1fr)] lg:grid-cols-12 lg:items-start lg:px-12 lg:pt-6 lg:pb-16">
        <div className="min-w-0 lg:col-span-7 lg:pt-16">
          <h1
            id="hero-title"
            className="live-d text-[clamp(3.25rem,12vw,9.5rem)] leading-[0.9] font-extrabold tracking-[-0.04em] lg:text-[clamp(5rem,10.6vw,9.5rem)]"
          >
            <span className="live-rise block">Your website,</span>
            <span className="live-rise live-serif block pt-[0.04em] text-[1.08em] leading-[0.95]">
              no sweat.
            </span>
          </h1>
          <p className="mt-8 max-w-[40ch] text-lg leading-[1.5] text-pretty text-white sm:text-xl lg:mt-10">
            Describe your business in a few sentences. We build the whole site, with your phone
            number, services and hours, and the office that answers the requests it brings in.
          </p>
          <div className="mt-8 flex flex-col items-start gap-3">
            <Link href="/create" data-live-hero-cta className={onBlueButton}>
              Start my website
            </Link>
            <p className="text-[15px] text-white">
              Describing your business is free. Plans from {LOWEST_MONTHLY}/mo when you build.
            </p>
          </div>
        </div>

        <div id="looks" className="min-w-0 scroll-mt-6 lg:col-span-5">
          <LivePhone />
        </div>
      </div>
    </section>
  );
}
