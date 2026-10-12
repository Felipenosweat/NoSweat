import type { SiteSpec } from "@nosweat/schema";

/**
 * Gera um SiteSpec a partir da descrição do cliente.
 * Regra de ouro: a IA nunca escreve código de site, só o SiteSpec (validado depois por SiteSpec.parse).
 */
export interface SiteGenerator {
  generateSite(brief: string): Promise<SiteSpec>;
}
