import type { TemplateProps } from "../types";
import { HomeServicesTemplate } from "./home-services/HomeServicesTemplate";

// TODO(front): template próprio para salões, spas e estética. Por enquanto reaproveita o home-services.
export function BeautyTemplate(props: TemplateProps) {
  return <HomeServicesTemplate {...props} />;
}
