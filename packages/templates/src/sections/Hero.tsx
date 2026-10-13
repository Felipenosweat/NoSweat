import type { SectionOf, SiteImage } from "@nosweat/schema";
import type { ReactNode } from "react";
import { ArrowRightIcon } from "../components/icons";
import { Photo, PhotoCredit } from "../components/photo";
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
  const copy = (
    <HeroCopy data={data} ctaHref={ctaHref} eyebrow={eyebrow} actions={actions} footer={footer} />
  );
  if (data.image) return <PhotoHero image={data.image} copy={copy} aside={aside} />;

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
        {copy}
        {aside && <div className="relative">{aside}</div>}
      </Container>
    </section>
  );
}

function HeroCopy({
  data,
  ctaHref,
  eyebrow,
  actions,
  footer,
}: Omit<HeroProps, "aside"> & { ctaHref: string }) {
  return (
    <div className="min-w-0">
      {eyebrow}
      <h1 className="text-4xl leading-[1.05] font-extrabold tracking-tight text-balance [overflow-wrap:anywhere] sm:text-5xl lg:text-6xl">
        {data.title}
      </h1>
      <p className="mt-5 max-w-xl text-lg text-pretty text-ns-muted sm:text-xl">{data.subtitle}</p>
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
  );
}

/**
 * Topo com foto. O texto nunca fica em cima da foto (contraste garantido com qualquer tema):
 * - celular/tablet: texto, depois a foto de ponta a ponta e o card logo abaixo;
 * - desktop: texto alinhado ao Container à esquerda, foto sangrando até a borda direita e o
 *   card "pendurado" no canto inferior esquerdo da foto, por cima da emenda.
 */
function PhotoHero({
  image,
  copy,
  aside,
}: {
  image: SiteImage;
  copy: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <section className="relative isolate overflow-hidden bg-ns-surface lg:grid lg:grid-cols-2">
      {/* Coluna do texto: no desktop ocupa metade da tela, alinhada à borda esquerda do Container (max-w-6xl). */}
      <div className="flex items-center">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-20 lg:mr-0 lg:ml-auto lg:max-w-[36rem] lg:py-24 lg:pr-14 lg:pl-8">
          {copy}
        </div>
      </div>

      <div className={`flex min-w-0 flex-col ${aside ? "lg:pb-14" : ""}`}>
        <figure className="relative aspect-[4/3] w-full overflow-hidden bg-ns-border sm:aspect-[16/9] lg:aspect-auto lg:min-h-[32rem] lg:flex-1">
          <Photo
            image={image}
            loading="eager"
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="absolute inset-0 size-full object-cover"
          />
          {image.credit && image.source !== "upload" && (
            <figcaption className="absolute right-3 bottom-3 max-w-[calc(100%-1.5rem)] truncate rounded-md bg-ns-background/90 px-2 py-1 text-[0.6875rem] leading-tight text-ns-text lg:max-w-[13rem]">
              <PhotoCredit image={image} className="truncate" />
            </figcaption>
          )}
        </figure>
        {aside && (
          <div className="relative mx-auto w-full max-w-6xl px-4 pt-8 pb-14 sm:px-6 lg:mx-0 lg:-mt-28 lg:-ml-10 lg:w-80 lg:max-w-none lg:p-0 xl:w-96">
            {aside}
          </div>
        )}
      </div>
    </section>
  );
}
