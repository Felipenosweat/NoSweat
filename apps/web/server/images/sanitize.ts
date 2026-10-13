import type { Section, SectionOf, SiteSpec } from "@nosweat/schema";

// A IA nunca escolhe fotos: ela só escreve `hero.imageQuery`. Fotos (`hero.image`) e galerias
// (fotos do dono) são da plataforma e do dono. Este arquivo garante isso na saída da IA.

const MAX_SECTIONS = 10;

type Gallery = SectionOf<"gallery">;
type Hero = SectionOf<"hero">;

/** Último índice que passa no teste, ou -1 (o lib do projeto é ES2022, sem findLastIndex). */
function lastIndexWhere(sections: Section[], test: (section: Section) => boolean): number {
  for (let i = sections.length - 1; i >= 0; i -= 1) {
    const section = sections[i];
    if (section && test(section)) return i;
  }
  return -1;
}

function isGallery(section: Section): section is Gallery {
  return section.type === "gallery";
}

/** Hero sem `image` (o resto fica igual). */
function withoutImage(hero: Hero): Hero {
  const rest = { ...hero };
  delete rest.image;
  return rest;
}

/**
 * Regra do hero numa EDIÇÃO (cada hero novo é comparado com o hero de mesma ordem no anterior):
 * - A foto anterior volta sempre, mesmo que a IA tenha mudado ou apagado `image`...
 * - ...exceto quando a IA devolve o hero SEM `image` e SEM `imageQuery`: isso é o sinal de
 *   que o dono pediu para tirar a foto (o prompt de edição manda fazer exatamente isso).
 * - Se a IA mudou `imageQuery` (o dono pediu outra foto), a foto anterior sai e o servidor
 *   busca uma nova com o novo `imageQuery` (ver resolveHeroImage).
 * - A IA nunca coloca foto: um `image` que não existia antes é descartado.
 */
function restoreHero(next: Hero, previous: Hero | undefined): Hero {
  const clean = withoutImage(next);
  if (!previous?.image) return clean;

  const queryCleared = !next.image && !next.imageQuery?.trim();
  if (queryCleared) return clean;

  const queryChanged = Boolean(next.imageQuery?.trim()) && next.imageQuery !== previous.imageQuery;
  if (queryChanged) return clean;

  return { ...clean, image: previous.image };
}

/** Chave da âncora de uma galeria: a seção (tipo + ordem entre as do mesmo tipo) logo antes dela. */
function anchorKeys(sections: Section[]): (string | null)[] {
  const counts = new Map<string, number>();
  let lastAnchor: string | null = null;
  return sections.map((section) => {
    if (isGallery(section)) return lastAnchor;
    const n = counts.get(section.type) ?? 0;
    counts.set(section.type, n + 1);
    lastAnchor = `${section.type}#${n}`;
    return null;
  });
}

/**
 * Coloca as galerias do site anterior de volta na nova lista de seções (sem galerias), cada
 * uma logo depois da mesma seção que vinha antes dela. Se essa seção sumiu, a galeria vai para
 * antes do contato (ou para o fim).
 */
function restoreGalleries(sections: Section[], previous: Section[]): Section[] {
  const anchors = anchorKeys(previous);
  const leading: Gallery[] = [];
  const byAnchor = new Map<string, Gallery[]>();
  previous.forEach((section, i) => {
    if (!isGallery(section)) return;
    const anchor = anchors[i];
    if (!anchor) leading.push(section);
    else byAnchor.set(anchor, [...(byAnchor.get(anchor) ?? []), section]);
  });

  const result: Section[] = [...leading];
  const counts = new Map<string, number>();
  for (const section of sections) {
    result.push(section);
    const n = counts.get(section.type) ?? 0;
    counts.set(section.type, n + 1);
    const key = `${section.type}#${n}`;
    const galleries = byAnchor.get(key);
    if (galleries) {
      result.push(...galleries);
      byAnchor.delete(key);
    }
  }

  const orphans = [...byAnchor.values()].flat();
  if (orphans.length > 0) {
    const contactIndex = lastIndexWhere(result, (section) => section.type === "contact");
    result.splice(contactIndex === -1 ? result.length : contactIndex, 0, ...orphans);
  }
  return result;
}

/** Mantém o limite de seções sem tirar hero, contato nem galerias (fotos do dono). */
function fitSectionLimit(sections: Section[]): Section[] {
  const result = sections.slice();
  while (result.length > MAX_SECTIONS) {
    const index = lastIndexWhere(
      result,
      (section) => !["hero", "contact", "gallery"].includes(section.type),
    );
    if (index === -1) break;
    result.splice(index, 1);
  }
  return result;
}

/**
 * Limpa as fotos da saída da IA.
 * - Geração (sem `previousSpec`): tira `image` de todo hero e descarta galerias.
 * - Edição (com `previousSpec`): o hero recupera a foto anterior (ver restoreHero), galerias
 *   inventadas pela IA saem e as galerias do site anterior voltam exatamente como eram, na
 *   mesma posição relativa. A IA não apaga nem muda galerias: isso é feito no editor.
 */
export function sanitizeAiImages(newSpec: SiteSpec, previousSpec?: SiteSpec): SiteSpec {
  const previousHeroes = (previousSpec?.sections ?? []).filter(
    (section): section is Hero => section.type === "hero",
  );
  let heroIndex = 0;
  const sections = newSpec.sections
    .filter((section) => !isGallery(section))
    .map((section) => {
      if (section.type !== "hero") return section;
      const previous = previousSpec ? previousHeroes[heroIndex] : undefined;
      heroIndex += 1;
      return restoreHero(section, previous);
    });

  if (!previousSpec) return { ...newSpec, sections };
  return {
    ...newSpec,
    sections: fitSectionLimit(restoreGalleries(sections, previousSpec.sections)),
  };
}
