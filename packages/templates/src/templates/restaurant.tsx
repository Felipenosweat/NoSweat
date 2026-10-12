import type { TemplateProps } from "../types";
import { HomeServicesTemplate } from "./home-services/HomeServicesTemplate";

// TODO(front): template próprio para restaurantes e cafés (cardápio, horários, reservas).
// Por enquanto reaproveita o home-services.
export function RestaurantTemplate(props: TemplateProps) {
  return <HomeServicesTemplate {...props} />;
}
