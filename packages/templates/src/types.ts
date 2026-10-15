import type { SiteSpec } from "@nosweat/schema";
import type { ComponentType } from "react";

export type TemplateProps = {
  spec: SiteSpec;
  /** Endpoint do formulário de contato; ausente no preview (o envio fica desligado). */
  contactEndpoint?: string;
  /** Modo de edição do editor (ver SiteRenderer). Ausente no site publicado. */
  editable?: boolean;
  /** Seção destacada no modo de edição. */
  selectedSection?: number | null;
  /**
   * `false`: sem ids de seção (#services, #faq...) nem #top. Para miniaturas do site dentro de
   * outra página (ex.: demonstrações da landing), onde esses ids colidiriam com os da página.
   */
  anchors?: boolean;
};
export type TemplateComponent = ComponentType<TemplateProps>;
