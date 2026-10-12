import type { TemplateProps } from "../types";
import { HomeServicesTemplate } from "./home-services/HomeServicesTemplate";

// TODO(front): template próprio para portfólios (fotógrafos, designers, artistas).
// Por enquanto reaproveita o home-services.
export function PortfolioTemplate(props: TemplateProps) {
  return <HomeServicesTemplate {...props} />;
}
