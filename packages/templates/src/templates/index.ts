import type { TemplateId } from "@nosweat/schema";
import type { TemplateComponent } from "../types";
import { BeautyTemplate } from "./beauty";
import { HomeServicesTemplate } from "./home-services/HomeServicesTemplate";
import { PortfolioTemplate } from "./portfolio";
import { ProfessionalTemplate } from "./professional";
import { RestaurantTemplate } from "./restaurant";

/** Um componente para cada TemplateId do schema (o TypeScript exige todos). */
export const TEMPLATES: Record<TemplateId, TemplateComponent> = {
  "home-services": HomeServicesTemplate,
  beauty: BeautyTemplate,
  restaurant: RestaurantTemplate,
  professional: ProfessionalTemplate,
  portfolio: PortfolioTemplate,
};
