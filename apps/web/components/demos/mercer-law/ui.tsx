import type { ReactNode } from "react";
import { src, srcSet, type MercerPhoto } from "./photos";

// Peças pequenas da Mercer Law: a foto (hotlink do Unsplash com srcset), a figura emoldurada
// com legenda "Fig. n" (o jeito de jornal de mostrar foto), o crédito e o cabeçalho de seção
// com o "§" (o sinal de parágrafo das leis é o motivo da marca).

export function Photo({
  photo,
  sizes,
  ratio,
  focus,
  priority = false,
  className = "",
}: {
  photo: MercerPhoto;
  sizes: string;
  /** largura/altura do recorte. */
  ratio: number;
  /** ponto de interesse do recorte no Unsplash (entropy, edges, center, top...). */
  focus?: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- hotlink do Unsplash (regra deles)
    <img
      src={src(photo, 1080, ratio, focus)}
      srcSet={srcSet(photo, ratio, focus)}
      sizes={sizes}
      alt={photo.alt}
      width={1080}
      height={Math.round(1080 / ratio)}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      className={`block h-auto w-full ${className}`}
      style={{ backgroundColor: photo.color, aspectRatio: String(ratio) }}
    />
  );
}

/** "Photo: Nome / Unsplash" com os links (e o UTM) que o Unsplash pede. */
export function Credit({ photo }: { photo: MercerPhoto }) {
  return (
    <>
      Photo:{" "}
      <a href={photo.authorUrl} className="m-link" target="_blank" rel="noopener noreferrer">
        {photo.author}
      </a>{" "}
      /{" "}
      <a
        href="https://unsplash.com/?utm_source=nosweat&utm_medium=referral"
        className="m-link"
        target="_blank"
        rel="noopener noreferrer"
      >
        Unsplash
      </a>
    </>
  );
}

/** Figura de jornal: moldura fina, foto, e embaixo "Fig. n" + legenda + crédito. */
export function Figure({
  photo,
  fig,
  caption,
  sizes,
  ratio,
  focus,
  priority,
  className = "",
}: {
  photo: MercerPhoto;
  fig: number;
  caption: ReactNode;
  sizes: string;
  ratio: number;
  focus?: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <figure className={className}>
      <div data-m-frame className="m-frame overflow-hidden">
        <Photo
          photo={photo}
          sizes={sizes}
          ratio={ratio}
          focus={focus}
          priority={priority}
          className="m-photo"
        />
      </div>
      <figcaption className="m-caption mt-3 flex gap-3 text-[13px] leading-snug">
        <span className="m-label shrink-0 pt-px text-[var(--m-ox)]">Fig. {fig}</span>
        <span>
          {caption} <span className="whitespace-nowrap">{<Credit photo={photo} />}</span>
        </span>
      </figcaption>
    </figure>
  );
}

/** Cabeçalho de seção: "§ 2" + fio que se desenha + rótulo; o h2 vem logo depois. */
export function SectionMark({
  no,
  label,
  tone = "paper",
}: {
  no: string;
  label: string;
  tone?: "paper" | "ox";
}) {
  return (
    <p
      className={`m-label flex items-center gap-3 text-[12px] ${tone === "ox" ? "text-[var(--m-on-ox)]" : "text-[var(--m-ox)]"}`}
    >
      <span className="m-serif text-[15px] tracking-normal normal-case">§&nbsp;{no}</span>
      <span data-m-rule aria-hidden="true" className="h-px w-10 origin-left bg-current" />
      {label}
    </p>
  );
}
