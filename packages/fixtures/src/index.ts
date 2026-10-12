import type { SiteSpec } from "@nosweat/schema";
import { glowSalon } from "./glow-salon";
import { joesPlumbing } from "./joes-plumbing";
import { rosasKitchen } from "./rosas-kitchen";

export { glowSalon, joesPlumbing, rosasKitchen };

/** Todas as fixtures, indexadas pelo slug. */
export const fixtures = {
  "joes-plumbing": joesPlumbing,
  "glow-salon": glowSalon,
  "rosas-kitchen": rosasKitchen,
} as const satisfies Record<string, SiteSpec>;

export type FixtureSlug = keyof typeof fixtures;
