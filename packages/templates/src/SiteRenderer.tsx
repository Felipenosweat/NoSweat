import type { SiteSpec } from "@nosweat/schema";
import { NoSweatBadge } from "./components/NoSweatBadge";
import { COMPOSITIONS, compositionOf } from "./compositions";
import { siteStyle } from "./compositions/model";
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
  /** `false` para miniaturas dentro de outra página: sem ids de seção (ver TemplateProps). */
  anchors?: boolean;
};

/**
 * Desenha um site completo a partir de um SiteSpec já validado.
 * As cores do tema viram variáveis CSS (--ns-*) neste wrapper; os componentes só usam essas variáveis.
 * O wrapper também é um "size container" (@container): o layout responde à largura que o site
 * realmente tem (ex.: a prévia do editor), não à largura da janela. Na página publicada o
 * wrapper ocupa a tela toda, então o resultado é o mesmo das variantes sm:/md:/lg:.
 * `data-font` deixa o CSS ajustar detalhes por par de fontes; `data-density` e `data-image` aplicam
 * o respiro entre seções e o tratamento das fotos do plano de design (ver styles.css).
 * No fim vem sempre o selo "Website by nosweatfd" (NoSweatBadge), que não depende do spec.
 */
export function SiteRenderer({
  spec,
  contactEndpoint,
  editable = false,
  selectedSection = null,
  anchors = true,
}: SiteRendererProps) {
  // A composição (arquitetura da página) vem do plano de design; o ramo (`template`) só muda o
  // vocabulário das seções. Sem plano, "service-led" (o layout de sempre).
  const composition = compositionOf(spec);
  const Template = COMPOSITIONS[composition];
  const style = siteStyle(spec);
  return (
    <div
      className="ns-site @container min-h-screen bg-ns-background font-ns-body text-ns-text antialiased"
      style={themeToCssVars(spec.theme)}
      data-template={spec.template}
      data-font={spec.theme.font}
      data-composition={composition}
      data-density={spec.design?.density ?? "balanced"}
      data-image={spec.design?.imageTreatment ?? "natural"}
      data-buttons={style.buttons}
      data-header={style.header}
      data-contact={style.contact}
      data-editable={editable ? "" : undefined}
    >
      {editable ? (
        <Template
          spec={spec}
          contactEndpoint={contactEndpoint}
          editable
          selectedSection={selectedSection}
          anchors={anchors}
        />
      ) : (
        <Template spec={spec} contactEndpoint={contactEndpoint} anchors={anchors} />
      )}
      {/* Selo da No Sweat: sempre, fora do SiteSpec (o cliente não consegue tirar). */}
      <NoSweatBadge />
    </div>
  );
}
