import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { cx } from "./styles";

// Barra de vidro grudada no topo (filtros, busca, ações). O conteúdo da página passa por baixo,
// desfocado. Sem "use client".

export type GlassToolbarProps = {
  /** Filtros/busca à esquerda (quebram linha no celular). */
  children?: ReactNode;
  /** Ações à direita (ex.: botão principal, menu "⋯"). */
  actions?: ReactNode;
  /**
   * "floating" (padrão) = cápsula solta, como as barras do iOS 26.
   * "bar" = faixa de ponta a ponta com linha fina embaixo (topo de página/cabeçalho).
   */
  variant?: "floating" | "bar";
  /** Gruda no topo ao rolar (padrão true). */
  sticky?: boolean;
  /** Distância do topo quando gruda (CSS), ex.: "4.5rem" abaixo de um cabeçalho fixo. */
  top?: string;
  as?: "div" | "header" | "nav" | "section";
  className?: string;
} & Omit<HTMLAttributes<HTMLElement>, "className" | "children">;

export function GlassToolbar({
  children,
  actions,
  variant = "floating",
  sticky = true,
  top = "0.75rem",
  as: Tag = "div",
  className,
  style,
  ...rest
}: GlassToolbarProps) {
  const position: CSSProperties | undefined = sticky ? { top, ...style } : style;
  return (
    <Tag
      {...rest}
      style={position}
      className={cx(
        sticky && "sticky z-20",
        variant === "bar"
          ? "glass-bar px-4 py-2.5 sm:px-6"
          : "glass-strong rounded-[26px] px-2 py-2 sm:px-2.5",
        "flex flex-wrap items-center gap-2",
        className,
      )}
    >
      {children && (
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">{children}</div>
      )}
      {actions && <div className="ml-auto flex shrink-0 items-center gap-2">{actions}</div>}
    </Tag>
  );
}
