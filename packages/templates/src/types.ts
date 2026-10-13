import type { SiteSpec } from "@nosweat/schema";
import type { ComponentType } from "react";

export type TemplateProps = {
  spec: SiteSpec;
  /** Endpoint do formulário de contato; ausente no preview (o envio fica desligado). */
  contactEndpoint?: string;
};
export type TemplateComponent = ComponentType<TemplateProps>;
