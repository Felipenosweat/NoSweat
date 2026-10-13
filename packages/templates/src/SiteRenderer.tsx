import type { SiteSpec } from "@nosweat/schema";
import { TEMPLATES } from "./templates";
import { themeToCssVars } from "./theme";

export type SiteRendererProps = { spec: SiteSpec; contactEndpoint?: string };

/**
 * Desenha um site completo a partir de um SiteSpec já validado.
 * As cores do tema viram variáveis CSS (--ns-*) neste wrapper; os componentes só usam essas variáveis.
 * O wrapper também é um "size container" (@container): o layout responde à largura que o site
 * realmente tem (ex.: a prévia do editor), não à largura da janela. Na página publicada o
 * wrapper ocupa a tela toda, então o resultado é o mesmo das variantes sm:/md:/lg:.
 * `data-font` deixa o CSS ajustar detalhes por par de fontes (ver styles.css).
 */
export function SiteRenderer({ spec, contactEndpoint }: SiteRendererProps) {
  const Template = TEMPLATES[spec.template];
  return (
    <div
      className="ns-site @container min-h-screen bg-ns-background font-ns-body text-ns-text antialiased"
      style={themeToCssVars(spec.theme)}
      data-template={spec.template}
      data-font={spec.theme.font}
    >
      <Template spec={spec} contactEndpoint={contactEndpoint} />
    </div>
  );
}
