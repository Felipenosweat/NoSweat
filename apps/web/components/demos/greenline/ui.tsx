import type { CSSProperties } from "react";
import { src, srcSet, type GreenlinePhoto } from "./photos";

// Peças pequenas da demonstração Greenline: a marca (o nome com a "linha verde" embaixo), a
// foto do Unsplash (hotlink com srcset), o crédito e dois ícones de traço.

/** Marca: "Greenline" em serifa com um traço verde que corre sob "line" (o nome, literal). */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`g-display relative inline-block leading-none ${className}`}>
      Green<span className="relative">line</span>
      <span aria-hidden="true" className="g-wordmark-line" />
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
}: {
  photo: GreenlinePhoto;
  sizes: string;
  /** largura/altura do recorte; sem ela, a foto inteira. */
  ratio?: number;
  priority?: boolean;
  className?: string;
  style?: CSSProperties;
  /** "" para foto decorativa (o texto ao lado já diz o que é). */
  alt?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- hotlink do Unsplash (regra deles)
    <img
      src={src(photo, 1440, ratio)}
      srcSet={srcSet(photo, ratio)}
      sizes={sizes}
      alt={alt ?? photo.alt}
      width={ratio ? 1440 : photo.width}
      height={ratio ? Math.round(1440 / ratio) : photo.height}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      className={className}
      style={{ backgroundColor: photo.color, ...style }}
    />
  );
}

/** "Photo: Nome / Unsplash" com os links que o Unsplash pede. */
export function Credit({ photo, className = "" }: { photo: GreenlinePhoto; className?: string }) {
  return (
    <span className={className}>
      <a href={photo.photoUrl} className="g-link" target="_blank" rel="noopener noreferrer">
        Photo
      </a>
      :{" "}
      <a href={photo.authorUrl} className="g-link" target="_blank" rel="noopener noreferrer">
        {photo.author}
      </a>{" "}
      /{" "}
      <a
        href="https://unsplash.com/?utm_source=nosweat&utm_medium=referral"
        className="g-link"
        target="_blank"
        rel="noopener noreferrer"
      >
        Unsplash
      </a>
    </span>
  );
}

export function PhoneIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className={className}>
      <path
        d="M6.6 2.8 4.4 3.2c-.8.2-1.4.9-1.3 1.8.5 6.2 5.6 11.3 11.8 11.8.9.1 1.6-.5 1.8-1.3l.4-2.2-3.4-1.6-1.4 1.6a9.4 9.4 0 0 1-4.5-4.5l1.6-1.4L7.8 4Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Arrow({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 12" fill="none" aria-hidden="true" className={className}>
      <path d="M0 6h18M13 1l5 5-5 5" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

/** Rosa dos ventos de planta baixa (o "N" dos desenhos do Kevin): só decoração. */
export function NorthArrow({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 40" fill="none" aria-hidden="true" className={className}>
      <path d="M12 10 18 34l-6-5-6 5Z" stroke="currentColor" strokeWidth="1.2" />
      <path d="M12 10v19" stroke="currentColor" strokeWidth="1.2" />
      <path d="M12 10 18 34l-6-5Z" fill="currentColor" />
      <text
        x="12"
        y="7"
        textAnchor="middle"
        fill="currentColor"
        style={{ fontFamily: "var(--font-g-body)", fontSize: 8, fontWeight: 600 }}
      >
        N
      </text>
    </svg>
  );
}
