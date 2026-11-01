import type { SiteImage, SiteSpec } from "@nosweat/schema";
import { Fragment } from "react";

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
      title={creditTitle(image)}
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

type CreditedImage = SiteImage & { credit: NonNullable<SiteImage["credit"]> };

/**
 * Texto do `title` da foto (dica ao passar o mouse; não aparece na página). Só fotos de banco
 * de imagens ou com licença que pede crédito; foto do dono (sem crédito) fica sem `title`.
 */
export function creditTitle(image: SiteImage): string | undefined {
  if (!image.credit) return undefined;
  if (image.source === "upload") return `Photo: ${image.credit.name}`;
  return `Photo by ${image.credit.name} on ${PROVIDERS[image.source].name}`;
}

/** Fotos que pedem crédito, sem repetir a mesma foto (pela url). */
export function creditedImages(images: readonly (SiteImage | undefined)[]): CreditedImage[] {
  const seen = new Set<string>();
  const out: CreditedImage[] = [];
  for (const image of images) {
    if (!image?.credit || seen.has(image.url)) continue;
    seen.add(image.url);
    out.push({ ...image, credit: image.credit });
  }
  return out;
}

/**
 * Todas as fotos do site (topo, serviços, galeria, "quem somos" e pessoas). Os créditos do
 * rodapé saem daqui: ficam num lugar só, na ordem em que as fotos aparecem na página.
 */
export function specImages(spec: SiteSpec): SiteImage[] {
  const images: (SiteImage | undefined)[] = [];
  for (const section of spec.sections) {
    if (section.type === "hero") images.push(section.image);
    if (section.type === "services") images.push(...section.items.map((item) => item.image));
    if (section.type === "gallery") images.push(...section.images);
    if (section.type === "about") {
      images.push(section.image, ...(section.people ?? []).map((person) => person.image));
    }
  }
  return images.filter((image): image is SiteImage => Boolean(image));
}

/**
 * Crédito das fotos de banco de imagens numa linha só (no rodapé do site), agrupado por banco:
 * "Photos: Ana, Bia · Unsplash". Os nomes e o banco são links (a Unsplash e a Pexels pedem a
 * atribuição com link; os parâmetros utm da Unsplash ficam nos endereços). Fotos do dono sem
 * crédito não aparecem; "upload" COM crédito (fotos Creative Commons dos sites de exemplo) lista
 * só o nome, com link para a página original. Sem nenhuma foto creditada, não desenha nada.
 */
export function PhotoCredits({
  images,
  className = "",
}: {
  images: readonly (SiteImage | undefined)[];
  className?: string;
}) {
  const credited = creditedImages(images);
  if (credited.length === 0) return null;

  // Um grupo por origem, na ordem da primeira foto; o mesmo fotógrafo entra uma vez só.
  const groups = new Map<SiteImage["source"], CreditedImage[]>();
  for (const image of credited) {
    const group = groups.get(image.source) ?? [];
    if (!group.some((other) => other.credit.url === image.credit.url)) group.push(image);
    groups.set(image.source, group);
  }

  return (
    <p className={className}>
      {credited.length > 1 ? "Photos" : "Photo"}:{" "}
      {Array.from(groups.entries()).map(([source, group], groupIndex) => (
        <Fragment key={source}>
          {groupIndex > 0 && "; "}
          {group.map((image, index) => (
            <Fragment key={image.credit.url}>
              {index > 0 && ", "}
              <a
                href={image.credit.url}
                target="_blank"
                rel="noopener noreferrer"
                className={creditLink}
              >
                {image.credit.name}
              </a>
            </Fragment>
          ))}
          {source !== "upload" && (
            <>
              {" \u00b7 "}
              <a
                href={PROVIDERS[source].url}
                target="_blank"
                rel="noopener noreferrer"
                className={creditLink}
              >
                {PROVIDERS[source].name}
              </a>
            </>
          )}
        </Fragment>
      ))}
    </p>
  );
}
