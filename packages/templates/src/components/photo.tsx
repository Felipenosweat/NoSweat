import type { SiteImage } from "@nosweat/schema";

// <img> simples de propósito: o pacote de templates não depende do Next (sem next/image).

type PhotoProps = {
  image: SiteImage;
  /** "eager" no topo da página (foto principal); "lazy" no resto. */
  loading?: "eager" | "lazy";
  className?: string;
  sizes?: string;
};

/** Foto com largura/altura reais (quando conhecidas) para o navegador reservar o espaço. */
export function Photo({ image, loading = "lazy", className = "", sizes }: PhotoProps) {
  return (
    <img
      src={image.url}
      alt={image.alt}
      width={image.width}
      height={image.height}
      loading={loading}
      decoding="async"
      sizes={sizes}
      className={className}
    />
  );
}

const PROVIDERS: Record<"pexels" | "unsplash", { name: string; url: string }> = {
  pexels: { name: "Pexels", url: "https://www.pexels.com" },
  // A Unsplash pede os parâmetros utm nos links de atribuição.
  unsplash: {
    name: "Unsplash",
    url: "https://unsplash.com/?utm_source=nosweat&utm_medium=referral",
  },
};

const creditLink =
  "underline decoration-current/40 underline-offset-2 transition hover:decoration-current focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current";

/**
 * Crédito do fotógrafo, como os bancos de imagens pedem:
 * Pexels → "Photo: Nome / Pexels"; Unsplash → "Photo by Nome on Unsplash".
 * Foto enviada pelo dono (ou sem crédito) não mostra nada.
 * Em espaço apertado só o nome do fotógrafo é cortado (…); o link do banco de imagens sempre
 * aparece inteiro. O `gap` faz o papel dos espaços entre as partes da linha flex.
 */
export function PhotoCredit({ image, className = "" }: { image: SiteImage; className?: string }) {
  if (!image.credit || image.source === "upload") return null;
  const provider = PROVIDERS[image.source];
  const author = (
    <a
      href={image.credit.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`min-w-0 truncate ${creditLink}`}
    >
      {image.credit.name}
    </a>
  );
  const site = (
    <a
      href={provider.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`shrink-0 ${creditLink}`}
    >
      {provider.name}
    </a>
  );
  return (
    <p className={`flex min-w-0 items-baseline gap-[0.25em] whitespace-nowrap ${className}`}>
      {image.source === "unsplash" ? (
        <>
          Photo by {author} on {site}
        </>
      ) : (
        <>
          Photo: {author} / {site}
        </>
      )}
    </p>
  );
}
