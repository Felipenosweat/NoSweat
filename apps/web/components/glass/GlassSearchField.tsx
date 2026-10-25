import type { ComponentPropsWithRef } from "react";
import { CloseIcon, SearchIcon } from "./icons";
import { cx, focusRing } from "./styles";

// Campo de busca em cápsula de vidro. Sem "use client": funciona num <form method="get"> de server
// component (com `name` e `defaultValue`) ou controlado num client component (`value` + `onChange`).

export type GlassSearchFieldProps = {
  /** Rótulo acessível (fica escondido; o placeholder não serve de rótulo). */
  label: string;
  /**
   * Mostra o "×" para limpar quando `value` não está vazio (só no modo controlado).
   * Sem isto, fica o "×" nativo do navegador.
   */
  onClear?: () => void;
  size?: "sm" | "md";
  /** Classes do contorno (largura etc.), ex.: "w-full sm:w-72". */
  className?: string;
} & Omit<ComponentPropsWithRef<"input">, "type" | "size" | "className">;

export function GlassSearchField({
  label,
  onClear,
  size = "md",
  className,
  value,
  placeholder = "Search",
  ...input
}: GlassSearchFieldProps) {
  const showClear = Boolean(onClear) && typeof value === "string" && value.length > 0;
  return (
    <div className={cx("relative min-w-0", className)}>
      <label className="block">
        <span className="sr-only">{label}</span>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-(--glass-fg-muted)"
        >
          <SearchIcon />
        </span>
        <input
          {...input}
          type="search"
          value={value}
          placeholder={placeholder}
          className={cx(
            // 16px no celular: o iOS não dá zoom no campo.
            "glass block w-full rounded-full pl-10 text-base text-(--glass-fg) placeholder:text-(--glass-fg-muted) sm:text-[15px]",
            size === "sm" ? "h-9" : "h-11 sm:h-10",
            showClear ? "pr-10" : "pr-4",
            onClear ? "[&::-webkit-search-cancel-button]:appearance-none" : "",
            focusRing,
          )}
        />
      </label>
      {showClear && (
        <button
          type="button"
          onClick={onClear}
          aria-label={`Clear ${label.toLowerCase()}`}
          className={cx(
            "absolute inset-y-0 right-1.5 my-auto grid size-8 place-items-center rounded-full text-(--glass-fg-muted) hover:bg-(--glass-ghost-hover) hover:text-(--glass-fg)",
            focusRing,
          )}
        >
          <CloseIcon />
        </button>
      )}
    </div>
  );
}
