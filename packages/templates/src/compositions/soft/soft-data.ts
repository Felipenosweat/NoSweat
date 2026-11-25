import type { SectionOf, SiteImage } from "@nosweat/schema";

// Funções puras da composição "soft" (beleza): ícone por palavra-chave, rótulos curtos, grupos,
// filtro de qualidade das fotos e o desenho da galeria sem buracos. Sem React: fácil de testar.

export type IconKey =
  | "scissors"
  | "brush"
  | "droplet"
  | "wind"
  | "nail"
  | "crown"
  | "lotus"
  | "sparkle";

type ServiceItem = SectionOf<"services">["items"][number];

// A ordem importa: a primeira regra que bate vence ("Precision cut and blowout" = tesoura).
const ICON_RULES: [IconKey, RegExp][] = [
  ["crown", /bridal|wedding|event|prom|updo/],
  ["nail", /\bnails?\b|manicure|pedicure|polish|\bgel\b|acrylic/],
  ["scissors", /\b(cut|trim|shave|fade|beard|barber|haircut|clipper)/],
  ["brush", /colou?r|balayage|highlight|tint|dye|toner|gloss|ombre|lash|brow|makeup/],
  ["droplet", /treatment|keratin|scalp|hydrat|smoothing|deep condition|mask/],
  ["wind", /blow|style|styling|dry|curl|straighten|braid/],
  ["lotus", /facial|massage|skin|spa|wellness|relax|aroma|scrub|peel|wax/],
];

/** Ícone que combina com o serviço (pelo nome); sem palavra-chave, o brilho. Nunca por posição. */
export function serviceIconKey(name: string): IconKey {
  const text = name.toLowerCase();
  for (const [key, pattern] of ICON_RULES) if (pattern.test(text)) return key;
  return "sparkle";
}

/** Nome curto para o azulejo: "Precision cut and blowout" vira "Precision cut". */
export function shortName(name: string): string {
  const first = name.split(/\s+(?:and|&)\s+|,/i)[0]?.trim();
  return first || name.trim();
}

/** Iniciais para o avatar sem foto ("Camila Reyes" = "CR"). */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const letters = [words[0]?.[0], words.length > 1 ? words.at(-1)?.[0] : undefined];
  return letters.filter(Boolean).join("").toUpperCase();
}

/** Itens seguidos do mesmo `group` ficam juntos; sem grupo, um bloco sem título. */
export function groupServices(items: ServiceItem[]): { name?: string; items: ServiceItem[] }[] {
  const groups: { name?: string; items: ServiceItem[] }[] = [];
  for (const item of items) {
    const name = item.group?.trim() || undefined;
    const last = groups.at(-1);
    if (last && last.name === name) last.items.push(item);
    else groups.push({ name, items: [item] });
  }
  return groups;
}

/** Até 4 serviços para os azulejos: o primeiro de cada grupo, depois completa na ordem da lista. */
export function featuredServices(items: ServiceItem[], max = 4): ServiceItem[] {
  const named = items.filter((item) => item.name.trim());
  const picked: ServiceItem[] = [];
  const seen = new Set<string>();
  for (const item of named) {
    const group = item.group?.trim() ?? "";
    if (seen.has(group)) continue;
    seen.add(group);
    picked.push(item);
  }
  for (const item of named) if (picked.length < max && !picked.includes(item)) picked.push(item);
  return picked.slice(0, max);
}

/** Lado maior da foto, se o dono/plataforma informou largura e altura. */
function longEdge(image: SiteImage): number | undefined {
  return image.width && image.height ? Math.max(image.width, image.height) : undefined;
}

/** Foto boa para o topo: lado maior >= 1200 px (sem medidas, vale). */
export function usableHero(image: SiteImage | undefined): image is SiteImage {
  if (!image) return false;
  const edge = longEdge(image);
  return edge === undefined || edge >= 1200;
}

/** Foto boa para galeria, "quem somos" e miniaturas: lado maior >= 600 px (sem medidas, vale). */
export function usableThumb(image: SiteImage | undefined): image is SiteImage {
  if (!image) return false;
  const edge = longEdge(image);
  return edge === undefined || edge >= 600;
}

/** Como cada foto da galeria ocupa a grade: no celular (2 colunas) e no computador (4 colunas). */
export type TileShape = { m: "full" | "tall" | "sq" | "std"; d: "big" | "w2" | "w4" | "std" };

/** Desenho da galeria que sempre preenche a grade (sem quadro vazio). */
export function galleryShapes(count: number): TileShape[] {
  const shapes: TileShape[] = [];
  for (let i = 0; i < count; i++) {
    let m: TileShape["m"] = i === 1 ? "sq" : "std";
    if (count === 1) m = "full";
    else if (count === 3) m = i === 0 ? "tall" : "sq";
    else if (count >= 5 && count % 2 === 1 && i === count - 1) m = "full";

    let d: TileShape["d"] = "std";
    if (count === 1) d = "w4";
    else if (count === 2) d = "w2";
    else if (count === 3) d = i === 0 ? "big" : "w2";
    else if (count >= 5 && count % 4 === 1) d = i === 0 ? "big" : "std";
    else if (count > 4) {
      const rest = count % 4;
      const tail = count - rest;
      if (rest === 1 && i === tail) d = "w4";
      else if (rest === 2 && i >= tail) d = "w2";
      else if (rest === 3 && i === tail) d = "w2";
    }
    shapes.push({ m, d });
  }
  return shapes;
}

/** Preço em centavos a partir do texto do dono ("from $85", "$1,200.50"); sem valor, `null`. */
export function priceToCents(price: string | undefined): number | null {
  const match = price ? /\$\s?(\d{1,3}(?:,\d{3})+|\d+)(\.\d{1,2})?/.exec(price) : null;
  if (!match?.[1]) return null;
  const value = Number(`${match[1].replace(/,/g, "")}${match[2] ?? ""}`);
  return Number.isFinite(value) ? Math.round(value * 100) : null;
}

/** Duração em minutos a partir do detalhe ("60 min", "About 3 hours"); sem valor, 60. */
export function detailToMinutes(detail: string | undefined): number {
  const text = detail ?? "";
  const hours = /(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours)\b/i.exec(text);
  if (hours?.[1]) return Math.min(480, Math.max(15, Math.round(Number(hours[1]) * 60)));
  const minutes = /(\d+)\s*min/i.exec(text);
  if (minutes?.[1]) return Math.min(480, Math.max(15, Number(minutes[1])));
  return 60;
}
