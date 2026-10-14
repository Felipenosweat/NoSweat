import type { AiEditResult, SiteSpec } from "@nosweat/schema";
import type { DesignPlan } from "../design";

/**
 * Gera um SiteSpec a partir da descrição do cliente.
 * Regra de ouro: a IA nunca escreve código de site, só o SiteSpec (validado depois por SiteSpec.parse).
 */
export interface SiteGenerator {
  /** `plan`: direção de arte escolhida antes (server/design). O gerador escreve o texto para ela. */
  generateSite(brief: string, plan?: DesignPlan): Promise<SiteSpec>;
  /** Aplica um pedido em linguagem natural ao site, mudando só o necessário. */
  editSite(spec: SiteSpec, instruction: string): Promise<AiEditResult>;
}
