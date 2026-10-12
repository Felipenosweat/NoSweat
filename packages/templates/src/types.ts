import type { SiteSpec } from "@nosweat/schema";
import type { ComponentType } from "react";

export type TemplateProps = { spec: SiteSpec };
export type TemplateComponent = ComponentType<TemplateProps>;
