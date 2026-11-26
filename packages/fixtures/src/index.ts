import type { SiteSpec } from "@nosweat/schema";
import { glowSalon as glowSalonBase } from "./glow-salon";
import { haleOrtiz as haleOrtizBase } from "./hale-ortiz";
import { joesPlumbing as joesPlumbingBase } from "./joes-plumbing";
import { withModelPhotos } from "./model-photos";
import { rosasKitchen as rosasKitchenBase } from "./rosas-kitchen";
import { sparkleCleaning as sparkleCleaningBase } from "./sparkle-cleaning";
import { vegaPhoto as vegaPhotoBase } from "./vega-photo";

// Os modelos de beleza saem com as fotos do Unsplash escolhidas para eles (ver model-photos.ts).
// Os outros quatro modelos-base usam fotos locais que combinam com o ofício (casa, restaurante) ou
// nenhuma (profissional); o portfólio traz as fotos verificadas dentro do próprio arquivo.
export const glowSalon = withModelPhotos("glow-salon", glowSalonBase);
export const haleOrtiz = haleOrtizBase;
export const joesPlumbing = joesPlumbingBase;
export const rosasKitchen = rosasKitchenBase;
export const sparkleCleaning = sparkleCleaningBase;
export const vegaPhoto = vegaPhotoBase;
export { exampleBriefs, secondDirectionBrief } from "./briefs";
export { MODEL_LIBRARY, type ModelEntry } from "./library";
export { MODEL_PHOTO_LICENSES } from "./library/photo-licenses";
export { MODEL_UNSPLASH_PHOTOS } from "./unsplash-photos";

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
