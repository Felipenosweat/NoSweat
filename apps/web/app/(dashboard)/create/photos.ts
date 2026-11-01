import type { Composition, SiteImage, SiteSpec } from "@nosweat/schema";

// Quantas fotos o dono deve mandar para cada layout (pedido do fundador: "quando o cliente
// escolher o template, a No Sweat fala quantas fotos ele tem que mandar").
// Conta o que o molde Signature mostra (packages/templates/src/compositions/Signature.tsx):
// - a foto do topo (não existe no tipográfico, que é só o nome gigante);
// - a galeria: as duas primeiras também aparecem ao lado do texto "About", e todas passam
//   na lista de serviços e no fundo do contato. A galeria aceita até 12 (MAX_GALLERY_IMAGES
//   do editor), mas 6 a 10 já enchem o site sem repetir.
// No editor o dono só envia foto do topo e da galeria, por isso o plano fala só dessas duas.
// A geração não cria galeria (server/images/sanitize.ts descarta): o site nasce com uma foto de
// banco no topo e a galeria entra quando o dono adiciona a seção "Photo gallery (your photos)".

export type PhotoNeed = {
  /** Onde a foto entra no editor. */
  label: string;
  count: string;
  tip: string;
};

export type PhotoPlan = {
  /** Total para mostrar no cartão do layout ("7 to 11 photos"). */
  total: string;
  needs: PhotoNeed[];
};

const GALLERY: PhotoNeed = {
  label: "Photo gallery",
  count: "6 to 10",
  tip: "Your work, your place and your team. The first two also sit next to your About text.",
};

const COVER: Record<Exclude<Composition, "typographic">, string> = {
  "service-led": "Landscape. Your name goes on top of it, so a calm photo works best.",
  immersive: "Landscape. Your name goes on top of it, so a calm photo works best.",
  editorial: "Portrait (taller than wide). It sits beside your headline.",
  modular: "Landscape and wide. It runs the full width under your name.",
};

/** Plano de fotos do layout escolhido ("auto" = a No Sweat escolhe o layout depois). */
export function photoPlan(layout: Composition | "auto"): PhotoPlan {
  if (layout === "typographic") {
    return { total: "6 to 10 photos", needs: [GALLERY] };
  }
  const tip =
    layout === "auto" ? "Landscape works with every layout. Pick your best shot." : COVER[layout];
  return { total: "7 to 11 photos", needs: [{ label: "Cover photo", count: "1", tip }, GALLERY] };
}

/** Nota que acompanha o plano: o site não espera as fotos do dono. */
export const PHOTO_PLAN_NOTE =
  "Your site starts with a stock photo picked for your trade. In the editor you can swap it for yours and add a photo gallery.";

/** Quantas fotos o dono pode mandar no /create (o editor aceita mais depois). */
export const MAX_OWN_PHOTOS = 8;

/**
 * Coloca as fotos do dono (kind "owner", já enviadas) no site recém-gerado: a primeira vai para o
 * topo (se o topo ainda não tem foto) e as demais viram uma galeria antes do contato. Não
 * coloca foto em serviço nem em "quem somos": só o dono sabe o que cada foto mostra. Sem
 * fotos, devolve o mesmo objeto. Respeita o limite de 10 seções e de 12 fotos da galeria.
 */
export function placeOwnerPhotos(spec: SiteSpec, photos: SiteImage[]): SiteSpec {
  const owner = photos.filter((photo) => photo.kind === "owner");
  if (owner.length === 0) return spec;

  let rest = owner;
  let sections = spec.sections.slice();
  const heroIndex = sections.findIndex((section) => section.type === "hero");
  const hero = sections[heroIndex];
  if (hero?.type === "hero" && !hero.image) {
    sections[heroIndex] = { ...hero, image: owner[0]! };
    rest = owner.slice(1);
  }

  if (rest.length > 0) {
    const galleryIndex = sections.findIndex((section) => section.type === "gallery");
    const gallery = sections[galleryIndex];
    if (gallery?.type === "gallery") {
      sections[galleryIndex] = { ...gallery, images: [...gallery.images, ...rest].slice(0, 12) };
    } else if (sections.length < 10) {
      const contactIndex = sections.findIndex((section) => section.type === "contact");
      const at = contactIndex === -1 ? sections.length : contactIndex;
      sections = [
        ...sections.slice(0, at),
        { type: "gallery", images: rest.slice(0, 12) },
        ...sections.slice(at),
      ];
    }
  }
  return { ...spec, sections };
}
