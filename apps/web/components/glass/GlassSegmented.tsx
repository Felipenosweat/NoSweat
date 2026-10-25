"use client";

import { useRef, type KeyboardEvent, type ReactNode } from "react";
import { cx, segmentClass, segmentedLayout, segmentedPill, segmentedTrack } from "./styles";

// Controle segmentado (como o do iOS): segmentos de largura igual e uma cápsula que desliza até o
// escolhido. Semântica de grupo de rádio: Tab entra no escolhido, setas trocam (pulando os
// desligados), Home/End vão às pontas. Para filtros pela URL em server components, use
// <GlassSegmentedLinks />.

export type GlassSegmentOption<T extends string> = {
  value: T;
  label: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
  /** Nome acessível quando `label` não é texto (ex.: só um ícone). */
  ariaLabel?: string;
};

export function GlassSegmented<T extends string>({
  options,
  value,
  onChange,
  "aria-label": ariaLabel,
  name,
  size = "md",
  fullWidth = false,
  className,
}: {
  options: ReadonlyArray<GlassSegmentOption<T>>;
  value: T;
  onChange: (value: T) => void;
  /** Nome do grupo para leitores de tela, ex.: "Show". */
  "aria-label": string;
  /** Com `name`, o valor vai junto num <form> (input escondido). */
  name?: string;
  size?: "sm" | "md";
  fullWidth?: boolean;
  className?: string;
}) {
  const groupRef = useRef<HTMLDivElement>(null);
  const index = options.findIndex((option) => option.value === value);
  const layout = segmentedLayout(options.length, index);
  // Sem opção escolhida, o primeiro segmento ligado recebe o Tab.
  const tabStop = index >= 0 ? index : options.findIndex((option) => !option.disabled);

  function select(nextIndex: number) {
    const option = options[nextIndex];
    if (!option || option.disabled) return;
    if (option.value !== value) onChange(option.value);
    const radios = groupRef.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]');
    radios?.[nextIndex]?.focus();
  }

  function step(from: number, delta: 1 | -1): number {
    const count = options.length;
    for (let i = 1; i <= count; i += 1) {
      const candidate = (from + delta * i + count * i) % count;
      if (!options[candidate]?.disabled) return candidate;
    }
    return from;
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, current: number) {
    let next: number | null = null;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") next = step(current, 1);
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = step(current, -1);
    else if (event.key === "Home") next = step(-1, 1);
    else if (event.key === "End") next = step(options.length, -1);
    if (next === null) return;
    event.preventDefault();
    select(next);
  }

  return (
    <div
      ref={groupRef}
      role="radiogroup"
      aria-label={ariaLabel}
      className={cx(segmentedTrack, fullWidth ? "grid w-full" : "inline-grid", className)}
      style={layout.track}
    >
      <span aria-hidden="true" className={segmentedPill} style={layout.pill} />
      {options.map((option, i) => {
        const selected = i === index;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={option.ariaLabel}
            disabled={option.disabled}
            tabIndex={i === tabStop ? 0 : -1}
            onClick={() => select(i)}
            onKeyDown={(event) => onKeyDown(event, i)}
            className={segmentClass(size, selected)}
          >
            {option.icon && (
              <span aria-hidden="true" className="inline-flex shrink-0 [&>svg]:size-4">
                {option.icon}
              </span>
            )}
            <span className="truncate">{option.label}</span>
          </button>
        );
      })}
      {name && <input type="hidden" name={name} value={value} />}
    </div>
  );
}
