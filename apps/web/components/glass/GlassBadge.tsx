import type { ReactNode } from "react";
import { cx } from "./styles";

// Selo em cápsula de vidro com bolinha de status (estática: nada de pulsar). Sem "use client".

export type GlassBadgeTone = "live" | "draft" | "pending" | "info" | "danger" | "neutral";

// `glass: true` = superfície de vidro neutra; os tons coloridos levam só a borda de vidro.
const TONES: Record<GlassBadgeTone, { chip: string; dot: string; glass: boolean }> = {
  live: { chip: "bg-emerald-50/85 text-emerald-800", dot: "bg-emerald-500", glass: false },
  draft: { chip: "text-(--glass-fg)", dot: "bg-slate-400", glass: true },
  pending: { chip: "bg-amber-50/85 text-amber-800", dot: "bg-amber-500", glass: false },
  info: { chip: "bg-blue-50/85 text-[#0047b3]", dot: "bg-brand", glass: false },
  danger: { chip: "bg-red-50/85 text-red-700", dot: "bg-red-500", glass: false },
  neutral: { chip: "text-(--glass-fg)", dot: "bg-slate-400", glass: true },
};

export function GlassBadge({
  tone = "neutral",
  dot,
  size = "md",
  className,
  children,
}: {
  tone?: GlassBadgeTone;
  /** Bolinha de status. Padrão: ligada em todo tom menos "neutral". */
  dot?: boolean;
  size?: "sm" | "md";
  className?: string;
  children: ReactNode;
}) {
  const style = TONES[tone];
  const showDot = dot ?? tone !== "neutral";
  return (
    <span
      className={cx(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full font-medium whitespace-nowrap",
        // `glass` não desfoca mais (desempenho): o selo pequeno pode ficar sobre uma foto (miniatura
        // do site), então leva um desfoque leve só dele.
        style.glass ? "glass glass-flat backdrop-blur-sm" : "glass-edge",
        size === "sm" ? "px-2 py-px text-xs leading-5" : "px-2.5 py-0.5 text-[13px] leading-5",
        style.chip,
        className,
      )}
    >
      {showDot && <span aria-hidden="true" className={cx("size-1.5 rounded-full", style.dot)} />}
      {children}
    </span>
  );
}
