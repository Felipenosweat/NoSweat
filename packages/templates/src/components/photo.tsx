import type { SiteImage } from "@nosweat/schema";

// <img> simples de propósito: o pacote de templates não depende do Next (sem next/image).

/** Larguras do srcset (px). O navegador escolhe pela largura da tela e pelo `sizes`. */
export const SRCSET_WIDTHS = [480, 768, 1080, 1600, 2400] as const;

/** Troca a largura (e a altura proporcional, se houver corte) dos parâmetros de um CDN de fotos. */
function resize(params: URLSearchParams, width: number): void {
  const currentW = Number(params.get("w"));
  const currentH = Number(params.get("h"));
  params.set("w", String(width));
  // Corte com altura fixa (fit=crop&w=1200&h=1500): a altura acompanha para manter a proporção.
  if (currentW > 0 && currentH > 0) {
    params.set("h", String(Math.round((currentH * width) / currentW)));
  }
}

/** Endereço da foto na largura `width`, ou `null` se o servidor não redimensiona sozinho. */
function urlAtWidth(url: URL, width: number): string | null {
  const next = new URL(url.toString());
  const params = next.searchParams;
  if (url.hostname === "images.unsplash.com") {
    // Imgix: formato automático (WebP/AVIF quando o navegador aceita) no lugar do JPEG fixo.
    params.delete("fm");
    params.set("auto", "format");
    resize(params, width);
    return next.toString();
  }
  if (url.hostname === "images.pexels.com") {
    params.set("auto", "compress");
    params.set("cs", "tinysrgb");
    resize(params, width);
    return next.toString();
  }
  // Fotos enviadas pelo dono (Storage do Supabase), /photos locais e outros endereços ficam sem
  // srcset: o redimensionamento do Supabase (/render/image) depende do plano do projeto.
  return null;
}

/**
 * `srcset` com as larguras de SRCSET_WIDTHS para fotos da Unsplash e da Pexels (que
 * redimensionam pelo endereço). Outros endereços: `undefined` (só o `src`).
 */
export function photoSrcSet(src: string): string | undefined {
  let url: URL;
  try {
    // Só endereços absolutos (https://...); "/photos/..." não passa.
    url = new URL(src);
  } catch {
    return undefined;
  }
  const entries: string[] = [];
  for (const width of SRCSET_WIDTHS) {
    const resized = urlAtWidth(url, width);
    if (!resized) return undefined;
    entries.push(`${resized} ${width}w`);
  }
  return entries.join(", ");
}

type PhotoProps = {
  image: SiteImage;
  /**
   * Foto principal do topo (a do LCP): carrega já, com prioridade alta. Só a primeira foto do
   * topo de cada composição; todas as outras carregam sob demanda (lazy).
   */
  priority?: boolean;
  className?: string;
  sizes?: string;
};

/** Foto com largura/altura reais (quando conhecidas) para o navegador reservar o espaço. */
export function Photo({ image, priority = false, className = "", sizes }: PhotoProps) {
  const srcSet = photoSrcSet(image.url);
  return (
    <img
      src={image.url}
      srcSet={srcSet}
      // Sem `sizes`, o navegador supõe 100vw (o mesmo que antes, quando não havia srcset).
      sizes={srcSet ? (sizes ?? "100vw") : sizes}
      alt={image.alt}
      width={image.width}
      height={image.height}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
      className={className}
      style={image.focus ? { objectPosition: image.focus } : undefined}
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
 * Foto enviada pelo dono sem crédito não mostra nada; "upload" COM crédito (fotos com licença
 * Creative Commons dos sites de exemplo) mostra "Photo: Nome", com link para a página original.
 * Em espaço apertado só o nome do fotógrafo é cortado (…); o link do banco de imagens sempre
 * aparece inteiro. O `gap` faz o papel dos espaços entre as partes da linha flex.
 */
export function PhotoCredit({ image, className = "" }: { image: SiteImage; className?: string }) {
  if (!image.credit) return null;
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
  if (image.source === "upload") {
    return (
      <p className={`flex min-w-0 items-baseline gap-[0.25em] whitespace-nowrap ${className}`}>
        Photo: {author}
      </p>
    );
  }
  const provider = PROVIDERS[image.source];
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
