import Link from "next/link";
import type { ReactNode } from "react";
import { cx, segmentClass, segmentedLayout, segmentedPill, segmentedTrack } from "./styles";

// Controle segmentado feito de links (filtros pela URL, ex.: ?status=live) para server components.
// Mesma aparência do <GlassSegmented />; a cápsula desliza quando a página re-renderiza.

export type GlassSegmentLink = {
  href: string;
  label: ReactNode;
  /** É o filtro atual (`aria-current="page"`). */
  current?: boolean;
  icon?: ReactNode;
};

export function GlassSegmentedLinks({
  items,
  "aria-label": ariaLabel,
  size = "md",
  fullWidth = false,
  className,
}: {
  items: GlassSegmentLink[];
  /** Nome do grupo para leitores de tela, ex.: "Filter sites". */
  "aria-label": string;
  size?: "sm" | "md";
  fullWidth?: boolean;
  className?: string;
}) {
  const index = items.findIndex((item) => item.current);
  const layout = segmentedLayout(items.length, index);
  return (
    <nav
      aria-label={ariaLabel}
      className={cx(fullWidth ? "flex w-full" : "inline-flex", className)}
    >
      <div
        className={cx(segmentedTrack, fullWidth ? "grid w-full" : "inline-grid")}
        style={layout.track}
      >
        <span aria-hidden="true" className={segmentedPill} style={layout.pill} />
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={item.current ? "page" : undefined}
            className={segmentClass(size, Boolean(item.current))}
          >
            {item.icon && (
              <span aria-hidden="true" className="inline-flex shrink-0 [&>svg]:size-4">
                {item.icon}
              </span>
            )}
            <span className="truncate">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
