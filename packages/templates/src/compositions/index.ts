import type { Composition } from "@nosweat/schema";
import { HomeServicesTemplate } from "../templates/home-services/HomeServicesTemplate";
import type { TemplateComponent } from "../types";
import { EditorialComposition } from "./Editorial";
import { ImmersiveComposition } from "./Immersive";
import { ModularComposition } from "./Modular";
import { TypographicComposition } from "./Typographic";

export { compositionOf } from "./model";

/**
 * Uma arquitetura de página para cada composição do schema (o TypeScript exige todas).
 * "service-led" é o layout que todos os sites tinham antes (sites sem `design` continuam nele).
 */
export const COMPOSITIONS: Record<Composition, TemplateComponent> = {
  "service-led": HomeServicesTemplate,
  editorial: EditorialComposition,
  immersive: ImmersiveComposition,
  typographic: TypographicComposition,
  modular: ModularComposition,
};
