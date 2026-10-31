import type { CSSProperties } from "react";
import { src, srcSet, type SrPhoto } from "./photos";

// Peças pequenas da demonstração Smoke & Rail: a marca (trilho com dormentes), a foto do
// Unsplash (hotlink com srcset), o crédito e o texto de placa de estação (split-flap).

/** Marca: dois trilhos e os dormentes, o desenho que volta na barra de progresso e na linha do tempo. */
export function RailMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 20" fill="none" aria-hidden="true" className={className}>
      <path d="M0 6h32M0 14h32" stroke="currentColor" strokeWidth="1.6" />
      {[3, 10, 17, 24, 31].map((x) => (
        <path key={x} d={`M${x - 1} 2v16`} stroke="currentColor" strokeWidth="2.4" />
      ))}
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
  photo: SrPhoto;
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
export function Credit({ photo, className = "" }: { photo: SrPhoto; className?: string }) {
  return (
    <span className={className}>
      Photo:{" "}
      <a href={photo.authorUrl} className="sr-link" target="_blank" rel="noopener noreferrer">
        {photo.author}
      </a>{" "}
      /{" "}
      <a
        href="https://unsplash.com/?utm_source=nosweat&utm_medium=referral"
        className="sr-link"
        target="_blank"
        rel="noopener noreferrer"
      >
        Unsplash
      </a>
    </span>
  );
}

/**
 * Texto de placa de estação: cada letra numa plaquinha com o vinco no meio. O leitor de tela
 * lê o texto inteiro (sr-only); as plaquinhas são decoração. O SmokeMotion faz as letras
 * girarem uma vez quando a placa entra na tela (data-sr-flap).
 */
export function Flap({ text, className = "" }: { text: string; className?: string }) {
  return (
    <span className={`sr-flap ${className}`} data-sr-flap>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="sr-flap-cells">
        {Array.from(text).map((char, index) =>
          char === " " ? (
            <span key={index} className="sr-flap-gap" />
          ) : (
            <span key={index} className="sr-flap-cell" data-char={char}>
              {char}
            </span>
          ),
        )}
      </span>
    </span>
  );
}
