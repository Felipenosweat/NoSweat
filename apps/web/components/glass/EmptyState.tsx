import type { ReactNode } from "react";
import { cx } from "./styles";

// Estado vazio: ícone num ladrilho de vidro, título, uma frase e (opcional) a ação para sair dele.
// Sem "use client". Escreva o que a pessoa ganha ao agir, não "Nada aqui".

export function EmptyState({
  icon,
  title,
  description,
  actions,
  footnote,
  framed = true,
  headingLevel = 2,
  className,
}: {
  /** SVG decorativo (ganha `aria-hidden` pelo ladrilho). */
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** Botões (ex.: um <GlassButton variant="primary" />). */
  actions?: ReactNode;
  /** Linha pequena embaixo de tudo (ex.: "New here? See how it works"). */
  footnote?: ReactNode;
  /** Dentro de um cartão de vidro (padrão). `false` = só o conteúdo, para dentro de outro cartão. */
  framed?: boolean;
  headingLevel?: 2 | 3;
  className?: string;
}) {
  const Heading = headingLevel === 3 ? "h3" : "h2";
  return (
    <div
      className={cx(
        "flex flex-col items-center px-6 py-10 text-center sm:py-14",
        framed && "glass rounded-2xl",
        className,
      )}
    >
      {icon && (
        <span
          aria-hidden="true"
          className="glass-edge grid size-12 place-items-center rounded-2xl bg-brand/10 text-brand [&>svg]:size-6"
        >
          {icon}
        </span>
      )}
      <Heading
        className={cx(
          "font-display text-[17px] leading-6 font-semibold tracking-[-0.01em] text-balance text-(--glass-fg)",
          icon ? "mt-4" : "",
        )}
      >
        {title}
      </Heading>
      {description && (
        <p className="mt-1.5 max-w-[42ch] text-[15px] leading-[1.6] text-pretty text-(--glass-fg-muted)">
          {description}
        </p>
      )}
      {actions && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">{actions}</div>
      )}
      {footnote && (
        <div className="mt-5 text-[13px] leading-5 text-(--glass-fg-muted)">{footnote}</div>
      )}
    </div>
  );
}
