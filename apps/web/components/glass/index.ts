/**
 * Componentes "Liquid Glass" das telas logadas (painel do cliente e /admin).
 *
 * Como usar
 * - Importe daqui: `import { GlassButton, GlassMenu, ConfirmDialog } from "@/components/glass";`
 *   Os que têm estado ("use client") são GlassSegmented, GlassMenu, GlassSheet e ConfirmDialog; o
 *   resto (botões, cartão, selo, barra, busca, estado vazio, fundo) serve em server components.
 * - O vidro só "aparece" com algo atrás: no layout, ponha <GlassBackdrop /> como primeiro filho de
 *   um contêiner `relative isolate` (fundo com manchas suaves da marca). Sem ele, o vidro fica
 *   praticamente branco, o que também está certo.
 * - Vidro é para a camada de navegação e controles (barras, menus, folhas, botões). Para o
 *   conteúdo, use cartões com moderação: muitas superfícies desfocadas pesam no celular.
 * - Hierarquia de botões: um `variant="primary"` por tela; "secondary" para o resto; "ghost" em
 *   barras; "destructive" só dentro da confirmação. Ações de linha (Edit / Open / Take offline /
 *   Delete) vão num <GlassMenu items={[...]} /> e o que apaga abre um <ConfirmDialog />.
 * - Texto em cima do vidro: `text-(--glass-fg)` / `text-(--glass-fg-muted)` (contraste AA). Dentro
 *   de um contêiner com a classe `glass-on-dark` tudo vira vidro escuro com texto claro.
 * - Classes soltas (app/globals.css): glass, glass-strong, glass-bar, glass-edge, glass-tint,
 *   glass-pill, glass-raised, glass-flat, glass-interactive, glass-on-dark. Não junte com shadow-*.
 * - Acessibilidade já resolvida: foco visível, Esc, foco preso na folha, teclado no menu e no
 *   segmentado; "reduzir transparência", "aumentar contraste" e navegador sem backdrop-filter
 *   viram fundo sólido; "reduzir movimento" desliga as animações.
 */

export { GlassButton, GlassIconButton } from "./GlassButton";
export type {
  GlassButtonAsButton,
  GlassButtonAsLink,
  GlassButtonProps,
  GlassIconButtonProps,
} from "./GlassButton";
export { GlassCard } from "./GlassCard";
export type { GlassCardProps } from "./GlassCard";
export { GlassBadge } from "./GlassBadge";
export type { GlassBadgeTone } from "./GlassBadge";
export { GlassToolbar } from "./GlassToolbar";
export type { GlassToolbarProps } from "./GlassToolbar";
export { GlassSegmented } from "./GlassSegmented";
export type { GlassSegmentOption } from "./GlassSegmented";
export { GlassSegmentedLinks } from "./GlassSegmentedLinks";
export type { GlassSegmentLink } from "./GlassSegmentedLinks";
export { GlassSheet, ConfirmDialog } from "./GlassSheet";
export type { GlassSheetProps, ConfirmDialogProps } from "./GlassSheet";
export { GlassMenu } from "./GlassMenu";
export type {
  GlassMenuAction,
  GlassMenuItem,
  GlassMenuLink,
  GlassMenuSeparator,
} from "./GlassMenu";
export { GlassSearchField } from "./GlassSearchField";
export type { GlassSearchFieldProps } from "./GlassSearchField";
export { EmptyState } from "./EmptyState";
export { GlassBackdrop } from "./GlassBackdrop";
export { MoreIcon, SearchIcon, CloseIcon, SpinnerIcon } from "./icons";
export { cx, focusRing, glassButtonClass } from "./styles";
export type { GlassButtonSize, GlassButtonVariant } from "./styles";
