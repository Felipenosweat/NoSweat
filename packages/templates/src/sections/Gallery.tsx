import type { SectionOf } from "@nosweat/schema";
import { Photo } from "../components/photo";
import { Container, SectionHeading } from "../components/primitives";

export type GalleryProps = {
  data: SectionOf<"gallery">;
  id?: string;
  /** Título quando o dono não escreveu um. */
  defaultTitle?: string;
};

/**
 * Galeria com fotos DO DONO (kind "owner"). Foto de banco de imagens nunca entra aqui,
 * porque passaria por "nosso trabalho". Sem fotos, a seção some.
 * Layout em colunas (estilo "masonry"): cada foto mantém a proporção original, sem cortes.
 */
export function Gallery({ data, id, defaultTitle = "Our work" }: GalleryProps) {
  const images = data.images.filter((image) => image.kind === "owner");
  if (images.length === 0) return null;

  // 1 foto: larga e sozinha; 2 ou 4: duas colunas (sem buraco); o resto: três no desktop.
  const columns =
    images.length === 1
      ? "max-w-3xl"
      : images.length === 2 || images.length === 4
        ? "sm:columns-2"
        : "sm:columns-2 lg:columns-3";

  return (
    <section id={id} className="scroll-mt-24 bg-ns-background py-16 sm:py-20">
      <Container>
        <SectionHeading title={data.title?.trim() || defaultTitle} align="left" />
        <ul className={`mt-10 gap-4 ${columns}`}>
          {images.map((image, index) => {
            const known = Boolean(image.width && image.height);
            return (
              <li key={`${image.url}-${index}`} className="mb-4 break-inside-avoid">
                <div
                  className={`overflow-hidden rounded-2xl bg-ns-surface ${known ? "" : "aspect-[4/3]"}`}
                  style={known ? { aspectRatio: `${image.width} / ${image.height}` } : undefined}
                >
                  <Photo
                    image={image}
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
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
