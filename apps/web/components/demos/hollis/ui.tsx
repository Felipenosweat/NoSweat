import type { CSSProperties, ReactNode } from "react";
import { src, srcSet, type HollisPhoto } from "./photos";

// Peças pequenas da demonstração Hollis Interiors: a foto do Unsplash (hotlink com srcset), o
// crédito, a etiqueta de seção ("02 — Services and fees", sempre no mesmo lugar) e a moldura com
// legenda de uma linha embaixo de um fio (nome à esquerda, crédito à direita), o "catálogo".

/** Foto do Unsplash em <img> (hotlink obrigatório): srcset por largura, recorte pelo CSS. */
export function Photo({
  photo,
  sizes,
  priority = false,
  className = "",
  style,
  alt,
}: {
  photo: HollisPhoto;
  sizes: string;
  priority?: boolean;
  className?: string;
  style?: CSSProperties;
  /** "" para foto decorativa (o texto ao lado já diz o que é). */
  alt?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- hotlink do Unsplash (regra deles)
    <img
      src={src(photo, 1440)}
      srcSet={srcSet(photo)}
      sizes={sizes}
      width={photo.width}
      height={photo.height}
      alt={alt ?? photo.alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      className={className}
      style={{ backgroundColor: photo.color, ...style }}
    />
  );
}

/** "Clay Banks / Unsplash" com os links que o Unsplash pede. */
export function Credit({ photo, prefix = "Photo" }: { photo: HollisPhoto; prefix?: string }) {
  return (
    <span>
      {prefix ? `${prefix}: ` : null}
      <a
        href={photo.authorUrl}
        className="h-link h-focus"
        target="_blank"
        rel="noopener noreferrer"
      >
        {photo.author}
      </a>{" "}
      /{" "}
      <a
        href="https://unsplash.com/?utm_source=nosweat&utm_medium=referral"
        className="h-link h-focus"
        target="_blank"
        rel="noopener noreferrer"
      >
        Unsplash
      </a>
    </span>
  );
}

/** Etiqueta de seção: número em algarismos tabulares, traço, nome. Sempre acima do título. */
export function Tag({
  n,
  children,
  className = "",
}: {
  n: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={`h-tag flex items-center gap-3 ${className}`}>
      <span className="tabular-nums">{n}</span>
      <span aria-hidden="true" data-h-line="" className="h-px w-8 origin-left bg-current" />
      <span>{children}</span>
    </p>
  );
}

/** Legenda de catálogo: fio fino, nome à esquerda, crédito à direita (quebra no celular). */
export function Caption({
  left,
  right,
  className = "",
}: {
  left: ReactNode;
  right: ReactNode;
  className?: string;
}) {
  return (
    <figcaption
      className={`h-caption mt-3 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-t border-[var(--h-line)] pt-2.5 ${className}`}
    >
      <span>{left}</span>
      <span className="text-[var(--h-muted)]">{right}</span>
    </figcaption>
  );
}

export function Arrow({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={`size-3.5 ${className}`} fill="none">
      <path d="M2 8h11M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

export function PhoneIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={`size-4 ${className}`} fill="none">
      <path
        d="M5.2 2.5 3.6 2.6c-.6 0-1.1.6-1 1.2.5 5 4.4 8.9 9.4 9.4.6.1 1.2-.4 1.2-1l.1-1.6-2.7-1.1-1.3 1.3a7 7 0 0 1-3.3-3.3l1.3-1.3-1.1-2.7Z"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
    </svg>
  );
}
