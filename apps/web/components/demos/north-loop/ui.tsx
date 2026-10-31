import type { CSSProperties, ReactNode } from "react";
import { src, srcSet, type NorthLoopPhoto } from "./photos";

// Peças pequenas da North Loop Coffee. O motivo da casa vem do prédio: o café fica numa antiga
// gráfica, então as marcas de impressão (registro ⊕ e marcas de corte nos cantos) viram a
// marca, os cantos dos blocos azuis e os números das seções. Os objetos (copo, grãos) são
// "recortes" de papel colados na página: forma chapada com borda de papel e sombra curta.

/** Marca de registro da gráfica: círculo + cruz. É o logotipo e o ornamento das seções. */
export function RegMark({ className = "", title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      fill="none"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      aria-label={title}
    >
      <circle cx="16" cy="16" r="9" stroke="currentColor" strokeWidth="2" />
      <circle cx="16" cy="16" r="3.2" fill="currentColor" />
      <path d="M16 1v30M1 16h30" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

/** Marcas de corte nos 4 cantos de um bloco (decorativas). O bloco precisa ser `relative`. */
export function CropMarks({ className = "" }: { className?: string }) {
  const corner = "absolute h-5 w-5 sm:h-7 sm:w-7";
  return (
    <span aria-hidden="true" data-nl-marks className={`pointer-events-none ${className}`}>
      <span className={`${corner} top-3 left-3 border-t border-l`} />
      <span className={`${corner} top-3 right-3 border-t border-r`} />
      <span className={`${corner} bottom-3 left-3 border-b border-l`} />
      <span className={`${corner} right-3 bottom-3 border-r border-b`} />
    </span>
  );
}

/** Foto do Unsplash em <img> (hotlink obrigatório): srcset por largura, recorte pela proporção. */
export function Photo({
  photo,
  sizes,
  ratio,
  priority = false,
  className = "",
  style,
  alt,
  max,
}: {
  photo: NorthLoopPhoto;
  sizes: string;
  /** largura/altura do recorte; sem ela, a foto inteira (ou o `rect`). */
  ratio?: number;
  priority?: boolean;
  className?: string;
  style?: CSSProperties;
  /** "" para foto decorativa (o texto ao lado já diz o que é). */
  alt?: string;
  max?: number;
}) {
  const r = ratio ?? (photo.rect ? photo.rect[2] / photo.rect[3] : photo.width / photo.height);
  return (
    // eslint-disable-next-line @next/next/no-img-element -- hotlink do Unsplash (regra deles)
    <img
      src={src(photo, 1280, ratio)}
      srcSet={srcSet(photo, ratio, max)}
      sizes={sizes}
      width={1280}
      height={Math.round(1280 / r)}
      alt={alt ?? photo.alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
      className={className}
      style={{ backgroundColor: photo.color, ...style }}
    />
  );
}

/** Foto recortada em círculo, com borda de papel (o "recorte" colado sobre o bloco). */
export function RoundCutout({
  photo,
  sizes,
  priority,
  className = "",
  alt,
}: {
  photo: NorthLoopPhoto;
  sizes: string;
  priority?: boolean;
  className?: string;
  alt?: string;
}) {
  return (
    <div className={`nl-cutout nl-round ${className}`}>
      <Photo
        photo={photo}
        sizes={sizes}
        ratio={1}
        priority={priority}
        alt={alt}
        max={1280}
        className="h-full w-full rounded-full object-cover"
      />
    </div>
  );
}

/** Cópia impressa colada: retângulo com margem de papel e leve inclinação. */
export function Print({
  photo,
  sizes,
  ratio,
  className = "",
  caption,
  alt,
}: {
  photo: NorthLoopPhoto;
  sizes: string;
  ratio: number;
  className?: string;
  caption?: ReactNode;
  alt?: string;
}) {
  return (
    <figure className={`nl-print ${className}`}>
      <Photo photo={photo} sizes={sizes} ratio={ratio} alt={alt} className="block h-auto w-full" />
      {caption ? <figcaption className="nl-mono mt-2 text-[11px]">{caption}</figcaption> : null}
    </figure>
  );
}

/** Copo de cortado recortado em papel, com o café "servindo" (data-nl-pour) e o vapor. */
export function CortadoCutout({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 140 220" className={className} aria-hidden="true">
      <defs>
        <clipPath id="nl-glass-inside">
          <path d="M33 92 L107 92 L100 196 Q99 202 92 202 L48 202 Q41 202 40 196 Z" />
        </clipPath>
      </defs>
      {/* vapor: três fios que sobem e somem (CSS, só com movimento) */}
      <g className="nl-steam" fill="none" stroke="currentColor" strokeLinecap="round">
        <path d="M56 78c-8-10 8-18 0-30s6-20 0-30" strokeWidth="3" />
        <path d="M72 82c-8-12 9-20 0-33s7-22 0-32" strokeWidth="3.4" />
        <path d="M88 78c-7-10 8-17 0-28s6-19 0-28" strokeWidth="2.8" />
      </g>
      {/* borda de papel do recorte */}
      <path
        d="M27 86 L113 86 L106 198 Q104 210 92 210 L48 210 Q36 210 34 198 Z"
        fill="var(--nl-paper)"
      />
      <g clipPath="url(#nl-glass-inside)">
        <rect x="30" y="92" width="80" height="112" fill="#e9eef3" />
        <g data-nl-pour>
          <rect x="30" y="150" width="80" height="56" fill="#3a2215" />
          <rect x="30" y="122" width="80" height="30" fill="#b9773a" />
          <rect x="30" y="108" width="80" height="16" fill="#f1e2c9" />
          <path d="M30 150 q20 -6 40 0 t40 0 v4 H30Z" fill="#6b3f22" />
        </g>
      </g>
      {/* facetas do copo Gibraltar */}
      <path
        d="M33 92 L107 92 L100 196 Q99 202 92 202 L48 202 Q41 202 40 196 Z"
        fill="none"
        stroke="#14202e"
        strokeOpacity=".55"
        strokeWidth="2"
      />
      <path
        d="M37 178 H103 M52 92 L56 178 M88 92 L84 178"
        stroke="#14202e"
        strokeOpacity=".22"
        strokeWidth="1.6"
      />
    </svg>
  );
}

/** Um grão de café recortado (inclinação por `rotate`). */
export function Bean({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 40 52" className={className} style={style} aria-hidden="true">
      <ellipse cx="20" cy="26" rx="17" ry="23" fill="var(--nl-paper)" />
      <ellipse cx="20" cy="26" rx="13.5" ry="19.5" fill="#4a2a17" />
      <path
        d="M20 8c-6 8 6 14 0 22s5 12 0 14"
        fill="none"
        stroke="#c98b3c"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

const ICONS = {
  phone:
    "M6.6 3.5 9 3l1.6 3.9-1.9 1.4a11 11 0 0 0 5 5l1.4-1.9L19 13l-.5 2.4a2 2 0 0 1-2 1.6A14.5 14.5 0 0 1 3 5.5a2 2 0 0 1 1.6-2Z",
  pin: "M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11Zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  mail: "M3.5 6h17v12h-17Zm0 .5 8.5 6.5 8.5-6.5",
  arrow: "M5 12h13m-5-5 5 5-5 5",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  close: "M6 6l12 12M18 6 6 18",
} as const;

export function Icon({ name, className = "" }: { name: keyof typeof ICONS; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={ICONS[name]} />
    </svg>
  );
}

/** Crédito do fotógrafo + Unsplash (com UTM, como pede o Unsplash). */
export function Credit({ photo }: { photo: NorthLoopPhoto }) {
  return (
    <>
      <a href={photo.photoUrl} className="nl-link">
        Photo
      </a>{" "}
      by{" "}
      <a href={photo.authorUrl} className="nl-link">
        {photo.author}
      </a>{" "}
      on{" "}
      <a href="https://unsplash.com/?utm_source=nosweat&utm_medium=referral" className="nl-link">
        Unsplash
      </a>
    </>
  );
}

/** Cabeçalho de seção: número em mono + marca de registro + fio + título. */
export function SectionHead({
  no,
  kicker,
  children,
  id,
  className = "",
}: {
  no: string;
  kicker: string;
  children: ReactNode;
  id: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="nl-mono flex items-center gap-3 text-[12px]">
        <span className="tabular-nums">{no}</span>
        <RegMark className="h-3.5 w-3.5" />
        <span>{kicker}</span>
        <span aria-hidden="true" data-nl-rule className="nl-rule ml-1 h-px flex-1" />
      </p>
      <h2 id={id} className="nl-display mt-5 text-[clamp(2.3rem,5vw,4.4rem)] leading-[1.02]">
        {children}
      </h2>
    </div>
  );
}
