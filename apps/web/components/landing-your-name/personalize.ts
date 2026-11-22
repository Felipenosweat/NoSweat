import type { Composition, SiteDesign, SiteSpec } from "@nosweat/schema";

// Landing "Your name on it": o visitante digita o nome da empresa (e a cidade, se quiser) e a
// prévia de verdade (<SiteRenderer>) de um site de exemplo troca SÓ o nome (menu, topo, rodapé) e
// a cidade do topo. O resto do texto continua o do negócio inventado, e a página diz isso.
// Funções puras: rodam no servidor (montar a base) e no navegador (a cada digitação).

/** Limites do campo (o /create corta o pedido em 2000 caracteres; aqui é só um nome). */
export const NAME_LIMIT = 60;
export const CITY_LIMIT = 40;

/** Nome mostrado enquanto o campo está vazio: um convite, não um negócio inventado. */
export const PLACEHOLDER_NAME = "Your Business";

/** Composição da prévia do topo: pôster tipográfico, o nome gigante (sem foto na primeira tela). */
export const HERO_COMPOSITION: Composition = "typographic";

/** As três composições da área "switch the style", na ordem dos botões. */
export const STYLE_OPTIONS: readonly { id: Composition; label: string; description: string }[] = [
  {
    id: "service-led",
    label: "Photo first",
    description: "Your name over a full-width photo, with hours and phone right under it.",
  },
  {
    id: "editorial",
    label: "Magazine",
    description: "A big headline next to a tall photo, like the cover of a local magazine.",
  },
  {
    id: "modular",
    label: "Name on top",
    description: "Your name across the whole page, then the photo in a wide band.",
  },
];

/** Seções que a moldura mostra (só o topo aparece) e as que o topo consulta (preço, botão). */
const PREVIEW_SECTIONS = new Set<SiteSpec["sections"][number]["type"]>([
  "hero",
  "services",
  "contact",
]);

/** Formato fixo de menu, botões e contato (sem ele, o renderer sorteia pelo nome digitado). */
export type FixedStyle = Required<Pick<SiteDesign, "buttons" | "header" | "contact">>;

/**
 * Base leve da prévia: só as seções do topo e o estilo travado, para o site não trocar de menu
 * ou de botão a cada letra (`siteStyle` sorteia pelo nome quando o design não diz).
 */
export function previewBase(spec: SiteSpec, style: FixedStyle): SiteSpec {
  const design: SiteDesign = { composition: "service-led", ...spec.design, ...style };
  return {
    ...spec,
    design,
    sections: spec.sections.filter((section) => PREVIEW_SECTIONS.has(section.type)),
  };
}

/** Espaços repetidos viram um só, sem espaço nas pontas, cortado no limite. */
export function cleanText(value: string, limit: number): string {
  return value.replace(/\s+/g, " ").trim().slice(0, limit).trim();
}

/** Troca uma palavra inteira (a cidade do exemplo) sem mexer em pedaços de outras palavras. */
function replaceWord(text: string, from: string, to: string): string {
  if (!from) return text;
  const escaped = from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text.replace(new RegExp(`\\b${escaped}\\b`, "g"), to);
}

/**
 * O exemplo com o nome (e a cidade) do visitante. Muda só o que a página promete: o nome
 * (menu, topo, rodapé) e, com cidade, a cidade do topo e a área atendida. Nome vazio mostra
 * `PLACEHOLDER_NAME`. Também escolhe a composição.
 */
export function withName(
  base: SiteSpec,
  input: { name: string; city: string },
  composition: Composition,
): SiteSpec {
  const name = cleanText(input.name, NAME_LIMIT) || PLACEHOLDER_NAME;
  const city = cleanText(input.city, CITY_LIMIT);
  const exampleCity = base.business.city ?? "";
  const business = city
    ? // Outra cidade: o estado e a lista de cidades do exemplo deixam de valer.
      { ...base.business, name, city, state: undefined, serviceArea: undefined }
    : { ...base.business, name };
  const sections = base.sections.map((section) => {
    if (section.type !== "hero" || !city) return section;
    return {
      ...section,
      title: replaceWord(section.title, exampleCity, city),
      subtitle: replaceWord(section.subtitle, exampleCity, city),
    };
  });
  return {
    ...base,
    design: { ...(base.design ?? { composition }), composition },
    business,
    sections,
  };
}

/** Endereço grátis no formato real (`nosweatfd.com/s/<slug>`), só para a barra da moldura. */
export function slugOf(name: string): string {
  const slug = cleanText(name, NAME_LIMIT)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "your-business";
}

/** Primeira frase do pedido no /create ("Rivera Plumbing in Austin"); vazio sem nome. */
export function briefFrom(name: string, city: string): string {
  const cleanName = cleanText(name, NAME_LIMIT);
  if (!cleanName) return "";
  const cleanCity = cleanText(city, CITY_LIMIT);
  return cleanCity ? `${cleanName} in ${cleanCity}` : cleanName;
}

/**
 * Destino do botão: o /create aceita `?brief=` (preenche o primeiro passo, sem começar sozinho).
 * Sem nome, só /create.
 */
export function createHref(name: string, city: string): string {
  const brief = briefFrom(name, city);
  return brief ? `/create?brief=${encodeURIComponent(brief)}` : "/create";
}
