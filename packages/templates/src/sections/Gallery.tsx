import type { SectionOf, SiteImage } from "@nosweat/schema";
import { Photo, PhotoCredit } from "../components/photo";

/**
 * Jeito de mostrar as fotos, um por composição:
 * - "sheet": folha de contato (quadros iguais, numerados, legenda embaixo). Editorial/portfólio.
 * - "wall": parede larga, a primeira foto grande e as outras em volta. Imersiva.
 * - "grid": grade regular com legenda embaixo. Serviço e tipográfica.
 * - "tiles": blocos arredondados com a legenda por cima da foto. Modular.
 */
export type GalleryVariant = "sheet" | "wall" | "grid" | "tiles";

export type GalleryProps = {
  data: SectionOf<"gallery">;
  id?: string;
  /** Título quando o dono não escreveu um. */
  defaultTitle?: string;
  variant?: GalleryVariant;
  /** Raio das fotos (o mesmo da composição), ex.: "rounded-none". */
  radius?: string;
  /** Largura máxima do conteúdo (as composições largas usam max-w-7xl). */
  wide?: boolean;
  className?: string;
};

type Layout = { list: string; item: (index: number, count: number) => string; sizes: string };

/*
 * `sizes` de cada layout, a partir da largura real das colunas (container de 72rem/80rem menos o
 * respiro lateral, dividido pelas colunas).
 */
const LAYOUTS: Record<GalleryVariant, Layout> = {
  sheet: {
    list: "grid grid-cols-2 gap-x-3 gap-y-8 @3xl:grid-cols-3 @3xl:gap-x-5 @3xl:gap-y-12",
    item: () => "",
    sizes: "(min-width: 1152px) 360px, (min-width: 768px) 33vw, 50vw",
  },
  wall: {
    list: "grid gap-3 @3xl:grid-cols-4",
    item: (index, count) =>
      index === 0 && count > 2
        ? "@3xl:col-span-2 @3xl:row-span-2"
        : count <= 2
          ? "@3xl:col-span-2"
          : "",
    sizes: "(min-width: 1280px) 600px, (min-width: 768px) 50vw, 100vw",
  },
  grid: {
    list: "grid gap-x-4 gap-y-8 @min-[40rem]:grid-cols-2 @5xl:grid-cols-3",
    item: () => "",
    sizes: "(min-width: 1152px) 352px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
  },
  tiles: {
    list: "grid gap-3 @min-[40rem]:grid-cols-2 @5xl:grid-cols-3",
    item: (index, count) => (index === 0 && count % 3 !== 0 ? "@5xl:col-span-2" : ""),
    sizes: "(min-width: 1152px) 720px, (min-width: 640px) 50vw, 100vw",
  },
};

/** Proporção dos quadros: retrato se a maioria das fotos for vertical, senão paisagem. */
function frameRatio(images: SiteImage[], variant: GalleryVariant): string {
  const portraits = images.filter(
    (image) => image.width && image.height && image.height > image.width,
  ).length;
  const portrait = portraits > images.length / 2;
  if (variant === "sheet") return portrait ? "aspect-[4/5]" : "aspect-[3/2]";
  if (variant === "wall") return "aspect-[4/3] @3xl:aspect-auto @3xl:h-full @3xl:min-h-56";
  return portrait ? "aspect-[4/5]" : "aspect-[4/3]";
}

/**
 * Galeria com fotos DO DONO (kind "owner"). Foto de banco de imagens nunca entra aqui,
 * porque passaria por "nosso trabalho". Sem fotos, a seção some.
 * Legendas (`caption`) são a prova: nome · lugar · ano, o prato ou a técnica.
 */
export function Gallery({
  data,
  id,
  defaultTitle = "Our work",
  variant = "grid",
  radius = "rounded-md",
  wide = false,
  className = "",
}: GalleryProps) {
  const images = data.images.filter((image) => image.kind === "owner");
  if (images.length === 0) return null;

  const layout = LAYOUTS[variant];
  const ratio = frameRatio(images, variant);
  const credited = images.filter((image) => image.credit);
  // Todas do mesmo fotógrafo: um crédito só, sem repetir a linha para cada foto.
  const oneCredit =
    credited.length > 0 &&
    new Set(credited.map((image) => `${image.credit?.name}|${image.credit?.url}`)).size === 1;

  return (
    <section
      id={id}
      data-gallery={variant}
      className={`scroll-mt-24 py-(--ns-section-y) ${className}`}
    >
      <div
        className={`mx-auto w-full ${wide ? "max-w-7xl" : "max-w-6xl"} px-4 @min-[40rem]:px-6 @5xl:px-8`}
      >
        <h2 className="ns-rise max-w-[20ch] font-ns-heading text-4xl leading-tight font-ns-display tracking-tight text-balance @min-[40rem]:text-5xl">
          {data.title?.trim() || defaultTitle}
        </h2>
        <ul className={`mt-10 @min-[40rem]:mt-14 ${layout.list}`}>
          {images.map((image, index) => (
            <li key={`${image.url}-${index}`} className={layout.item(index, images.length)}>
              <figure className="relative flex h-full flex-col">
                <div
                  data-kind="owner"
                  className={`ns-photo relative overflow-hidden bg-ns-surface ${radius} ${ratio} ${variant === "wall" ? "flex-1" : ""}`}
                >
                  <Photo
                    image={image}
                    sizes={layout.sizes}
                    className="absolute inset-0 size-full object-cover"
                  />
                </div>
                {variant === "tiles" && image.caption && (
                  <figcaption className="absolute inset-x-3 bottom-3 rounded-md bg-ns-background/90 px-3 py-2 text-sm font-medium text-ns-text">
                    {image.caption}
                  </figcaption>
                )}
                {variant !== "tiles" && (image.caption || variant === "sheet") && (
                  <figcaption className="mt-3 flex gap-2 text-sm leading-snug text-ns-muted">
                    {variant === "sheet" && (
                      <span className="font-semibold text-ns-text tabular-nums">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    )}
                    {image.caption && (
                      <span>
                        {variant === "sheet" && <span aria-hidden="true">· </span>}
                        {image.caption}
                      </span>
                    )}
                  </figcaption>
                )}
              </figure>
            </li>
          ))}
        </ul>
        {oneCredit && credited[0] && (
          <PhotoCredit image={credited[0]} className="mt-10 text-xs text-ns-muted" />
        )}
        {credited.length > 0 && !oneCredit && (
          <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-1 text-xs text-ns-muted">
            {images.map((image, index) =>
              image.credit ? (
                <li key={`${image.url}-credit-${index}`} className="flex min-w-0 gap-1.5">
                  <span className="tabular-nums">{String(index + 1).padStart(2, "0")}</span>
                  <PhotoCredit image={image} />
                </li>
              ) : null,
            )}
          </ul>
        )}
      </div>
    </section>
  );
}
