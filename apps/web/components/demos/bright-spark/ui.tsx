import type { CSSProperties, ReactNode } from "react";
import { CIRCUITS, type CircuitId } from "./content";
import { src, srcSet, type SparkPhoto } from "./photos";

// Peças pequenas da demo Bright Spark: a foto do Unsplash (hotlink com srcset), a moldura
// editorial com legenda honesta, o crédito e o cabeçalho de circuito ("CKT 01 · Services"),
// com o interruptor que a linha do fio liga quando a seção chega (BrightMotion).

/** Foto do Unsplash em <img> (hotlink obrigatório): srcset por largura, recorte pela proporção. */
export function Photo({
  photo,
  sizes,
  ratio,
  className = "",
  style,
  eager = false,
}: {
  photo: SparkPhoto;
  sizes: string;
  ratio?: number;
  className?: string;
  style?: CSSProperties;
  eager?: boolean;
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
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      className={className}
      style={{
        backgroundColor: photo.color,
        aspectRatio: ratio ? String(ratio) : undefined,
        ...style,
      }}
    />
  );
}

/** Foto emoldurada com legenda e numeração de prancha ("Fig. 2"): sempre "Example scene". */
export function Frame({
  photo,
  sizes,
  ratio,
  fig,
  className = "",
  reveal = true,
}: {
  photo: SparkPhoto;
  sizes: string;
  ratio: number;
  fig: string;
  className?: string;
  reveal?: boolean;
}) {
  return (
    <figure className={`bs-frame ${className}`}>
      <div className="bs-frame-photo" data-bs-reveal={reveal || undefined}>
        <Photo photo={photo} sizes={sizes} ratio={ratio} className="block h-auto w-full" />
      </div>
      <figcaption className="bs-caption mt-2.5 flex gap-3">
        <span className="shrink-0 font-semibold">
          Fig. <span className="bs-num">{fig}</span>
        </span>
        <span>{photo.caption}. Example scene, not a Bright Spark job.</span>
      </figcaption>
    </figure>
  );
}

/** "Foto por Nome no Unsplash" com os links (UTM) que o Unsplash pede. */
export function Credit({ photo }: { photo: SparkPhoto }) {
  return (
    <span>
      <a href={photo.photoUrl} className="bs-link" target="_blank" rel="noopener noreferrer">
        {photo.caption}
      </a>
      {" by "}
      <a href={photo.authorUrl} className="bs-link" target="_blank" rel="noopener noreferrer">
        {photo.author}
      </a>
      {" on "}
      <a
        href="https://unsplash.com/?utm_source=nosweat&utm_medium=referral"
        className="bs-link"
        target="_blank"
        rel="noopener noreferrer"
      >
        Unsplash
      </a>
    </span>
  );
}

/** Interruptor desenhado (decorativo): "ligado" pelo atributo data-bs-off do circuito. */
export function Switch({ className = "" }: { className?: string }) {
  return (
    <span aria-hidden="true" className={`bs-switch ${className}`}>
      <span className="bs-switch-handle" />
    </span>
  );
}

/** Cabeçalho de circuito: interruptor + "CKT 01 / 05" + rótulo, sobre um fio. */
export function CircuitHead({
  id,
  aside,
  dark = false,
}: {
  id: CircuitId;
  aside?: ReactNode;
  dark?: boolean;
}) {
  const index = CIRCUITS.findIndex((circuit) => circuit.id === id);
  const circuit = CIRCUITS[index];
  if (!circuit) return null;
  return (
    <div
      className={`bs-circuithead flex items-center justify-between gap-6 border-b pb-3 ${dark ? "border-[var(--bs-rule-on-ink)]" : "border-[var(--bs-rule)]"}`}
    >
      <p className="bs-label flex items-center gap-3">
        <Switch />
        <span className="bs-num whitespace-nowrap">
          CKT {circuit.no} / {String(CIRCUITS.length).padStart(2, "0")}
        </span>
        <span aria-hidden="true" className="hidden h-px w-6 bg-current opacity-50 sm:block" />
        <span>{circuit.label}</span>
      </p>
      {aside ? <div className="bs-label hidden text-right sm:block">{aside}</div> : null}
    </div>
  );
}
