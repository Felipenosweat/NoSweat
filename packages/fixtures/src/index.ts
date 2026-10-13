import type { SiteSpec } from "@nosweat/schema";
import { glowSalon } from "./glow-salon";
import { joesPlumbing } from "./joes-plumbing";
import { rosasKitchen } from "./rosas-kitchen";
import { sparkleCleaning } from "./sparkle-cleaning";

export { glowSalon, joesPlumbing, rosasKitchen, sparkleCleaning };

/** Todas as fixtures, indexadas pelo slug. */
export const fixtures = {
  "joes-plumbing": joesPlumbing,
  "glow-salon": glowSalon,
  "rosas-kitchen": rosasKitchen,
  "sparkle-cleaning": sparkleCleaning,
} as const satisfies Record<string, SiteSpec>;

export type FixtureSlug = keyof typeof fixtures;
