import type { SectionOf } from "@nosweat/schema";
import { Photo } from "../components/photo";
import { Container, SectionHeading } from "../components/primitives";

export type GalleryProps = {
  data: SectionOf<"gallery">;
  id?: string;
  /** Título quando o dono não escreveu um. */
  defaultTitle?: string;
};

type Layout = { list: string; item: string; sizes: string };

/*
 * `sizes` de cada layout, a partir da largura real das colunas: Container de 72rem (1152px)
 * menos o respiro lateral, dividido pelas colunas.
 */
const SINGLE: Layout = {
  list: "max-w-3xl",
  item: "",
  sizes: "(min-width: 816px) 768px, 100vw",
};
const PAIRS: Layout = {
  list: "grid gap-4 @min-[40rem]:grid-cols-2",
  item: "",
  sizes: "(min-width: 1152px) 536px, (min-width: 640px) 50vw, 100vw",
};
const MASONRY: Layout = {
  list: "gap-4 @min-[40rem]:columns-2 @5xl:columns-3",
  item: "mb-4 break-inside-avoid",
  sizes: "(min-width: 1152px) 352px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
};

/**
 * Galeria com fotos DO DONO (kind "owner"). Foto de banco de imagens nunca entra aqui,
 * porque passaria por "nosso trabalho". Sem fotos, a seção some.
 * - 1 foto: larga e sozinha, na proporção original;
 * - 2 ou 4 fotos: grade de duas colunas com a MESMA proporção (recorte central), para as
 *   linhas ficarem alinhadas — retrato (4:5) se a maioria for vertical, senão paisagem (4:3);
 * - 3, 5 ou mais: colunas estilo "masonry", cada foto na proporção original, sem cortes.
 */
export function Gallery({ data, id, defaultTitle = "Our work" }: GalleryProps) {
  const images = data.images.filter((image) => image.kind === "owner");
  if (images.length === 0) return null;

  const layout =
    images.length === 1 ? SINGLE : images.length === 2 || images.length === 4 ? PAIRS : MASONRY;
  const portraits = images.filter(
    (image) => image.width && image.height && image.height > image.width,
  ).length;
  const sharedRatio =
    layout === PAIRS ? (portraits > images.length / 2 ? "aspect-[4/5]" : "aspect-[4/3]") : null;

  return (
    <section id={id} className="scroll-mt-24 bg-ns-background py-16 @min-[40rem]:py-20">
      <Container>
        <SectionHeading title={data.title?.trim() || defaultTitle} align="left" />
        <ul className={`mt-10 ${layout.list}`}>
          {images.map((image, index) => {
            const known = Boolean(image.width && image.height);
            const ratio = sharedRatio ?? (known ? "" : "aspect-[4/3]");
            return (
              <li key={`${image.url}-${index}`} className={layout.item}>
                <div
                  className={`overflow-hidden rounded-2xl bg-ns-surface ${ratio}`}
                  style={
                    !sharedRatio && known
                      ? { aspectRatio: `${image.width} / ${image.height}` }
                      : undefined
                  }
                >
                  <Photo
                    image={image}
                    sizes={layout.sizes}
                    className="block size-full object-cover"
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
