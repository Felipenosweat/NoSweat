// Classes compartilhadas dos componentes de vidro (e dos botões de components/DashboardUi.tsx).
// Só strings: sem React, sem "use client". As utilidades `glass*` vêm de app/globals.css.

/** Anel de foco do teclado (contorno azul da marca, 2px afastado). */
export const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

export type GlassButtonVariant = "primary" | "secondary" | "destructive" | "ghost";
export type GlassButtonSize = "sm" | "md";

const BUTTON_BASE = `relative inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap select-none motion-safe:transition-[background-color,box-shadow,color,opacity,scale] motion-safe:duration-150 motion-safe:ease-out motion-safe:active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 ${focusRing}`;

const BUTTON_VARIANTS: Record<GlassButtonVariant, string> = {
  // Vidro "tingido" com a cor da marca: cor sólida (texto branco com contraste AA) + brilho no topo.
  primary: "glass-tint text-white [--glass-tint:#0066ff] hover:[--glass-tint:#0052cc]",
  secondary: "glass glass-interactive text-(--glass-fg)",
  destructive: "glass-tint text-white [--glass-tint:#dc2626] hover:[--glass-tint:#b91c1c]",
  ghost:
    "text-(--glass-fg-muted) hover:bg-(--glass-ghost-hover) hover:text-(--glass-fg) active:bg-(--glass-ghost-hover)",
};

const BUTTON_SIZES: Record<GlassButtonSize, string> = {
  md: "min-h-11 px-5 text-[15px] sm:min-h-10",
  sm: "min-h-9 px-3.5 text-sm",
};

const ICON_BUTTON_SIZES: Record<GlassButtonSize, string> = {
  md: "size-11 sm:size-10",
  sm: "size-9",
};

/**
 * Classes de um botão de vidro, para quando não dá para usar <GlassButton /> (ex.: <label>, um
 * <summary> ou um link montado à mão). `iconOnly` = botão redondo só com ícone.
 */
export function glassButtonClass({
  variant = "secondary",
  size = "md",
  iconOnly = false,
  fullWidth = false,
}: {
  variant?: GlassButtonVariant;
  size?: GlassButtonSize;
  iconOnly?: boolean;
  fullWidth?: boolean;
} = {}): string {
  const sizing = iconOnly ? `${ICON_BUTTON_SIZES[size]} p-0` : BUTTON_SIZES[size];
  return `${BUTTON_BASE} ${BUTTON_VARIANTS[variant]} ${sizing}${fullWidth ? " w-full" : ""}`;
}

/** Junta classes ignorando valores vazios (sem dependência externa). */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/** Trilho e cápsula do controle segmentado (usados por GlassSegmented e GlassSegmentedLinks). */
export const segmentedTrack =
  "relative isolate rounded-full bg-(--glass-groove) p-1 shadow-[inset_0_1px_2px_rgb(7_27_51/0.08)]";

export const segmentedPill =
  "glass-pill pointer-events-none absolute inset-y-1 left-1 -z-10 rounded-full motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-[cubic-bezier(0.3,1.25,0.5,1)]";

const SEGMENT_SIZES: Record<GlassButtonSize, string> = {
  md: "min-h-10 px-4 text-[15px] sm:min-h-9",
  sm: "min-h-8 px-3 text-[13px]",
};

export function segmentClass(size: GlassButtonSize, selected: boolean): string {
  return cx(
    "inline-flex min-w-0 items-center justify-center gap-1.5 rounded-full font-semibold whitespace-nowrap motion-safe:transition-colors motion-safe:duration-150 disabled:cursor-not-allowed disabled:opacity-50",
    SEGMENT_SIZES[size],
    selected ? "text-(--glass-fg)" : "text-(--glass-fg-muted) hover:text-(--glass-fg)",
    focusRing,
  );
}

/** Posição da cápsula: colunas iguais, a cápsula anda 100% da própria largura por segmento. */
export function segmentedLayout(count: number, index: number) {
  const safeCount = Math.max(1, count);
  return {
    track: { gridTemplateColumns: `repeat(${safeCount}, minmax(0, 1fr))` },
    pill: {
      width: `calc((100% - 0.5rem) / ${safeCount})`,
      transform: `translateX(${Math.max(0, index) * 100}%)`,
      opacity: index < 0 ? 0 : 1,
    },
  } as const;
}
