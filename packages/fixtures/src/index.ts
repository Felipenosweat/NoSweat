import type { SiteSpec } from "@nosweat/schema";
import { glowSalon as glowSalonBase } from "./glow-salon";
import { haleOrtiz as haleOrtizBase } from "./hale-ortiz";
import { joesPlumbing as joesPlumbingBase } from "./joes-plumbing";
import { withModelPhotos } from "./model-photos";
import { rosasKitchen as rosasKitchenBase } from "./rosas-kitchen";
import { sparkleCleaning as sparkleCleaningBase } from "./sparkle-cleaning";
import { vegaPhoto as vegaPhotoBase } from "./vega-photo";

// Cada modelo sai com as fotos do Unsplash escolhidas para ele (ver model-photos.ts).
export const glowSalon = withModelPhotos("glow-salon", glowSalonBase);
export const haleOrtiz = withModelPhotos("hale-ortiz", haleOrtizBase);
export const joesPlumbing = withModelPhotos("joes-plumbing", joesPlumbingBase);
export const rosasKitchen = withModelPhotos("rosas-kitchen", rosasKitchenBase);
export const sparkleCleaning = withModelPhotos("sparkle-cleaning", sparkleCleaningBase);
export const vegaPhoto = withModelPhotos("vega-photo", vegaPhotoBase);
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
