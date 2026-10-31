import type { ReactNode } from "react";
import { PageHeader, fieldClass as baseFieldClass } from "@/components/DashboardUi";
import { cx, focusRing } from "@/components/glass";

// Peças visuais do painel do admin (vidro). Sem "use client" e sem imports do servidor: servem
// para server e client components. Campos, quadros de número (StatTile), link de volta (BackLink)
// e avisos (Notice) são os mesmos do painel do cliente: components/DashboardUi e components/glass.

/**
 * Campo de formulário: o mesmo do app inteiro, com o espaço e a altura que os formulários do
 * admin esperam (o rótulo envolve o campo).
 */
export const fieldClass = cx(baseFieldClass, "mt-1.5 block h-11");

/** Área de texto: o mesmo campo, com várias linhas. */
export const textareaClass = cx(baseFieldClass, "mt-1.5 block py-2.5");

export const labelClass = "block text-[13px] font-semibold text-(--glass-fg-muted)";

export const panelTitle =
  "font-display text-[17px] leading-6 font-semibold tracking-[-0.01em] text-(--glass-fg)";

export const panelText = "text-[15px] leading-[1.6] text-(--glass-fg-muted)";

export const linkClass = cx(
  "rounded-sm font-semibold text-brand underline-offset-4 hover:underline",
  focusRing,
);

/** Cabeçalho das colunas das tabelas de vidro. */
export const th =
  "px-4 py-3 text-[13px] font-semibold whitespace-nowrap text-(--glass-fg-muted) first:pl-5 last:pr-5";
export const td = "px-4 py-3 align-middle first:pl-5 last:pr-5";
export const rowClass =
  "border-t border-(--glass-rim) motion-safe:transition-colors hover:bg-white/45";

/** Cartão de linha no celular: painel embutido, sem desfoque (listas longas pesam no celular). */
export const mobileCard = "glass-inset rounded-xl p-4";

/** Cabeçalho de página do admin: o <PageHeader /> do app, com a contagem ao lado do título. */
export function AdminPageHeader({
  title,
  count,
  description,
  actions,
  back,
}: {
  title: ReactNode;
  count?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  back?: ReactNode;
}) {
  return (
    <PageHeader
      title={title}
      count={count}
      description={description}
      actions={actions}
      back={back}
    />
  );
}
