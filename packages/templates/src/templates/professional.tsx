import type { TemplateProps } from "../types";
import { HomeServicesTemplate } from "./home-services/HomeServicesTemplate";

// TODO(front): template próprio para escritórios (advogados, contadores, consultores).
// Por enquanto reaproveita o home-services.
export function ProfessionalTemplate(props: TemplateProps) {
  return <HomeServicesTemplate {...props} />;
}
