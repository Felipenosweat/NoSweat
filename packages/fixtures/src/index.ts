import type { SiteSpec } from "@nosweat/schema";
import { glowSalon } from "./glow-salon";
import { haleOrtiz } from "./hale-ortiz";
import { joesPlumbing } from "./joes-plumbing";
import { rosasKitchen } from "./rosas-kitchen";
import { sparkleCleaning } from "./sparkle-cleaning";

export { glowSalon, haleOrtiz, joesPlumbing, rosasKitchen, sparkleCleaning };
export { exampleBriefs, secondDirectionBrief } from "./briefs";

/** Todas as fixtures, indexadas pelo slug. */
export const fixtures = {
  "joes-plumbing": joesPlumbing,
  "glow-salon": glowSalon,
  "rosas-kitchen": rosasKitchen,
  "sparkle-cleaning": sparkleCleaning,
  "hale-ortiz": haleOrtiz,
} as const satisfies Record<string, SiteSpec>;

export type FixtureSlug = keyof typeof fixtures;
