import type { SiteSpec } from "@nosweat/schema";
import { TEMPLATES } from "./templates";
import { themeToCssVars } from "./theme";

export type SiteRendererProps = {
  spec: SiteSpec;
  contactEndpoint?: string;
  /**
   * Modo de edição (só o editor usa): cada seção ganha uma moldura com `data-section-index`,
   * contorno ao passar o mouse e um rótulo clicável. Padrão `false`: o site publicado não muda.
   */
  editable?: boolean;
  /** Seção destacada no modo de edição (índice em `spec.sections`). */
  selectedSection?: number | null;
};

/**
 * Desenha um site completo a partir de um SiteSpec já validado.
 * As cores do tema viram variáveis CSS (--ns-*) neste wrapper; os componentes só usam essas variáveis.
 * O wrapper também é um "size container" (@container): o layout responde à largura que o site
 * realmente tem (ex.: a prévia do editor), não à largura da janela. Na página publicada o
 * wrapper ocupa a tela toda, então o resultado é o mesmo das variantes sm:/md:/lg:.
 * `data-font` deixa o CSS ajustar detalhes por par de fontes (ver styles.css).
 */
export function SiteRenderer({
  spec,
  contactEndpoint,
  editable = false,
  selectedSection = null,
}: SiteRendererProps) {
  const Template = TEMPLATES[spec.template];
  return (
    <div
      className="ns-site @container min-h-screen bg-ns-background font-ns-body text-ns-text antialiased"
      style={themeToCssVars(spec.theme)}
      data-template={spec.template}
      data-font={spec.theme.font}
      data-editable={editable ? "" : undefined}
    >
      {editable ? (
        <Template
          spec={spec}
          contactEndpoint={contactEndpoint}
          editable
          selectedSection={selectedSection}
        />
      ) : (
        <Template spec={spec} contactEndpoint={contactEndpoint} />
      )}
    </div>
  );
}
