import type { CSSProperties, ReactNode } from "react";
import { src, srcSet, type FadePhoto } from "./photos";

// Peças pequenas da demonstração Fade & Co.: foto em duotone (hotlink do Unsplash), crédito,
// letras com peso/largura próprios (a "fade" tipográfica) e títulos com linhas mascaradas
// (o FadeMotion faz cada linha subir de dentro da máscara; sem JS ficam paradas e legíveis).

/** Foto do Unsplash em <img> (hotlink obrigatório), já em duas cores pelo CDN. */
export function Photo({
  photo,
  sizes,
  ratio,
  priority = false,
  className = "",
  style,
}: {
  photo: FadePhoto;
  sizes: string;
  /** largura/altura do recorte; sem ela, a foto inteira. */
  ratio?: number;
  priority?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- hotlink do Unsplash (regra deles)
    <img
      src={src(photo, 1200, ratio)}
      srcSet={srcSet(photo, ratio)}
      sizes={sizes}
      alt={photo.alt}
      width={ratio ? 1200 : photo.width}
      height={ratio ? Math.round(1200 / ratio) : photo.height}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      className={className}
      style={{ backgroundColor: photo.color, ...style }}
    />
  );
}

/** "Photo: Nome / Unsplash" com os links que o Unsplash pede. */
export function Credit({ photo }: { photo: FadePhoto }) {
  return (
    <span>
      <a href={photo.authorUrl} className="f-link" target="_blank" rel="noopener noreferrer">
        {photo.author}
      </a>{" "}
      /{" "}
      <a
        href="https://unsplash.com/?utm_source=nosweat&utm_medium=referral"
        className="f-link"
        target="_blank"
        rel="noopener noreferrer"
      >
        Unsplash
      </a>
    </span>
  );
}

/**
 * Palavra em letras soltas, cada uma com peso (`wght`) e largura (`wdth`) próprios. Só visual:
 * quem chama coloca o texto legível ao lado (sr-only) e esta peça vai com aria-hidden.
 */
export function Letters({
  text,
  weights,
  widths,
  clip = false,
}: {
  text: string;
  /** um peso por letra, ou um só para todas. */
  weights: number | number[];
  widths: number | number[];
  /** a letra reage ao ponteiro (a "máquina" do herói). */
  clip?: boolean;
}) {
  return (
    <>
      {[...text].map((char, index) => {
        const wg = Array.isArray(weights) ? (weights[index] ?? weights.at(-1)) : weights;
        const wd = Array.isArray(widths) ? (widths[index] ?? widths.at(-1)) : widths;
        if (char === " ") return <span key={index} className="f-space" />;
        return (
          <span
            key={index}
            className="f-ch"
            data-f-clip={clip || undefined}
            style={{ "--wg": wg, "--wd": wd } as CSSProperties}
          >
            {char}
          </span>
        );
      })}
    </>
  );
}

/**
 * Título com linhas mascaradas. `lines` são as quebras do computador; no celular o texto
 * corre normal dentro de cada linha. Lido como uma frase só pelo leitor de tela.
 */
export function Lines({
  lines,
  className = "",
  as: Tag = "h2",
  id,
}: {
  lines: ReactNode[];
  className?: string;
  as?: "h1" | "h2" | "h3" | "p";
  id?: string;
}) {
  return (
    <Tag id={id} className={className} data-f-lines>
      {lines.map((line, index) => (
        <span key={index} className="f-line">
          <span className="f-line-in">{line}</span>
          {index < lines.length - 1 ? " " : null}
        </span>
      ))}
    </Tag>
  );
}

/** Rótulo de seção: número do capítulo + nome, em versalete pequeno. */
export function Kicker({ index, children }: { index: string; children: ReactNode }) {
  return (
    <p className="f-kicker">
      <span className="f-kicker-num">{index}</span>
      <span aria-hidden="true" className="f-kicker-rule" />
      {children}
    </p>
  );
}
