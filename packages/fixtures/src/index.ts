import type { SiteSpec } from "@nosweat/schema";
import { glowSalon } from "./glow-salon";
import { haleOrtiz } from "./hale-ortiz";
import { joesPlumbing } from "./joes-plumbing";
import { rosasKitchen } from "./rosas-kitchen";
import { sparkleCleaning } from "./sparkle-cleaning";
import { vegaPhoto } from "./vega-photo";

export { glowSalon, haleOrtiz, joesPlumbing, rosasKitchen, sparkleCleaning, vegaPhoto };
export { exampleBriefs, secondDirectionBrief } from "./briefs";
export { MODEL_LIBRARY, type ModelEntry } from "./library";

/** Todas as fixtures (os sites-modelo de cada categoria), indexadas pelo slug. */
export const fixtures = {
  "joes-plumbing": joesPlumbing,
  "glow-salon": glowSalon,
  "rosas-kitchen": rosasKitchen,
  "sparkle-cleaning": sparkleCleaning,
  "hale-ortiz": haleOrtiz,
  "vega-photo": vegaPhoto,
} as const satisfies Record<string, SiteSpec>;

export type FixtureSlug = keyof typeof fixtures;
