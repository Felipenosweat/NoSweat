import type { SectionOf } from "@nosweat/schema";
import type { ReactNode } from "react";
import { ArrowRightIcon } from "../components/icons";
import { Container } from "../components/primitives";

export type HeroProps = {
  data: SectionOf<"hero">;
  /** Destino do botão principal. */
  ctaHref?: string;
  /** Slots que o template preenche (ex.: botão de ligar, selos, card lateral). */
  eyebrow?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  aside?: ReactNode;
};

export function Hero({ data, ctaHref = "#contact", eyebrow, actions, footer, aside }: HeroProps) {
  return (
    <section className="relative isolate overflow-hidden bg-ns-surface">
      <div
        aria-hidden="true"
        className="absolute -top-32 -right-24 -z-10 size-96 rounded-full bg-ns-primary/15 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-40 -left-24 -z-10 size-96 rounded-full bg-ns-secondary/15 blur-3xl"
      />
      <Container className="grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-[1.15fr_0.85fr] lg:py-28">
        <div>
          {eyebrow}
          <h1 className="text-4xl leading-[1.05] font-extrabold tracking-tight text-balance sm:text-5xl lg:text-6xl">
            {data.title}
          </h1>
          <p className="mt-5 max-w-xl text-lg text-pretty text-ns-muted sm:text-xl">
            {data.subtitle}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href={ctaHref}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-ns-primary px-6 py-4 text-base font-semibold text-ns-on-primary shadow-lg shadow-ns-primary/25 transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ns-primary"
            >
              {data.ctaLabel}
              <ArrowRightIcon className="size-5" />
            </a>
            {actions}
          </div>
          {footer}
        </div>
        {aside && <div className="relative">{aside}</div>}
      </Container>
    </section>
  );
}
