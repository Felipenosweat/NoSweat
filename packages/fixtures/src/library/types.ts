import type { SiteSpec, TemplateId } from "@nosweat/schema";

// Biblioteca de sites-modelo: 5 por categoria, cada um com uma composição diferente. A geração
// "a partir do modelo" (apps/web/server/ai/models.ts) escolhe o mais parecido com o pedido do
// cliente (palavras do ramo + composição escolhida pela direção de arte) e a IA barata só
// reescreve os textos. Os fatos de cada modelo (nome, telefone, preços...) nunca passam para o
// site do cliente: applyModelFill apaga tudo antes de juntar.
export type ModelEntry = {
  /** Identificador único (kebab-case), também usado em /examples/<slug>. */
  slug: string;
  /** Categoria (template) do modelo. */
  category: TemplateId;
  /**
   * Palavras (em inglês, minúsculas, sem acento) que, no pedido do cliente, indicam este ramo.
   * Ex.: ["electrician", "electrical", "wiring", "panel", "ev charger"].
   */
  keywords: string[];
  /**
   * Descrição do negócio fictício como o dono escreveria no /create. Regra 8: todo fato que o
   * site mostra (telefone, endereço, preços, anos, pessoas, depoimentos, horário) está aqui.
   */
  brief: string;
  spec: SiteSpec;
};
