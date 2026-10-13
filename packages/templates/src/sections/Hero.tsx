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
  /**
   * Com foto: o card lateral só aparece quando o topo está em duas colunas.
   * Útil quando o card repetiria uma ação que já está logo acima (ex.: só o telefone).
   */
  asideWideOnly?: boolean;
};

export function Hero({
  data,
  ctaHref = "#contact",
  eyebrow,
  actions,
  footer,
  aside,
  asideWideOnly = false,
}: HeroProps) {
  const copy = (
    <HeroCopy data={data} ctaHref={ctaHref} eyebrow={eyebrow} actions={actions} footer={footer} />
  );
  if (data.image) {
    return <PhotoHero image={data.image} copy={copy} aside={aside} asideWideOnly={asideWideOnly} />;
  }

  // Sem foto: fundo liso e uma linha de base; a hierarquia vem do título e do card, não de enfeite.
  return (
    <section className="border-b border-ns-border bg-ns-surface">
      <Container className="grid items-center gap-12 py-14 @min-[40rem]:py-20 @5xl:grid-cols-[1.15fr_0.85fr] @5xl:py-28">
        {copy}
        {aside && <div className="relative">{aside}</div>}
      </Container>
    </section>
  );
}

/*
 * Tamanhos do título principal (4xl → 5xl → 6xl) multiplicados por --ns-display-scale, que sobe
 * um degrau com fontes de título de peso único (ver styles.css).
 */
const titleSize =
  "text-[length:calc(2.25rem*var(--ns-display-scale,1))] @min-[40rem]:text-[length:calc(3rem*var(--ns-display-scale,1))] @5xl:text-[length:calc(3.75rem*var(--ns-display-scale,1))]";

function HeroCopy({
  data,
  ctaHref,
  eyebrow,
  actions,
  footer,
}: Omit<HeroProps, "aside" | "asideWideOnly"> & { ctaHref: string }) {
  return (
    <div className="min-w-0">
      {eyebrow}
      <h1
        className={`${titleSize} leading-[1.05] font-extrabold tracking-tight text-balance [overflow-wrap:anywhere]`}
      >
        {data.title}
      </h1>
      <p className="mt-5 max-w-xl text-lg text-pretty text-ns-muted @min-[40rem]:text-xl">
        {data.subtitle}
      </p>
      {/* Lado a lado quando cabem; se não couberem (coluna estreita), cada botão vai para uma linha. */}
      <div className="mt-8 flex flex-col gap-3 @min-[40rem]:flex-row @min-[40rem]:flex-wrap">
        <a
          href={ctaHref}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-ns-primary px-6 py-4 text-base font-semibold text-ns-on-primary shadow-lg shadow-ns-primary/25 transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ns-primary"
        >
          {data.ctaLabel}
          <ArrowRightIcon className="size-5 shrink-0" />
        </a>
        {actions}
      </div>
      {footer}
    </div>
  );
}

/**
 * Topo com foto. O texto nunca fica em cima da foto (contraste garantido com qualquer tema).
 * O layout depende da largura do SITE (container .ns-site), não da janela:
 * - até 72rem (celular, tablet, prévia do editor): texto, depois a foto de ponta a ponta e o
 *   card logo abaixo;
 * - a partir de 72rem: duas colunas (texto mais largo que a foto), texto alinhado à borda
 *   esquerda do Container, foto sangrando até a borda direita e o card "pendurado" no canto
 *   inferior esquerdo da foto, por cima da emenda (só dentro do respiro da coluna de texto).
 */
function PhotoHero({
  image,
  copy,
  aside,
  asideWideOnly,
}: {
  image: SiteImage;
  copy: ReactNode;
  aside?: ReactNode;
  asideWideOnly: boolean;
}) {
  return (
    <section className="relative isolate overflow-hidden bg-ns-surface @6xl:grid @6xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
      {/* Coluna do texto. Em duas colunas, a largura máxima (7.5cqw + 36rem) faz a borda
          esquerda do texto cair exatamente na borda do Container (max-w-6xl) das outras seções. */}
      <div className="flex items-center">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 @min-[40rem]:px-6 @min-[40rem]:py-20 @5xl:px-8 @6xl:mr-0 @6xl:ml-auto @6xl:max-w-[calc(7.5cqw_+_36rem)] @6xl:py-24 @6xl:pr-14 @6xl:pl-8">
          {copy}
        </div>
      </div>

      <div className={`flex min-w-0 flex-col ${aside ? "@6xl:pb-14" : ""}`}>
        <figure className="relative aspect-[4/3] w-full overflow-hidden bg-ns-border @min-[40rem]:aspect-[16/9] @5xl:aspect-[21/9] @6xl:aspect-auto @6xl:min-h-[34rem] @6xl:flex-1">
          <Photo
            image={image}
            loading="eager"
            sizes="(min-width: 1152px) 43vw, 100vw"
            className="absolute inset-0 size-full object-cover"
          />
          {image.credit && image.source !== "upload" && (
            // Em duas colunas o card cobre a parte de baixo da foto: o crédito sobe para o topo.
            <figcaption
              className={`absolute right-3 bottom-3 max-w-[calc(100%-1.5rem)] rounded-md bg-ns-background/90 px-2 py-1 text-[0.6875rem] leading-tight text-ns-text @6xl:max-w-[16rem] ${
                aside ? "@6xl:top-3 @6xl:bottom-auto" : ""
              }`}
            >
              <PhotoCredit image={image} />
            </figcaption>
          )}
        </figure>
        {aside && (
          <div
            className={`relative mx-auto w-full max-w-6xl px-4 pt-8 pb-14 @min-[40rem]:px-6 @5xl:px-8 @6xl:mx-0 @6xl:-mt-28 @6xl:-ml-12 @6xl:w-[22rem] @6xl:max-w-none @6xl:p-0 @7xl:w-96 ${
              asideWideOnly ? "hidden @6xl:block" : ""
            }`}
          >
            <div className="@min-[40rem]:max-w-md @6xl:max-w-none">{aside}</div>
          </div>
        )}
      </div>
    </section>
  );
}
