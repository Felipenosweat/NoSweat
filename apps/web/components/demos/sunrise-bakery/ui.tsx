import type { CSSProperties, ReactNode } from "react";
import { src, srcSet, type SunrisePhoto } from "./photos";

// Peças pequenas da Sunrise Bakery. O motivo da marca é um só e tem duas leituras: o sol que
// nasce na linha do horizonte e o pão redondo com o corte ("pestana") da massa azeda. Aparece
// na marca, no relógio da manhã e como sublinhado (o corte desenhado).

/** Marca: meio sol (pão) sobre o horizonte, com o corte em curva. */
export function SunMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 44 26" aria-hidden="true" className={className} fill="none">
      <path d="M6 22a16 16 0 0 1 32 0Z" fill="var(--sb-apricot)" />
      <path
        d="M13 15.5c4.5-3.6 11.5-4.6 18-2.2"
        stroke="var(--sb-ink)"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path d="M1 22.5h42" stroke="var(--sb-ink)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** O corte da massa como sublinhado: uma curva que se desenha (data-sb-score). */
export function Score({ className = "", width = 180 }: { className?: string; width?: number }) {
  return (
    <svg
      viewBox="0 0 180 16"
      width={width}
      height={(width / 180) * 16}
      aria-hidden="true"
      className={className}
      fill="none"
    >
      <path
        data-sb-score
        d="M3 12C40 3 98 -0.5 177 7"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        pathLength={1}
      />
    </svg>
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
  photo: SunrisePhoto;
  sizes: string;
  /** largura/altura do recorte; sem ela, a foto inteira. */
  ratio?: number;
  priority?: boolean;
  className?: string;
  style?: CSSProperties;
  /** "" para foto decorativa (o texto ao lado já diz o que é). */
  alt?: string;
  /** maior largura do srcset */
  max?: number;
}) {
  const r = ratio ?? photo.width / photo.height;
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
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      className={className}
      style={{ backgroundColor: photo.color, ...style }}
    />
  );
}

/** "Photo: Nome / Unsplash" com os links que o Unsplash pede. */
export function Credit({ photo }: { photo: SunrisePhoto }) {
  return (
    <>
      <a href={photo.photoUrl} className="sb-link" target="_blank" rel="noopener noreferrer">
        Photo
      </a>{" "}
      by{" "}
      <a href={photo.authorUrl} className="sb-link" target="_blank" rel="noopener noreferrer">
        {photo.author}
      </a>{" "}
      on{" "}
      <a
        href="https://unsplash.com/?utm_source=nosweat&utm_medium=referral"
        className="sb-link"
        target="_blank"
        rel="noopener noreferrer"
      >
        Unsplash
      </a>
    </>
  );
}

/** Rótulo pequeno em caixa-alta (fato, não adjetivo). */
export function Label({
  children,
  className = "",
  as: Tag = "p",
}: {
  children: ReactNode;
  className?: string;
  as?: "p" | "span" | "h2" | "h3";
}) {
  return <Tag className={`sb-label ${className}`}>{children}</Tag>;
}

/** Ícones de traço (telefone, mapa, sacola) para os botões de ação. */
export function Icon({
  name,
  className = "size-5",
}: {
  name: "call" | "map" | "bag" | "arrow";
  className?: string;
}) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    className,
  };
  if (name === "call")
    return (
      <svg {...common}>
        <path d="M5 4h3.5l1.7 4.3-2.2 1.4a11 11 0 0 0 6.3 6.3l1.4-2.2L20 15.5V19a1.5 1.5 0 0 1-1.6 1.5A16 16 0 0 1 3.5 5.6 1.5 1.5 0 0 1 5 4Z" />
      </svg>
    );
  if (name === "map")
    return (
      <svg {...common}>
        <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" />
        <circle cx="12" cy="10" r="2.3" />
      </svg>
    );
  if (name === "bag")
    return (
      <svg {...common}>
        <path d="M5 8h14l-1.2 12H6.2L5 8Z" />
        <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
      </svg>
    );
  return (
    <svg {...common}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
