import type { Section, SiteSpec } from "@nosweat/schema";
import { MODEL_UNSPLASH_PHOTOS } from "./unsplash-photos";

// Fotos do Unsplash nos sites-modelo: a foto do topo e uma galeria. Fica fora dos arquivos de
// cada modelo para dar para trocar todas de uma vez (unsplash-photos.ts é gerado).
// - topo: a foto escolhida substitui a anterior (o texto e o imageQuery continuam);
// - galeria: só entra quando o modelo ainda não tem uma (portfólios e paisagismo já têm as
//   fotos de trabalho deles) e cabe no limite de 8 seções; fica antes das perguntas/contato.

const MAX_SECTIONS = 8;

export function withModelPhotos(slug: string, spec: SiteSpec): SiteSpec {
  const photos = MODEL_UNSPLASH_PHOTOS[slug];
  if (!photos) return spec;
  const sections: Section[] = spec.sections.map((section) =>
    section.type === "hero" ? { ...section, image: photos.hero } : section,
  );
  const hasGallery = sections.some((section) => section.type === "gallery");
  if (!hasGallery && photos.gallery.length > 0 && sections.length < MAX_SECTIONS) {
    const before = sections.findIndex(
      (section) => section.type === "faq" || section.type === "contact",
    );
    const gallery: Section = { type: "gallery", images: photos.gallery };
    sections.splice(before === -1 ? sections.length : before, 0, gallery);
  }
  return { ...spec, sections };
}
