import type { Composition } from "@nosweat/schema";
import type { TemplateComponent } from "../types";
import { EditorialComposition } from "./Editorial";
import { ImmersiveComposition } from "./Immersive";
import { ModularComposition } from "./Modular";
import { ServiceLedComposition } from "./ServiceLed";
import { TypographicComposition } from "./Typographic";

export { compositionOf } from "./model";

/**
 * Uma arquitetura de página para cada composição do schema (o TypeScript exige todas).
 * "service-led" é também a dos sites sem `design` (os antigos continuam nela).
 */
export const COMPOSITIONS: Record<Composition, TemplateComponent> = {
  "service-led": ServiceLedComposition,
  editorial: EditorialComposition,
  immersive: ImmersiveComposition,
  typographic: TypographicComposition,
  modular: ModularComposition,
};
