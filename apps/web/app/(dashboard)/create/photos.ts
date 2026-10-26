import type { Composition } from "@nosweat/schema";

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
