import Link from "next/link";
import type { ComponentPropsWithRef, ReactNode } from "react";
import { SpinnerIcon } from "./icons";
import { cx, glassButtonClass, type GlassButtonSize, type GlassButtonVariant } from "./styles";

// Botão em cápsula de vidro. Sem "use client": serve em server e client components.
// Com `href` vira um <Link> do Next (também para endereços externos); sem `href`, um <button>.

type OwnProps = {
  variant?: GlassButtonVariant;
  size?: GlassButtonSize;
  /** Ícone antes do texto (decorativo: o texto é o nome acessível). */
  icon?: ReactNode;
  /** Ícone depois do texto (ex.: seta). */
  trailingIcon?: ReactNode;
  /** Ocupa a largura toda (ex.: botões empilhados no celular). */
  fullWidth?: boolean;
  /** Botão redondo só com ícone. Prefira <GlassIconButton />, que exige o rótulo. */
  iconOnly?: boolean;
  className?: string;
  children?: ReactNode;
};

type ButtonOnlyProps = {
  /** Mostra a rodinha, desliga o botão e marca `aria-busy`. */
  loading?: boolean;
};

export type GlassButtonAsButton = OwnProps &
  ButtonOnlyProps &
  Omit<ComponentPropsWithRef<"button">, keyof OwnProps | keyof ButtonOnlyProps> & {
    href?: undefined;
  };

export type GlassButtonAsLink = OwnProps &
  Omit<ComponentPropsWithRef<typeof Link>, keyof OwnProps | "href"> & {
    href: string;
  };

export type GlassButtonProps = GlassButtonAsButton | GlassButtonAsLink;

function Content({
  icon,
  trailingIcon,
  iconOnly,
  loading,
  children,
}: {
  icon?: ReactNode;
  trailingIcon?: ReactNode;
  iconOnly: boolean;
  loading: boolean;
  children?: ReactNode;
}) {
  const leading = loading ? <SpinnerIcon /> : icon;
  return (
    <>
      {leading && (
        <span
          aria-hidden="true"
          className={cx(
            "inline-flex shrink-0 [&>svg]:size-[1.15em]",
            !iconOnly && children ? "-ml-0.5" : "",
          )}
        >
          {leading}
        </span>
      )}
      {iconOnly ? (
        !leading && (
          <span aria-hidden="true" className="inline-flex shrink-0 [&>svg]:size-[1.15em]">
            {children}
          </span>
        )
      ) : (
        <span className="min-w-0 truncate">{children}</span>
      )}
      {trailingIcon && !iconOnly && (
        <span aria-hidden="true" className="-mr-1 inline-flex shrink-0 [&>svg]:size-[1.05em]">
          {trailingIcon}
        </span>
      )}
    </>
  );
}

export function GlassButton(props: GlassButtonProps) {
  if (props.href !== undefined) {
    const {
      variant,
      size,
      icon,
      trailingIcon,
      fullWidth,
      iconOnly = false,
      className,
      children,
      href,
      ...rest
    } = props;
    return (
      <Link
        href={href}
        {...rest}
        className={cx(glassButtonClass({ variant, size, iconOnly, fullWidth }), className)}
      >
        <Content icon={icon} trailingIcon={trailingIcon} iconOnly={iconOnly} loading={false}>
          {children}
        </Content>
      </Link>
    );
  }

  const {
    variant,
    size,
    icon,
    trailingIcon,
    fullWidth,
    iconOnly = false,
    className,
    children,
    loading = false,
    disabled,
    type = "button",
    ...rest
  } = props;
  return (
    <button
      type={type}
      {...rest}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(glassButtonClass({ variant, size, iconOnly, fullWidth }), className)}
    >
      <Content icon={icon} trailingIcon={trailingIcon} iconOnly={iconOnly} loading={loading}>
        {children}
      </Content>
    </button>
  );
}

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

export type GlassIconButtonProps = DistributiveOmit<
  GlassButtonProps,
  "children" | "icon" | "trailingIcon" | "fullWidth" | "iconOnly" | "aria-label"
> & {
  /** Nome acessível (vira `aria-label` e a dica `title`). Obrigatório: o botão não tem texto. */
  label: string;
  /** O ícone (SVG com `aria-hidden`). */
  children: ReactNode;
};

/** Botão redondo só com ícone (ex.: fechar, "⋯", editar). */
export function GlassIconButton(props: GlassIconButtonProps) {
  // Separado por ramo para o TypeScript manter o tipo de cada um (link x botão) no `...rest`.
  if (props.href !== undefined) {
    const { label, title, children, ...rest } = props;
    return (
      <GlassButton {...rest} iconOnly aria-label={label} title={title ?? label}>
        {children}
      </GlassButton>
    );
  }
  const { label, title, children, ...rest } = props;
  return (
    <GlassButton {...rest} iconOnly aria-label={label} title={title ?? label}>
      {children}
    </GlassButton>
  );
}
