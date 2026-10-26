import type { CSSProperties } from "react";
import { srcSet, src, type AureliaPhoto } from "./photos";

// Peças pequenas da demonstração Aurelia: o brasão, a foto do Unsplash (hotlink com srcset) e
// o crédito. O arco (topo em semicírculo) é o motivo da marca: as janelas e portas do palácio.

/** Brasão: um arco com o "A" em Bodoni e três pontos de coroa. `draw` anima o traço (abertura). */
export function Crest({ className = "", draw = false }: { className?: string; draw?: boolean }) {
  return (
    <svg
      viewBox="0 0 64 80"
      fill="none"
      aria-hidden="true"
      className={`${draw ? "a-crest-draw" : ""} ${className}`}
    >
      <path
        d="M6 78V34a26 26 0 0 1 52 0v44"
        stroke="currentColor"
        strokeWidth="1.2"
        pathLength={1}
      />
      <path
        d="M11 78V35a21 21 0 0 1 42 0v43"
        stroke="currentColor"
        strokeWidth="0.6"
        pathLength={1}
        opacity="0.6"
      />
      <circle cx="24" cy="6" r="1.6" fill="currentColor" />
      <circle cx="32" cy="3" r="2" fill="currentColor" />
      <circle cx="40" cy="6" r="1.6" fill="currentColor" />
      <text
        x="32"
        y="62"
        textAnchor="middle"
        fill="currentColor"
        style={{ fontFamily: "var(--font-a-display)", fontSize: 34, fontStyle: "italic" }}
      >
        A
      </text>
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
}: {
  photo: AureliaPhoto;
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
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      className={className}
      style={{ backgroundColor: photo.color, ...style }}
    />
  );
}

/** "Photo: Nome / Unsplash" com os links que o Unsplash pede. */
export function Credit({ photo, className = "" }: { photo: AureliaPhoto; className?: string }) {
  return (
    <span className={className}>
      Photo:{" "}
      <a href={photo.authorUrl} className="a-link" target="_blank" rel="noopener noreferrer">
        {photo.author}
      </a>{" "}
      /{" "}
      <a
        href="https://unsplash.com/?utm_source=nosweat&utm_medium=referral"
        className="a-link"
        target="_blank"
        rel="noopener noreferrer"
      >
        Unsplash
      </a>
    </span>
  );
}
