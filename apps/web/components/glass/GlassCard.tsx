import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "./styles";

// Cartão de vidro. Sem "use client". Para listas longas prefira `material="regular"` (padrão):
// cada superfície com desfoque custa um pouco de GPU.

const PADDING = {
  none: "",
  sm: "p-4",
  md: "p-5 sm:p-6",
  lg: "p-6 sm:p-8",
} as const;

export type GlassCardProps = {
  /** Elemento HTML (padrão "div"). Use "section" com `aria-labelledby`, "li" dentro de <ul>. */
  as?: "div" | "section" | "article" | "aside" | "li";
  padding?: keyof typeof PADDING;
  /** "regular" = cartões e painéis; "strong" = mais opaco, para por cima de conteúdo movimentado. */
  material?: "regular" | "strong";
  /** Cartão clicável (link/botão por dentro): clareia e sobe a sombra no hover. */
  interactive?: boolean;
  className?: string;
  children?: ReactNode;
} & Omit<HTMLAttributes<HTMLElement>, "className" | "children">;

export function GlassCard({
  as: Tag = "div",
  padding = "md",
  material = "regular",
  interactive = false,
  className,
  children,
  ...rest
}: GlassCardProps) {
  return (
    <Tag
      {...rest}
      className={cx(
        "rounded-2xl",
        material === "strong" ? "glass-strong" : "glass",
        interactive &&
          "glass-interactive hover:glass-raised motion-safe:transition-[background-color,box-shadow] motion-safe:duration-200",
        PADDING[padding],
        className,
      )}
    >
      {children}
    </Tag>
  );
}
