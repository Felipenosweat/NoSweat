import type { Composition } from "@nosweat/schema";
import type { TemplateComponent } from "../types";
import { SignatureComposition } from "./Signature";

export { compositionOf } from "./model";

/**
 * Todas as composições usam o molde Signature (o padrão premium aprovado pelo dono); a
 * composição do plano de design escolhe o formato do topo (ver SignatureHero) e o nome do
 * negócio sorteia o menu e os botões (siteStyle).
 */
export const COMPOSITIONS: Record<Composition, TemplateComponent> = {
  "service-led": SignatureComposition,
  editorial: SignatureComposition,
  immersive: SignatureComposition,
  typographic: SignatureComposition,
  modular: SignatureComposition,
};
