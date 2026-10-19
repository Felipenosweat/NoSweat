import { fixtures } from "@nosweat/fixtures";
import type { SiteSpec, TemplateId } from "@nosweat/schema";
import { readBrief } from "../design";

// Sites-modelo de cada categoria (docs/design/model-sites.md). A geração "a partir do modelo"
// parte de um destes: estrutura, tema, composição e ordem das seções vêm daqui; a IA só escreve
// os textos (ModelFill, ver model-fill.ts). Os FATOS dos modelos (nome, telefone, preços,
// pessoas...) nunca passam para o site do cliente: applyModelFill apaga tudo antes de juntar.
export const MODELS: Record<TemplateId, SiteSpec> = {
  "home-services": fixtures["joes-plumbing"],
  beauty: fixtures["glow-salon"],
  restaurant: fixtures["rosas-kitchen"],
  professional: fixtures["hale-ortiz"],
  portfolio: fixtures["vega-photo"],
};

/** Modelo alternativo de serviços para casa: limpeza (composição modular). */
export const CLEANING_MODEL: SiteSpec = fixtures["sparkle-cleaning"];

/** Sem acento e em minúsculas. */
function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

/**
 * Categoria (template) do pedido, pelos mesmos sinais da direção de arte (server/design).
 * `null` quando não dá para ter certeza: nesse caso a geração usa o caminho completo, em que a
 * própria IA escolhe o template.
 */
export function templateFor(brief: string): TemplateId | null {
  const { industry } = readBrief(brief);
  switch (industry) {
    case "trades":
    case "cleaning":
      return "home-services";
    case "beauty":
      return "beauty";
    case "food":
      return "restaurant";
    case "professional":
      return "professional";
    case "creative":
      return "portfolio";
    case "wellness": {
      // Spa e massagem ficam com beleza; clínicas e terapias, com profissionais (como no
      // prompt do caminho completo). Academia, ioga etc.: caminho completo.
      const text = normalize(brief);
      if (/\b(spa|massage|facial|esthetic)/.test(text)) return "beauty";
      if (/\b(dentist|dental|clinic|therap|chiropract|acupunct)/.test(text)) return "professional";
      return null;
    }
    case "other":
      return null;
  }
}

/** Site-modelo da categoria; pedidos de limpeza usam o modelo de limpeza. */
export function modelFor(template: TemplateId, brief: string): SiteSpec {
  if (template === "home-services" && readBrief(brief).industry === "cleaning") {
    return CLEANING_MODEL;
  }
  return MODELS[template];
}
