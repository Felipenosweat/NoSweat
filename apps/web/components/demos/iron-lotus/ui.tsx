import type { CSSProperties, ReactNode } from "react";
import { SECTIONS, type SectionId } from "./content";
import { src, srcSet, type IronPhoto } from "./photos";

// Peças pequenas da demo Iron Lotus: a foto do Unsplash (hotlink com srcset), o recorte
// "preso com fita" no papel, o crédito e o cabeçalho de folha ("Sheet 02 / 06 — Artists"),
// que é o que dá a hierarquia por índice da página.

/** Foto do Unsplash em <img> (hotlink obrigatório): srcset por largura, recorte pela proporção. */
export function Photo({
  photo,
  sizes,
  ratio,
  className = "",
  style,
}: {
  photo: IronPhoto;
  sizes: string;
  ratio?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- hotlink do Unsplash (regra deles)
    <img
      src={src(photo, 960, ratio)}
      srcSet={srcSet(photo, ratio)}
      sizes={sizes}
      alt={photo.alt}
      width={960}
      height={ratio ? Math.round(960 / ratio) : Math.round((960 * photo.height) / photo.width)}
      loading="lazy"
      decoding="async"
      className={className}
      style={{ backgroundColor: photo.color, ...style }}
    />
  );
}

/**
 * Recorte de foto preso no papel: moldura branca, dois pedaços de fita, inclinação leve e
 * legenda honesta ("example image"). Em preto e branco; ganha cor com o mouse ou o foco.
 */
export function Cutout({
  photo,
  sizes,
  ratio,
  tilt = 0,
  caption,
  className = "",
}: {
  photo: IronPhoto;
  sizes: string;
  ratio: number;
  tilt?: number;
  caption?: ReactNode;
  className?: string;
}) {
  return (
    <figure
      data-il-pin
      className={`il-cutout ${className}`}
      style={{ ["--tilt" as string]: `${tilt}deg` }}
    >
      <span aria-hidden="true" className="il-tape il-tape-a" />
      <span aria-hidden="true" className="il-tape il-tape-b" />
      <div className="il-cutout-photo">
        <Photo
          photo={photo}
          sizes={sizes}
          ratio={ratio}
          className="block h-auto w-full"
          style={{ aspectRatio: String(ratio) }}
        />
      </div>
      <figcaption className="il-mono mt-2 text-[11px] leading-snug text-[var(--il-ink-soft)]">
        {caption ?? photo.caption}. Example image.
      </figcaption>
    </figure>
  );
}

/** "Photo: Nome / Unsplash" com os links que o Unsplash pede. */
export function Credit({ photo }: { photo: IronPhoto }) {
  return (
    <span>
      <a href={photo.photoUrl} className="il-link" target="_blank" rel="noopener noreferrer">
        {photo.caption}
      </a>
      {" by "}
      <a href={photo.authorUrl} className="il-link" target="_blank" rel="noopener noreferrer">
        {photo.author}
      </a>
      {" on "}
      <a
        href="https://unsplash.com/?utm_source=nosweat&utm_medium=referral"
        className="il-link"
        target="_blank"
        rel="noopener noreferrer"
      >
        Unsplash
      </a>
    </span>
  );
}

/** Cabeçalho de cada folha: número grande, "Sheet 0X / 06", rótulo e o fio. */
export function SheetHead({ id, aside }: { id: SectionId; aside?: ReactNode }) {
  const index = SECTIONS.findIndex((section) => section.id === id);
  const section = SECTIONS[index];
  if (!section) return null;
  return (
    <div className="il-sheethead flex items-end justify-between gap-6 border-b border-[var(--il-rule)] pb-3">
      <p className="il-mono flex items-baseline gap-3 text-[12px] tracking-[0.08em] uppercase">
        <span className="il-num-mask" aria-hidden="true">
          <span
            data-il-num
            className="il-display block text-[44px] leading-[0.8] text-[var(--il-red)]"
          >
            {section.no}
          </span>
        </span>
        <span>
          Sheet {section.no} / {String(SECTIONS.length).padStart(2, "0")} · {section.label}
        </span>
      </p>
      {aside ? (
        <div className="il-mono hidden text-right text-[12px] tracking-[0.08em] text-[var(--il-ink-soft)] uppercase sm:block">
          {aside}
        </div>
      ) : null}
    </div>
  );
}
