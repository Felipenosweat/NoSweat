import type { SiteSpec } from "@nosweat/schema";
import { TEMPLATES } from "./templates";
import { themeToCssVars } from "./theme";

export type SiteRendererProps = { spec: SiteSpec };

/**
 * Desenha um site completo a partir de um SiteSpec já validado.
 * As cores do tema viram variáveis CSS (--ns-*) neste wrapper; os componentes só usam essas variáveis.
 */
export function SiteRenderer({ spec }: SiteRendererProps) {
  const Template = TEMPLATES[spec.template];
  return (
    <div
      className="ns-site min-h-screen bg-ns-background font-ns-body text-ns-text antialiased"
      style={themeToCssVars(spec.theme)}
      data-template={spec.template}
    >
      <Template spec={spec} />
    </div>
  );
}
