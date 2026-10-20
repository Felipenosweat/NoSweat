import type { ModelEntry } from "./types";
import { archAndLash } from "./arch-and-lash";
import { baysideFamilyDental } from "./bayside-family-dental";
import { brickOvenPizza } from "./brick-oven-pizza";
import { brightSparkElectric } from "./bright-spark-electric";
import { fadeAndCoBarbers } from "./fade-and-co-barbers";
import { fieldworkStudio } from "./fieldwork-studio";
import { greenlineLandscaping } from "./greenline-landscaping";
import { hollisInteriors } from "./hollis-interiors";
import { ironLotusTattoo } from "./iron-lotus-tattoo";
import { keystoneInsurance } from "./keystone-insurance";
import { mercerLaw } from "./mercer-law";
import { northLoopCoffee } from "./north-loop-coffee";
import { openDoorCounseling } from "./open-door-counseling";
import { polishedNailStudio } from "./polished-nail-studio";
import { reelNorthFilms } from "./reel-north-films";
import { smokeAndRailBbq } from "./smoke-and-rail-bbq";
import { stillWaterSpa } from "./still-water-spa";
import { sunriseBakery } from "./sunrise-bakery";
import { trueCoatPainting } from "./true-coat-painting";

export type { ModelEntry } from "./types";

/**
 * Biblioteca de sites-modelo (além dos 6 originais em ../): com eles, 5 por categoria, cada um
 * com uma composição diferente. Ver types.ts e apps/web/server/ai/models.ts.
 */
export const MODEL_LIBRARY: readonly ModelEntry[] = [
  archAndLash,
  baysideFamilyDental,
  brickOvenPizza,
  brightSparkElectric,
  fadeAndCoBarbers,
  fieldworkStudio,
  greenlineLandscaping,
  hollisInteriors,
  ironLotusTattoo,
  keystoneInsurance,
  mercerLaw,
  northLoopCoffee,
  openDoorCounseling,
  polishedNailStudio,
  reelNorthFilms,
  smokeAndRailBbq,
  stillWaterSpa,
  sunriseBakery,
  trueCoatPainting,
];
